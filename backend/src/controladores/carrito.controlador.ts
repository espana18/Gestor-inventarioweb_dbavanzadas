import type { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import { ModeloCarritoCaja } from '../modelos/carritoCaja.modelo';
import type { CarritoCaja, MensajeRespuesta, RespuestaApi, SolicitudGuardarCarrito } from '../modelos/tipos';
import { crearRespuestaApi, crearRespuestaError, crearRespuestaSinDatos } from '../utilidades/respuestas';
import type { UsuarioToken } from '../middleware/autenticar';

const esNumeroValido = (valor: unknown): valor is number => typeof valor === 'number' && Number.isInteger(valor) && valor > 0;

export const obtenerCarrito = async (
  req: Request,
  res: Response<RespuestaApi<CarritoCaja | null> | MensajeRespuesta>,
  next: NextFunction
): Promise<void> => {
  try {
    const usuario = req.usuario as UsuarioToken;
    const carrito = (await ModeloCarritoCaja.findOne({ usuarioId: usuario.usuarioMongoId ?? usuario.id, tiendaId: usuario.tiendaId }).lean().exec()) as CarritoCaja | null;

    res.json(crearRespuestaApi('Carrito obtenido correctamente.', carrito));
  } catch (error: unknown) {
    next(error);
  }
};

export const guardarCarrito = async (
  req: Request<Record<string, never>, RespuestaApi<CarritoCaja> | MensajeRespuesta, SolicitudGuardarCarrito>,
  res: Response<RespuestaApi<CarritoCaja> | MensajeRespuesta>,
  next: NextFunction
): Promise<void> => {
  try {
    const usuario = req.usuario as UsuarioToken;
    if (usuario.usuarioMongoId === undefined || usuario.usuarioMongoId.trim().length === 0) {
      res.status(401).json(crearRespuestaError('No se pudo identificar al usuario autenticado.'));
      return;
    }

    const usuarioObjectId = new Types.ObjectId(usuario.usuarioMongoId);
    const productos = Array.isArray(req.body.productos) ? req.body.productos : [];

    if (productos.some((linea) => !esNumeroValido(linea.cantidad) || !Number.isFinite(linea.precioUnitario) || !Number.isFinite(linea.subtotal))) {
      res.status(400).json(crearRespuestaError('El carrito contiene datos inválidos.'));
      return;
    }

    const carrito = await ModeloCarritoCaja.findOneAndUpdate(
      { usuarioId: usuarioObjectId, tiendaId: usuario.tiendaId },
      {
        $set: {
          productos,
          fechaActualizacion: new Date()
        }
      },
      { new: true, upsert: true }
    )
      .lean()
      .exec();

    res.json(crearRespuestaApi('Carrito guardado correctamente.', carrito as CarritoCaja));
  } catch (error: unknown) {
    next(error);
  }
};

export const limpiarCarrito = async (
  req: Request,
  res: Response<MensajeRespuesta>,
  next: NextFunction
): Promise<void> => {
  try {
    const usuario = req.usuario as UsuarioToken;
    if (usuario.usuarioMongoId === undefined || usuario.usuarioMongoId.trim().length === 0) {
      res.status(401).json(crearRespuestaError('No se pudo identificar al usuario autenticado.'));
      return;
    }

    await ModeloCarritoCaja.deleteOne({ usuarioId: new Types.ObjectId(usuario.usuarioMongoId), tiendaId: usuario.tiendaId }).exec();
    res.json(crearRespuestaSinDatos('Carrito limpiado correctamente.'));
  } catch (error: unknown) {
    next(error);
  }
};
