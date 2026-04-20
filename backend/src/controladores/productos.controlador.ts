import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { ModeloCategoria } from '../modelos/categoria.modelo';
import { ModeloProducto } from '../modelos/producto.modelo';
import type {
  MensajeRespuesta,
  Producto,
  RespuestaApi,
  SolicitudActualizarProducto,
  SolicitudCrearProducto
} from '../modelos/tipos';
import { crearRespuestaApi, crearRespuestaError, crearRespuestaSinDatos } from '../utilidades/respuestas';
import type { UsuarioToken } from '../middleware/autenticar';

interface ParametrosId {
  id: string;
}

const generarIdentificador = (prefijo: string): string => `${prefijo}-${randomUUID()}`;

const STOCK_MINIMO_DEFECTO = 10;

const esTextoValido = (valor: unknown): valor is string => typeof valor === 'string' && valor.trim().length > 0;

const esNumeroEnteroValido = (valor: unknown): valor is number =>
  typeof valor === 'number' && Number.isFinite(valor) && Number.isInteger(valor);

const validarProducto = (producto: SolicitudCrearProducto): string | null => {
  if (!esTextoValido(producto.nombre)) return 'El nombre del producto es obligatorio.';
  if (!esNumeroEnteroValido(producto.precio) || producto.precio <= 0) return 'El precio del producto debe ser mayor que cero.';
  if (!esNumeroEnteroValido(producto.stock) || producto.stock < 0) return 'El stock del producto debe ser igual o mayor que cero.';
  if (!esNumeroEnteroValido(producto.stockMinimo) || producto.stockMinimo < 0) return 'El stock mínimo del producto debe ser igual o mayor que cero.';
  if (!esTextoValido(producto.categoria)) return 'La categoría del producto es obligatoria.';
  if (!esTextoValido(producto.imagenUrl)) return 'La imagen del producto es obligatoria.';
  return null;
};

const validarActualizacionProducto = (producto: SolicitudActualizarProducto): string | null => {
  if (producto.nombre !== undefined && !esTextoValido(producto.nombre)) return 'El nombre del producto no puede estar vacío.';
  if (producto.precio !== undefined && (!esNumeroEnteroValido(producto.precio) || producto.precio <= 0)) return 'El precio del producto debe ser mayor que cero.';
  if (producto.stock !== undefined && (!esNumeroEnteroValido(producto.stock) || producto.stock < 0)) return 'El stock del producto debe ser igual o mayor que cero.';
  if (producto.stockMinimo !== undefined && (!esNumeroEnteroValido(producto.stockMinimo) || producto.stockMinimo < 0)) {
    return 'El stock mínimo del producto debe ser igual o mayor que cero.';
  }
  if (producto.categoria !== undefined && !esTextoValido(producto.categoria)) return 'La categoría del producto no puede estar vacía.';
  if (producto.imagenUrl !== undefined && !esTextoValido(producto.imagenUrl)) return 'La imagen del producto no puede estar vacía.';
  return null;
};

const normalizarCodigoProducto = (valor: unknown): string | undefined => {
  if (!esTextoValido(valor)) {
    return undefined;
  }

  const codigo = valor.trim().toUpperCase();
  return codigo.length > 0 ? codigo : undefined;
};

const obtenerMensajeDuplicado = (error: unknown): string | null => {
  if (typeof error !== 'object' || error === null) {
    return null;
  }

  const errorMongo = error as { code?: number; keyPattern?: Record<string, unknown> };
  if (errorMongo.code !== 11000) {
    return null;
  }

  if (errorMongo.keyPattern?.codigoProducto !== undefined) {
    return 'Ya existe un producto con ese código en esta tienda.';
  }

  if (errorMongo.keyPattern?.id !== undefined) {
    return 'Ya existe un producto con ese identificador.';
  }

  return 'Ya existe un producto duplicado.';
};

const sincronizarCategoria = async (tiendaId: string, categoria: string): Promise<void> => {
  await ModeloCategoria.updateOne(
    { tiendaId, nombre: categoria },
    {
      $setOnInsert: {
        nombre: categoria,
        tiendaId,
        fechaCreacion: new Date()
      }
    },
    { upsert: true }
  ).exec();
};

const construirProducto = (producto: SolicitudCrearProducto, id: string, fechaActualizacion: string): Producto => {
  const codigoProducto = normalizarCodigoProducto(producto.codigoProducto);

  return {
    id,
    nombre: producto.nombre.trim(),
    precio: producto.precio,
    stock: producto.stock,
    stockMinimo: producto.stockMinimo ?? STOCK_MINIMO_DEFECTO,
    categoria: producto.categoria.trim().toUpperCase(),
    imagenUrl: producto.imagenUrl.trim(),
    fechaActualizacion,
    ...(codigoProducto !== undefined ? { codigoProducto } : {})
  };
};

export const obtenerProductos = async (_req: Request, res: Response<RespuestaApi<Producto[]> | MensajeRespuesta>, next: NextFunction): Promise<void> => {
  try {
    const usuario = _req.usuario as UsuarioToken;
    const productos = (await ModeloProducto.find({ tiendaId: usuario.tiendaId }).sort({ nombre: 1 }).lean().exec()) as Producto[];
    res.json(crearRespuestaApi('Productos obtenidos correctamente.', productos));
  } catch (error: unknown) {
    const mensajeDuplicado = obtenerMensajeDuplicado(error);
    if (mensajeDuplicado !== null) {
      res.status(409).json(crearRespuestaError(mensajeDuplicado));
      return;
    }

    next(error);
  }
};

