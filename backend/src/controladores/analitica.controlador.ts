import type { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { ModeloProducto } from '../modelos/producto.modelo';
import { ModeloVenta } from '../modelos/venta.modelo';
import type { MensajeRespuesta, MetodoPago, ResumenHoy, RespuestaApi, VentaDiaria } from '../modelos/tipos';
import { diasSemanaCortos, metodosPago } from '../modelos/tipos';
import type { UsuarioToken } from '../middleware/autenticar';

interface RangoFechasUtcMenosCinco {
  inicio: Date;
  fin: Date;
}

interface ResultadoResumenHoyAgrupado {
  totalVentasHoy: number;
  gananciaNeta: number;
}

interface ResultadoAgrupadoVentas {
  _id: string;
  total: number;
}

interface ResultadoVentasMetodoPago {
  _id: MetodoPago;
  total: number;
}

interface RespuestaReporte {
  totalIngresos: number;
  gananciaTotal: number;
  totalVentas: number;
  unidadesVendidas: number;
  ventasPorDia: VentaDiaria[];
  ventasPorMetodoPago: ResultadoVentasMetodoPago[];
  ventasPorCajero: Array<{ usuarioId: string; nombre: string; totalVentas: number; totalIngresos: number; gananciaTotal: number }>;
}

interface ResultadoVentasCajero {
  usuarioId: string;
  nombre: string;
  totalVentas: number;
  totalIngresos: number;
  gananciaTotal: number;
}

interface RespuestaProductosMasVendidos {
  productos: Array<{
    productoId: string;
    nombre: string;
    unidadesVendidas: number;
    ingresosGenerados: number;
    gananciaGenerada: number;
  }>;
  total: number;
  limite: number;
}

const MILISEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;
const DESPLAZAMIENTO_UTC_MENOS_CINCO_MS = 5 * 60 * 60 * 1000;

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
  return esFin ? new Date(inicio.getTime() + MILISEGUNDOS_POR_DIA - 1) : inicio;
};

const obtenerPartesUtcMenosCinco = (fecha: Date): {
  anio: number;
  mes: number;
  dia: number;
  indiceDia: number;
} => {
  const fechaAjustada = new Date(fecha.getTime() - DESPLAZAMIENTO_UTC_MENOS_CINCO_MS);

  return {
    anio: fechaAjustada.getUTCFullYear(),
    mes: fechaAjustada.getUTCMonth(),
    dia: fechaAjustada.getUTCDate(),
    indiceDia: fechaAjustada.getUTCDay()
  };
};

const obtenerRangoDiaActualUtcMenosCinco = (fechaReferencia: Date = new Date()): RangoFechasUtcMenosCinco => {
  const partes = obtenerPartesUtcMenosCinco(fechaReferencia);
  const inicio = new Date(Date.UTC(partes.anio, partes.mes, partes.dia, 5, 0, 0, 0));
  const fin = new Date(inicio.getTime() + MILISEGUNDOS_POR_DIA - 1);

  return { inicio, fin };
};

const obtenerClaveFechaUtcMenosCinco = (fecha: Date): string => fecha.toISOString().slice(0, 10);

const convertirAObjectId = (valor: string | undefined): mongoose.Types.ObjectId | string | undefined => {
  if (valor === undefined || valor.trim().length === 0) {
    return undefined;
  }

  return mongoose.Types.ObjectId.isValid(valor) ? new mongoose.Types.ObjectId(valor) : valor;
};

