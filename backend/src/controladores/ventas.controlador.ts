import type { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import { ModeloProducto } from '../modelos/producto.modelo';
import { ModeloVenta } from '../modelos/venta.modelo';
import type {
  LineaVenta,
  MensajeRespuesta,
  RespuestaApi,
  SolicitudCrearVenta,
  Venta
} from '../modelos/tipos';
import { esMetodoPagoValido } from '../modelos/tipos';
import { crearRespuestaApi, crearRespuestaError, crearRespuestaSinDatos } from '../utilidades/respuestas';
import type { UsuarioToken } from '../middleware/autenticar';

interface ParametrosId {
  id: string;
}

interface ConsultaHistorial {
  desde?: string;
  hasta?: string;
  metodoPago?: string;
  pagina?: string;
  limite?: string;
  usuarioId?: string;
}

interface HistorialVentasRespuesta {
  ventas: Array<Omit<Venta, 'usuarioId'> & { usuarioId?: { nombre?: string }; cajeroNombre: string }>;
  total: number;
  pagina: number;
  totalPaginas: number;
  resumen: {
    totalRecaudado: number;
    ganancia: number;
    ticketPromedio: number;
  };
}

const generarIdentificador = (prefijo: string): string => `${prefijo}-${randomUUID()}`;

const esTextoValido = (valor: unknown): valor is string => typeof valor === 'string' && valor.trim().length > 0;

const convertirAObjectId = (valor: string | undefined): mongoose.Types.ObjectId | undefined => {
  if (valor === undefined || valor.trim().length === 0) {
    return undefined;
  }

  return mongoose.Types.ObjectId.isValid(valor) ? new mongoose.Types.ObjectId(valor) : undefined;
};

const convertirFechaLocalUtcMenosCinco = (texto: string | undefined, esFin: boolean): Date | null => {
  if (texto === undefined || texto.trim().length === 0) {
    return null;
  }

  const partes = texto.trim().split('-').map((parte) => Number.parseInt(parte, 10));
  if (partes.length !== 3 || partes.some((parte) => Number.isNaN(parte))) {
    return null;
  }

  const [anio, mes, dia] = partes as [number, number, number];
  const inicio = new Date(Date.UTC(anio, mes - 1, dia, 5, 0, 0, 0));
  return esFin ? new Date(inicio.getTime() + 24 * 60 * 60 * 1000 - 1) : inicio;
};

const validarSolicitudVenta = (solicitud: SolicitudCrearVenta): string | null => {
  if (!Array.isArray(solicitud.productos) || solicitud.productos.length === 0) {
    return 'La venta debe incluir al menos un producto.';
  }

  for (const linea of solicitud.productos) {
    if (!esTextoValido(linea.productoId)) {
      return 'Cada línea de venta debe incluir un productoId válido.';
    }

    if (!Number.isInteger(linea.cantidad) || linea.cantidad < 1) {
      return 'Cada línea de venta debe incluir una cantidad válida mayor o igual a 1.';
    }
  }

  if (!esMetodoPagoValido(solicitud.metodoPago)) {
    return 'El método de pago debe ser Efectivo, Tarjeta o Transferencia.';
  }

  if (!esTextoValido(solicitud.cajero)) {
    return 'El cajero es obligatorio.';
  }

  return null;
};

export const obtenerVentas = async (
  req: Request,
  res: Response<RespuestaApi<Venta[]>>,
  next: NextFunction
): Promise<void> => {
  try {
    const usuario = req.usuario as UsuarioToken;
    const ventas = (await ModeloVenta.find({ tiendaId: usuario.tiendaId }).sort({ fecha: -1 }).lean().exec()) as Venta[];
    res.json(crearRespuestaApi('Ventas obtenidas correctamente.', ventas));
  } catch (error: unknown) {
    next(error);
  }
};

export const obtenerVentaPorId = async (
  req: Request<ParametrosId>,
  res: Response<RespuestaApi<Venta> | MensajeRespuesta>,
  next: NextFunction
): Promise<void> => {
  try {
    const usuario = req.usuario as UsuarioToken;
    const venta = (await ModeloVenta.findOne({ id: req.params.id, tiendaId: usuario.tiendaId }).lean().exec()) as Venta | null;

    if (venta === null) {
      res.status(404).json(crearRespuestaError('No se encontró la venta solicitada.'));
      return;
    }

    res.json(crearRespuestaApi('Venta obtenida correctamente.', venta));
  } catch (error: unknown) {
    next(error);
  }
};

export const crearVenta = async (
  req: Request<Record<string, never>, RespuestaApi<Venta> | MensajeRespuesta, SolicitudCrearVenta>,
  res: Response<RespuestaApi<Venta> | MensajeRespuesta>,
  next: NextFunction
): Promise<void> => {
  const sesion = await mongoose.startSession();

  try {
    const usuario = req.usuario as UsuarioToken;
    const errorValidacion = validarSolicitudVenta(req.body);
    if (errorValidacion !== null) {
      res.status(400).json(crearRespuestaError(errorValidacion));
      return;
    }

    const idVenta = generarIdentificador('venta');
    const fechaVenta = req.body.fecha?.trim() ?? new Date().toISOString();

    let ventaCreada: Venta | null = null;

    await sesion.withTransaction(async () => {
      const lineasCalculadas: LineaVenta[] = [];
      let gananciaTotal = 0;
      let totalVenta = 0;

      for (const lineaSolicitud of req.body.productos) {
        const producto = await ModeloProducto.findOne({ id: lineaSolicitud.productoId, tiendaId: usuario.tiendaId }).session(sesion).exec();

        if (producto === null) {
          throw new Error(`El producto '${lineaSolicitud.nombre ?? lineaSolicitud.productoId}' no fue encontrado`);
        }

        if (producto.stock < lineaSolicitud.cantidad) {
          throw new Error(
            `Stock insuficiente para '${producto.nombre}'. Disponible: ${producto.stock}, solicitado: ${lineaSolicitud.cantidad}`
          );
        }

        const precioUnitario = producto.precio;
        const subtotal = precioUnitario * lineaSolicitud.cantidad;

        lineasCalculadas.push({
          productoId: producto.id,
          nombre: producto.nombre,
          cantidad: lineaSolicitud.cantidad,
          precioUnitario,
          subtotal
        });

        gananciaTotal += subtotal;
        totalVenta += subtotal;

        const resultadoActualizacion = await ModeloProducto.updateOne(
          { id: producto.id, stock: { $gte: lineaSolicitud.cantidad } },
          {
            $inc: { stock: -lineaSolicitud.cantidad },
            $set: { fechaActualizacion: new Date().toISOString() }
          },
          { session: sesion }
        ).exec();

        if (resultadoActualizacion.modifiedCount !== 1) {
          throw new Error(
            `Stock insuficiente para '${producto.nombre}'. Disponible: ${producto.stock}, solicitado: ${lineaSolicitud.cantidad}`
          );
        }
      }

      ventaCreada = await ModeloVenta.create(
        [
          {
            id: idVenta,
            productos: lineasCalculadas,
            total: totalVenta,
            ganancia: gananciaTotal,
            metodoPago: req.body.metodoPago,
            fecha: fechaVenta,
            cajero: req.body.cajero.trim(),
            usuarioId: usuario.usuarioMongoId ?? usuario.usuarioId,
            tiendaId: usuario.tiendaId
          }
        ],
        { session: sesion }
      ).then((ventas) => ventas[0] ?? null);
    });

    if (ventaCreada === null) {
        res.status(500).json(crearRespuestaError('No fue posible crear la venta.'));
        return;
      }

    res.status(201).json(crearRespuestaApi('Venta creada correctamente.', ventaCreada));
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes('no fue encontrado')) {
        res.status(404).json(crearRespuestaError(error.message));
        return;
      }

      if (error.message.includes('Stock insuficiente')) {
        res.status(400).json(crearRespuestaError(error.message));
        return;
      }
    }

    next(error);
  } finally {
    sesion.endSession();
  }
};