export const obtenerProductoPorId = async (
  req: Request<ParametrosId>,
  res: Response<RespuestaApi<Producto> | MensajeRespuesta>,
  next: NextFunction
): Promise<void> => {
  try {
    const usuario = req.usuario as UsuarioToken;
    const producto = (await ModeloProducto.findOne({ id: req.params.id, tiendaId: usuario.tiendaId }).lean().exec()) as Producto | null;

    if (producto === null) {
      res.status(404).json(crearRespuestaError('No se encontró el producto solicitado.'));
      return;
    }

    res.json(crearRespuestaApi('Producto obtenido correctamente.', producto));
  } catch (error: unknown) {
    const mensajeDuplicado = obtenerMensajeDuplicado(error);
    if (mensajeDuplicado !== null) {
      res.status(409).json(crearRespuestaError(mensajeDuplicado));
      return;
    }

    next(error);
  }
};

export const crearProducto = async (
  req: Request<Record<string, never>, RespuestaApi<Producto> | MensajeRespuesta, SolicitudCrearProducto>,
  res: Response<RespuestaApi<Producto> | MensajeRespuesta>,
  next: NextFunction
): Promise<void> => {
  try {
    const errorValidacion = validarProducto(req.body);
    if (errorValidacion !== null) {
      res.status(400).json(crearRespuestaError(errorValidacion));
      return;
    }

    const idProducto = esTextoValido(req.body.id) ? req.body.id.trim() : generarIdentificador('prod');
    const usuario = req.usuario as UsuarioToken;
    const existeProducto = (await ModeloProducto.findOne({ id: idProducto, tiendaId: usuario.tiendaId }).lean().exec()) as Producto | null;

    if (existeProducto !== null) {
      res.status(409).json(crearRespuestaError('Ya existe un producto con ese identificador.'));
      return;
    }

    const fechaActualizacion = req.body.fechaActualizacion?.trim() ?? new Date().toISOString();
    const productoConstruido = construirProducto(req.body, idProducto, fechaActualizacion);

    const productoGuardado = (await ModeloProducto.create({
      ...productoConstruido,
      tiendaId: usuario.tiendaId
    })).toObject() as Producto;

    await sincronizarCategoria(usuario.tiendaId, productoGuardado.categoria);

    res.status(201).json(crearRespuestaApi('Producto creado correctamente.', productoGuardado));
  } catch (error: unknown) {
    next(error);
  }
};

export const actualizarProducto = async (
  req: Request<ParametrosId, RespuestaApi<Producto> | MensajeRespuesta, SolicitudActualizarProducto>,
  res: Response<RespuestaApi<Producto> | MensajeRespuesta>,
  next: NextFunction
): Promise<void> => {
  try {
    const errorValidacion = validarActualizacionProducto(req.body);
    if (errorValidacion !== null) {
      res.status(400).json(crearRespuestaError(errorValidacion));
      return;
    }

    const usuario = req.usuario as UsuarioToken;
    const productoExistente = (await ModeloProducto.findOne({ id: req.params.id, tiendaId: usuario.tiendaId }).exec()) as Producto | null;
    if (productoExistente === null) {
      res.status(404).json(crearRespuestaError('No se encontró el producto para actualizar.'));
      return;
    }

    const categoriaActualizada = req.body.categoria?.trim().toUpperCase();
    const codigoProductoActualizado = normalizarCodigoProducto(req.body.codigoProducto);
    const codigoProductoFinal = codigoProductoActualizado ?? productoExistente.codigoProducto;

    const datosActualizados: SolicitudCrearProducto = {
      id: productoExistente.id,
      nombre: req.body.nombre?.trim() ?? productoExistente.nombre,
      precio: req.body.precio ?? productoExistente.precio,
      stock: req.body.stock ?? productoExistente.stock,
      stockMinimo: req.body.stockMinimo ?? productoExistente.stockMinimo ?? STOCK_MINIMO_DEFECTO,
      categoria: categoriaActualizada ?? productoExistente.categoria,
      imagenUrl: req.body.imagenUrl?.trim() ?? productoExistente.imagenUrl,
      fechaActualizacion: new Date().toISOString()
    };

    if (codigoProductoFinal !== undefined) {
      datosActualizados.codigoProducto = codigoProductoFinal;
    }

    const productoActualizado = (await ModeloProducto.findOneAndUpdate(
      { id: req.params.id, tiendaId: usuario.tiendaId },
      datosActualizados,
      { new: true, runValidators: true }
    )
      .lean()
      .exec()) as Producto | null;

    if (productoActualizado === null) {
      res.status(404).json(crearRespuestaError('No se encontró el producto para actualizar.'));
      return;
    }

    await sincronizarCategoria(usuario.tiendaId, productoActualizado.categoria);

    res.json(crearRespuestaApi('Producto actualizado correctamente.', productoActualizado));
  } catch (error: unknown) {
    next(error);
  }
};

export const eliminarProducto = async (
  req: Request<ParametrosId>,
  res: Response<MensajeRespuesta>,
  next: NextFunction
): Promise<void> => {
  try {
    const usuario = req.usuario as UsuarioToken;
    const resultado = await ModeloProducto.deleteOne({ id: req.params.id, tiendaId: usuario.tiendaId }).exec();

    if (resultado.deletedCount === 0) {
      res.status(404).json(crearRespuestaError('No se encontró el producto para eliminar.'));
      return;
    }

    res.json(crearRespuestaSinDatos('Producto eliminado correctamente.'));
  } catch (error: unknown) {
    next(error);
  }
};