export const obtenerResumenHoy = async (
  req: Request,
  res: Response<RespuestaApi<ResumenHoy>>,
  next: NextFunction
): Promise<void> => {
  try {
    const usuario = req.usuario as UsuarioToken;
    const { inicio, fin } = obtenerRangoDiaActualUtcMenosCinco();
    const tiendaId = convertirAObjectId(usuario.tiendaId);
    const [ventasHoyAgrupadas, productosStockBajoAgrupados] = await Promise.all([
      ModeloVenta.aggregate<ResultadoResumenHoyAgrupado>([
        {
          $addFields: {
            fechaConvertida: { $dateFromString: { dateString: '$fecha' } }
          }
        },
        {
          $match: {
            fechaConvertida: { $gte: inicio, $lte: fin },
            tiendaId
          }
        },
        {
          $group: {
            _id: null,
            totalVentasHoy: { $sum: '$total' },
            gananciaNeta: { $sum: '$ganancia' }
          }
        }
      ]).exec(),
      ModeloProducto.aggregate<{ cantidad: number }>([
        {
          $match: {
            tiendaId,
            $expr: { $lt: ['$stock', '$stockMinimo'] }
          }
        },
        {
          $count: 'cantidad'
        }
      ]).exec()
    ]);

    const resumenHoy: ResumenHoy = {
      totalVentasHoy: ventasHoyAgrupadas[0]?.totalVentasHoy ?? 0,
      gananciaNeta: ventasHoyAgrupadas[0]?.gananciaNeta ?? 0,
      productosStockBajo: productosStockBajoAgrupados[0]?.cantidad ?? 0
    };

    res.json({
      mensaje: 'Resumen del día obtenido correctamente.',
      datos: resumenHoy
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const obtenerVentasSemanales = async (
  req: Request,
  res: Response<RespuestaApi<VentaDiaria[]>>,
  next: NextFunction
): Promise<void> => {
  try {
    const usuario = req.usuario as UsuarioToken;
    const { inicio, fin } = obtenerRangoDiaActualUtcMenosCinco();
    const inicioSemana = new Date(inicio.getTime() - 6 * MILISEGUNDOS_POR_DIA);
    const tiendaId = convertirAObjectId(usuario.tiendaId);

    const ventasAgrupadas = await ModeloVenta.aggregate<ResultadoAgrupadoVentas>([
      {
        $addFields: {
          fechaConvertida: { $dateFromString: { dateString: '$fecha' } }
        }
      },
        {
          $match: {
            fechaConvertida: { $gte: inicioSemana, $lte: fin },
            tiendaId
          }
        },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$fechaConvertida',
              timezone: '-05:00'
            }
          },
          total: { $sum: '$total' }
        }
      }
    ]).exec();

    const mapaVentas = new Map<string, number>(
      ventasAgrupadas.map((venta) => [venta._id, venta.total])
    );

    const ventasSemanales: VentaDiaria[] = Array.from({ length: 7 }, (_valor, indice) => {
      const fechaActual = new Date(inicioSemana.getTime() + indice * MILISEGUNDOS_POR_DIA);
      const claveFecha = obtenerClaveFechaUtcMenosCinco(fechaActual);

      return {
        dia: diasSemanaCortos[fechaActual.getUTCDay()] ?? '',
        total: mapaVentas.get(claveFecha) ?? 0
      };
    });

    res.json({
      mensaje: 'Ventas semanales obtenidas correctamente.',
      datos: ventasSemanales
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const obtenerReporte = async (
  req: Request<Record<string, never>, RespuestaApi<RespuestaReporte> | MensajeRespuesta, Record<string, never>, { desde?: string; hasta?: string; usuarioId?: string }>,
  res: Response<RespuestaApi<RespuestaReporte> | MensajeRespuesta>,
  next: NextFunction
): Promise<void> => {
  try {
    const usuario = req.usuario as UsuarioToken;
    const fechaDesdeTexto = req.query.desde as string | undefined;
    const fechaHastaTexto = req.query.hasta as string | undefined;
    const usuarioId = req.query.usuarioId as string | undefined;
    const tiendaId = convertirAObjectId(usuario.tiendaId);
    const usuarioObjectId = convertirAObjectId(usuarioId);

    const inicio = convertirFechaLocalUtcMenosCinco(fechaDesdeTexto, false);
    const fin = convertirFechaLocalUtcMenosCinco(fechaHastaTexto, true);

    if ((inicio !== null && Number.isNaN(inicio.getTime())) || (fin !== null && Number.isNaN(fin.getTime()))) {
      res.status(400).json({ mensaje: 'El rango de fechas no es válido.', datos: null });
      return;
    }

    const match: Record<string, unknown> = {
      tiendaId
    };

    if (inicio !== null || fin !== null) {
      match.fechaConvertida = {};
      if (inicio !== null) {
        (match.fechaConvertida as Record<string, Date>).$gte = inicio;
      }
      if (fin !== null) {
        (match.fechaConvertida as Record<string, Date>).$lte = fin;
      }
    }

    if (usuarioObjectId !== undefined) {
      match.usuarioId = usuarioObjectId;
    }

    const [resumenVentas, unidadesVendidas, ventasPorDiaAgrupadas, ventasPorMetodoPagoAgrupadas, ventasPorCajeroAgrupadas] = await Promise.all([
      ModeloVenta.aggregate<{
        totalIngresos: number;
        gananciaTotal: number;
        totalVentas: number;
      }>([
        {
          $addFields: {
            fechaConvertida: { $dateFromString: { dateString: '$fecha' } }
          }
        },
        { $match: match },
        {
          $group: {
            _id: null,
            totalIngresos: { $sum: '$total' },
            gananciaTotal: { $sum: '$ganancia' },
            totalVentas: { $sum: 1 }
          }
        }
      ]).exec(),
      ModeloVenta.aggregate<{ unidadesVendidas: number }>([
        {
          $addFields: {
            fechaConvertida: { $dateFromString: { dateString: '$fecha' } }
          }
        },
        { $match: match },
        { $unwind: '$productos' },
        {
          $group: {
            _id: null,
            unidadesVendidas: { $sum: '$productos.cantidad' }
          }
        }
      ]).exec(),
      ModeloVenta.aggregate<ResultadoAgrupadoVentas>([
        {
          $addFields: {
            fechaConvertida: { $dateFromString: { dateString: '$fecha' } }
          }
        },
        { $match: match },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$fechaConvertida',
                timezone: '-05:00'
              }
            },
            total: { $sum: '$total' }
          }
        },
        { $sort: { _id: 1 } }
      ]).exec(),
      ModeloVenta.aggregate<ResultadoVentasMetodoPago>([
        {
          $addFields: {
            fechaConvertida: { $dateFromString: { dateString: '$fecha' } }
          }
        },
        { $match: match },
        {
          $group: {
            _id: '$metodoPago',
            total: { $sum: '$total' }
          }
        }
      ]).exec()
      ,
      ModeloVenta.aggregate<ResultadoVentasCajero>([
        {
          $addFields: {
            fechaConvertida: { $dateFromString: { dateString: '$fecha' } }
          }
        },
        { $match: { ...match } },
        {
          $group: {
            _id: '$usuarioId',
            nombre: { $first: '$cajero' },
            totalVentas: { $sum: 1 },
            totalIngresos: { $sum: '$total' },
            gananciaTotal: { $sum: '$ganancia' }
          }
        },
        {
          $lookup: {
            from: 'usuarios',
            localField: '_id',
            foreignField: '_id',
            as: 'usuario'
          }
        },
        {
          $unwind: {
            path: '$usuario',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            usuarioId: '$_id',
            nombre: { $ifNull: ['$usuario.nombre', '$nombre'] },
            totalVentas: 1,
            totalIngresos: 1,
            gananciaTotal: 1
          }
        }
      ]).exec()
    ]);

    const reporte: RespuestaReporte = {
      totalIngresos: resumenVentas[0]?.totalIngresos ?? 0,
      gananciaTotal: resumenVentas[0]?.gananciaTotal ?? 0,
      totalVentas: resumenVentas[0]?.totalVentas ?? 0,
      unidadesVendidas: unidadesVendidas[0]?.unidadesVendidas ?? 0,
      ventasPorDia: ventasPorDiaAgrupadas.map((venta) => ({
        dia: venta._id,
        total: venta.total
      })),
      ventasPorMetodoPago: ventasPorMetodoPagoAgrupadas.filter((item) => metodosPago.includes(item._id)),
      ventasPorCajero: ventasPorCajeroAgrupadas.map((cajero) => ({
        usuarioId: cajero.usuarioId,
        nombre: cajero.nombre,
        totalVentas: cajero.totalVentas,
        totalIngresos: cajero.totalIngresos,
        gananciaTotal: cajero.gananciaTotal
      }))
    };

    res.json({ mensaje: 'Reporte obtenido correctamente.', datos: reporte });
  } catch (error: unknown) {
    next(error);
  }
};