export const actualizarVenta = async (
  req: Request<ParametrosId, RespuestaApi<Venta> | MensajeRespuesta, SolicitudCrearVenta>,
  res: Response<RespuestaApi<Venta> | MensajeRespuesta>,
  next: NextFunction
): Promise<void> => {
  try {
    const usuario = req.usuario as UsuarioToken;
    const ventaActualizada = await ModeloVenta.findOneAndUpdate(
      { id: req.params.id, tiendaId: usuario.tiendaId },
      {
        productos: req.body.productos.map((linea) => ({
          productoId: linea.productoId.trim(),
          nombre: linea.productoId.trim(),
          cantidad: linea.cantidad,
          precioUnitario: 0,
          subtotal: 0
        })),
        total: 0,
        ganancia: 0,
        metodoPago: req.body.metodoPago,
        fecha: req.body.fecha?.trim() ?? new Date().toISOString(),
        cajero: req.body.cajero.trim()
      },
      { new: true, runValidators: true }
    )
      .lean()
      .exec();

    if (ventaActualizada === null) {
      res.status(404).json(crearRespuestaError('No se encontró la venta para actualizar.'));
      return;
    }

    res.json(crearRespuestaApi('Venta actualizada correctamente.', ventaActualizada as Venta));
  } catch (error: unknown) {
    next(error);
  }
};

