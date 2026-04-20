import type { NextFunction, Request, Response } from 'express';
import { ModeloCategoria } from '../modelos/categoria.modelo';
import type { CategoriaProducto, MensajeRespuesta, RespuestaApi, SolicitudActualizarCategoria, SolicitudCrearCategoria } from '../modelos/tipos';
import { crearRespuestaApi, crearRespuestaError, crearRespuestaSinDatos } from '../utilidades/respuestas';
import type { UsuarioToken } from '../middleware/autenticar';

type ParametrosId = { id: string };

const esTextoValido = (valor: unknown): valor is string => typeof valor === 'string' && valor.trim().length > 0;

export const listarCategorias = async (
  req: Request,
  res: Response<RespuestaApi<CategoriaProducto[]> | MensajeRespuesta>,
  next: NextFunction
): Promise<void> => {
  try {
    const usuario = req.usuario as UsuarioToken;
    const categorias = (await ModeloCategoria.find({ tiendaId: usuario.tiendaId }).sort({ nombre: 1 }).lean().exec()) as CategoriaProducto[];
    res.json(crearRespuestaApi('Categorías obtenidas correctamente.', categorias));
  } catch (error: unknown) {
    next(error);
  }
};

export const crearCategoria = async (
  req: Request<Record<string, never>, RespuestaApi<CategoriaProducto> | MensajeRespuesta, SolicitudCrearCategoria>,
  res: Response<RespuestaApi<CategoriaProducto> | MensajeRespuesta>,
  next: NextFunction
): Promise<void> => {
  try {
    const usuario = req.usuario as UsuarioToken;
    const nombre = req.body.nombre?.trim().toUpperCase() ?? '';

    if (!esTextoValido(nombre)) {
      res.status(400).json(crearRespuestaError('El nombre de la categoría es obligatorio.'));
      return;
    }

    const existe = await ModeloCategoria.findOne({ tiendaId: usuario.tiendaId, nombre }).lean().exec();
    if (existe !== null) {
      res.status(409).json(crearRespuestaError('Ya existe una categoría con ese nombre.'));
      return;
    }

    const categoriaCreada = (await ModeloCategoria.create({ nombre, tiendaId: usuario.tiendaId })).toObject() as CategoriaProducto;
    res.status(201).json(crearRespuestaApi('Categoría creada correctamente.', categoriaCreada));
  } catch (error: unknown) {
    next(error);
  }
};

export const actualizarCategoria = async (
  req: Request<ParametrosId, RespuestaApi<CategoriaProducto> | MensajeRespuesta, SolicitudActualizarCategoria>,
  res: Response<RespuestaApi<CategoriaProducto> | MensajeRespuesta>,
  next: NextFunction
): Promise<void> => {
  try {
    const usuario = req.usuario as UsuarioToken;
    const nombre = req.body.nombre?.trim().toUpperCase() ?? '';

    if (!esTextoValido(nombre)) {
      res.status(400).json(crearRespuestaError('El nombre de la categoría es obligatorio.'));
      return;
    }

    const categoria = await ModeloCategoria.findOne({ _id: req.params.id, tiendaId: usuario.tiendaId }).exec();
    if (categoria === null) {
      res.status(404).json(crearRespuestaError('No se encontró la categoría para actualizar.'));
      return;
    }

    const existe = await ModeloCategoria.findOne({ tiendaId: usuario.tiendaId, nombre, _id: { $ne: categoria._id } }).lean().exec();
    if (existe !== null) {
      res.status(409).json(crearRespuestaError('Ya existe una categoría con ese nombre.'));
      return;
    }

    categoria.nombre = nombre;
    await categoria.save();

    res.json(crearRespuestaApi('Categoría actualizada correctamente.', categoria.toObject() as CategoriaProducto));
  } catch (error: unknown) {
    next(error);
  }
};

export const eliminarCategoria = async (
  req: Request<ParametrosId>,
  res: Response<MensajeRespuesta>,
  next: NextFunction
): Promise<void> => {
  try {
    const usuario = req.usuario as UsuarioToken;
    const resultado = await ModeloCategoria.deleteOne({ _id: req.params.id, tiendaId: usuario.tiendaId }).exec();

    if (resultado.deletedCount === 0) {
      res.status(404).json(crearRespuestaError('No se encontró la categoría para eliminar.'));
      return;
    }

    res.json(crearRespuestaSinDatos('Categoría eliminada correctamente.'));
  } catch (error: unknown) {
    next(error);
  }
};