export const obtenerProductosMasVendidos = async (
  req: Request<Record<string, never>, RespuestaApi<RespuestaProductosMasVendidos> | MensajeRespuesta, Record<string, never>, { desde?: string; hasta?: string; limite?: string; usuarioId?: string }>,
  res: Response<RespuestaApi<RespuestaProductosMasVendidos> | MensajeRespuesta>,
  next: NextFunction
): Promise<void> => {
  try {
    const usuario = req.usuario as UsuarioToken;
    const fechaDesdeTexto = req.query.desde as string | undefined;
    const fechaHastaTexto = req.query.hasta as string | undefined;
    const limiteTexto = req.query.limite as string | undefined;
    const tiendaId = convertirAObjectId(usuario.tiendaId);
    const usuarioId = convertirAObjectId(req.query.usuarioId as string | undefined);

    const inicio = convertirFechaLocalUtcMenosCinco(fechaDesdeTexto, false);
    const fin = convertirFechaLocalUtcMenosCinco(fechaHastaTexto, true);
    const limite = Math.max(Number.parseInt(limiteTexto ?? '10', 10) || 10, 1);

    if ((inicio !== null && Number.isNaN(inicio.getTime())) || (fin !== null && Number.isNaN(fin.getTime()))) {
      res.status(400).json({ mensaje: 'El rango de fechas no es válido.', datos: null });
      return;
    }

    const match: Record<string, unknown> = { tiendaId };
    if (inicio !== null || fin !== null) {
      match.fechaConvertida = {};
      if (inicio !== null) {
        (match.fechaConvertida as Record<string, Date>).$gte = inicio;
      }
      if (fin !== null) {
        (match.fechaConvertida as Record<string, Date>).$lte = fin;
      }
    }

    if (usuarioId !== undefined) {
      match.usuarioId = usuarioId;
    }

    const productos = await ModeloVenta.aggregate<{
      productoId: string;
      nombre: string;
      unidadesVendidas: number;
      ingresosGenerados: number;
      gananciaGenerada: number;
    }>([
      {
        $addFields: {
          fechaConvertida: { $dateFromString: { dateString: '$fecha' } }
        }
      },
      { $match: match },
      { $unwind: '$productos' },
      {
        $group: {
          _id: '$productos.productoId',
          unidadesVendidas: { $sum: '$productos.cantidad' },
          ingresosGenerados: { $sum: '$productos.subtotal' },
          gananciaGenerada: { $sum: '$productos.subtotal' }
        }
      },
      { $sort: { unidadesVendidas: -1 } },
      { $limit: limite },
      {
        $lookup: {
          from: 'productos',
          localField: '_id',
          foreignField: 'id',
          as: 'producto'
        }
      },
      {
        $unwind: {
          path: '$producto',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          productoId: '$_id',
          nombre: { $ifNull: ['$producto.nombre', 'Producto sin nombre'] },
          unidadesVendidas: 1,
          ingresosGenerados: 1,
          gananciaGenerada: 1
        }
      }
    ]).exec();

    res.json({
      mensaje: 'Productos más vendidos obtenidos correctamente.',
      datos: {
        productos,
        total: productos.length,
        limite
      }
    });
  } catch (error: unknown) {
    next(error);
  }
};