export const eliminarVenta = async (
  req: Request<ParametrosId>,
  res: Response<MensajeRespuesta>,
  next: NextFunction
): Promise<void> => {
  try {
    const usuario = req.usuario as UsuarioToken;
    const resultado = await ModeloVenta.deleteOne({ id: req.params.id, tiendaId: usuario.tiendaId }).exec();

    if (resultado.deletedCount === 0) {
      res.status(404).json(crearRespuestaError('No se encontró la venta para eliminar.'));
      return;
    }

    res.json(crearRespuestaSinDatos('Venta eliminada correctamente.'));
  } catch (error: unknown) {
    next(error);
  }
};

export const obtenerHistorial = async (
  req: Request<Record<string, never>, RespuestaApi<HistorialVentasRespuesta> | MensajeRespuesta, Record<string, never>, ConsultaHistorial>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const usuario = req.usuario as UsuarioToken;
    const pagina = Math.max(Number.parseInt(req.query.pagina ?? '1', 10) || 1, 1);
    const limite = Math.max(Number.parseInt(req.query.limite ?? '20', 10) || 20, 1);
    const metodoPago = req.query.metodoPago?.trim();
    const usuarioId = req.query.usuarioId?.trim();
    const tiendaId = convertirAObjectId(usuario.tiendaId);
    const usuarioObjectId = convertirAObjectId(usuarioId);

    const filtros: Record<string, unknown> = {
      tiendaId
    };

    if (metodoPago !== undefined && metodoPago !== '' && metodoPago !== 'Todos') {
      if (!esMetodoPagoValido(metodoPago)) {
        res.status(400).json({ mensaje: 'El método de pago no es válido.', datos: null });
        return;
      }

      filtros.metodoPago = metodoPago;
    }

    if (usuarioObjectId !== undefined) {
      filtros.usuarioId = usuarioObjectId;
    }

    const fechaDesde = req.query.desde?.trim();
    const fechaHasta = req.query.hasta?.trim();
    const inicio = convertirFechaLocalUtcMenosCinco(fechaDesde, false);
    const fin = convertirFechaLocalUtcMenosCinco(fechaHasta, true);

    if (fechaDesde !== undefined && fechaDesde !== '' && inicio === null) {
      res.status(400).json({ mensaje: 'La fecha inicial no es válida.', datos: null });
      return;
    }

    if (inicio !== null) {
      filtros.fecha = { ...(filtros.fecha as Record<string, string> | undefined), $gte: inicio.toISOString() };
    }

    if (fechaHasta !== undefined && fechaHasta !== '' && fin === null) {
      res.status(400).json({ mensaje: 'La fecha final no es válida.', datos: null });
      return;
    }

    if (fin !== null) {
      filtros.fecha = { ...(filtros.fecha as Record<string, string> | undefined), $lte: fin.toISOString() };
    }

    const total = await ModeloVenta.countDocuments(filtros).exec();
    const totalPaginas = Math.max(Math.ceil(total / limite), 1);
    const paginaNormalizada = Math.min(pagina, totalPaginas);
    const desplazamiento = (paginaNormalizada - 1) * limite;

    const ventas = (await ModeloVenta.find(filtros)
      .sort({ fecha: -1 })
      .skip(desplazamiento)
      .limit(limite)
      .populate('usuarioId', 'nombre')
      .lean()
      .exec()) as (Venta & { usuarioId?: { nombre?: string } })[];

    const ventasCompletas = ventas.map((venta) => ({
      ...venta,
      cajeroNombre: venta.usuarioId?.nombre ?? venta.cajero
    }));

    const resumenGlobal = await ModeloVenta.aggregate<{
      totalRecaudado: number;
      ganancia: number;
    }>([
      { $match: filtros },
      {
        $group: {
          _id: null,
          totalRecaudado: { $sum: '$total' },
          ganancia: { $sum: '$ganancia' }
        }
      }
    ]).exec();

    const resumen: HistorialVentasRespuesta['resumen'] = {
      totalRecaudado: resumenGlobal[0]?.totalRecaudado ?? 0,
      ganancia: resumenGlobal[0]?.ganancia ?? 0,
      ticketPromedio: total > 0 ? (resumenGlobal[0]?.totalRecaudado ?? 0) / total : 0
    };

    res.json(
      crearRespuestaApi('Historial de ventas obtenido correctamente.', {
        ventas: ventasCompletas,
        total,
        pagina: paginaNormalizada,
        totalPaginas,
        resumen
      })
    );
  } catch (error: unknown) {
    next(error);
  }
};
