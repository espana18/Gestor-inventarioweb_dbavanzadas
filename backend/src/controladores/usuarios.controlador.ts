import bcrypt from 'bcryptjs';
import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { ModeloUsuario } from '../modelos/usuario.modelo';
import { ModeloVenta } from '../modelos/venta.modelo';
import type { MensajeRespuesta, RespuestaApi, Usuario } from '../modelos/tipos';
import { crearRespuestaApi, crearRespuestaError, crearRespuestaSinDatos } from '../utilidades/respuestas';
import type { UsuarioToken } from '../middleware/autenticar';

interface SolicitudCrearCajero {
  nombre?: string;
  correo?: string;
  contrasena?: string;
}

interface UsuarioCajeroRespuesta extends Usuario {
  usuarioMongoId: string;
  ventasRealizadas: number;
}

interface UsuarioCajeroCreadoRespuesta extends UsuarioCajeroRespuesta {
  contrasenaTemporal: string;
}

type UsuarioCajeroDocumento = Usuario & { _id: { toString(): string } };

interface ParametrosId {
  id: string;
}

const esTextoValido = (valor: unknown): valor is string => typeof valor === 'string' && valor.trim().length > 0;

const convertirAObjectId = (valor: string | undefined): mongoose.Types.ObjectId | undefined => {
  if (valor === undefined || valor.trim().length === 0) {
    return undefined;
  }

  return mongoose.Types.ObjectId.isValid(valor) ? new mongoose.Types.ObjectId(valor) : undefined;
};

export const listarCajeros = async (
  req: Request,
  res: Response<RespuestaApi<UsuarioCajeroRespuesta[]> | MensajeRespuesta>,
  next: NextFunction
): Promise<void> => {
  try {
    const usuario = req.usuario as UsuarioToken;
    const tiendaId = convertirAObjectId(usuario.tiendaId);
    const cajeros = (await ModeloUsuario.find({ tiendaId, rol: 'cajero' }).sort({ nombre: 1 }).exec()) as UsuarioCajeroDocumento[];

    const ventasAgrupadas = await ModeloVenta.aggregate<{ _id: string; ventasRealizadas: number }>([
      { $match: { tiendaId } },
      { $group: { _id: '$usuarioId', ventasRealizadas: { $sum: 1 } } }
    ]).exec();

    const mapaVentas = new Map<string, number>(ventasAgrupadas.map((venta) => [String(venta._id), venta.ventasRealizadas]));

    const datos: UsuarioCajeroRespuesta[] = cajeros.map((cajero) => ({
      id: cajero.id,
      nombre: cajero.nombre,
      rol: cajero.rol,
      correo: cajero.correo,
      contrasena: cajero.contrasena,
      activo: cajero.activo,
      fechaRegistro: cajero.fechaRegistro,
      usuarioMongoId: cajero._id.toString(),
      ventasRealizadas: mapaVentas.get(cajero._id.toString()) ?? 0
    }));

    res.json(crearRespuestaApi('Cajeros obtenidos correctamente.', datos));
  } catch (error: unknown) {
    next(error);
  }
};

export const crearCajero = async (
  req: Request<Record<string, never>, RespuestaApi<UsuarioCajeroCreadoRespuesta> | MensajeRespuesta, SolicitudCrearCajero>,
  res: Response<RespuestaApi<UsuarioCajeroCreadoRespuesta> | MensajeRespuesta>,
  next: NextFunction
): Promise<void> => {
  try {
    const usuario = req.usuario as UsuarioToken;
    const nombre = req.body.nombre?.trim() ?? '';
    const correo = req.body.correo?.trim().toLowerCase() ?? '';
    const contrasena = req.body.contrasena ?? '';

    if (!esTextoValido(nombre) || !esTextoValido(correo) || !esTextoValido(contrasena)) {
      res.status(400).json(crearRespuestaError('Nombre, correo y contraseña son obligatorios.'));
      return;
    }

    if (contrasena.length < 8) {
      res.status(400).json(crearRespuestaError('La contraseña debe tener al menos 8 caracteres.'));
      return;
    }

    const correoExistente = await ModeloUsuario.findOne({ tiendaId: usuario.tiendaId, correo }).lean().exec();
    if (correoExistente !== null) {
      res.status(409).json(crearRespuestaError('Ya existe un usuario con ese correo.'));
      return;
    }

    const cajeroCreado = await ModeloUsuario.create({
      id: randomUUID(),
      nombre,
      rol: 'cajero',
      correo,
      contrasena: await bcrypt.hash(contrasena, 12),
      activo: true,
      fechaRegistro: new Date(),
      tiendaId: usuario.tiendaId
    });

    res.status(201).json(
      crearRespuestaApi('Cajero creado correctamente.', {
        id: cajeroCreado.id,
        nombre: cajeroCreado.nombre,
        rol: cajeroCreado.rol,
        correo: cajeroCreado.correo,
        contrasena: cajeroCreado.contrasena,
        activo: cajeroCreado.activo,
        fechaRegistro: cajeroCreado.fechaRegistro,
        usuarioMongoId: cajeroCreado._id.toString(),
        ventasRealizadas: 0,
        contrasenaTemporal: contrasena
      })
    );
  } catch (error: unknown) {
    next(error);
  }
};

export const alternarEstadoCajero = async (
  req: Request<ParametrosId, RespuestaApi<UsuarioCajeroRespuesta> | MensajeRespuesta>,
  res: Response<RespuestaApi<UsuarioCajeroRespuesta> | MensajeRespuesta>,
  next: NextFunction
): Promise<void> => {
  try {
    const usuario = req.usuario as UsuarioToken;
    const tiendaId = convertirAObjectId(usuario.tiendaId);
    const cajero = await ModeloUsuario.findOne({ id: req.params.id, tiendaId: usuario.tiendaId, rol: 'cajero' }).exec();

    if (cajero === null) {
      res.status(404).json(crearRespuestaError('No se encontró el cajero solicitado.'));
      return;
    }

    cajero.activo = !cajero.activo;
    await cajero.save();

    const ventasRealizadas = await ModeloVenta.countDocuments({ tiendaId, usuarioId: cajero._id }).exec();

    res.json(
      crearRespuestaApi('Estado del cajero actualizado correctamente.', {
        id: cajero.id,
        nombre: cajero.nombre,
        rol: cajero.rol,
        correo: cajero.correo,
        contrasena: cajero.contrasena,
        activo: cajero.activo,
        fechaRegistro: cajero.fechaRegistro,
        usuarioMongoId: cajero._id.toString(),
        ventasRealizadas
      })
    );
  } catch (error: unknown) {
    next(error);
  }
};

export const eliminarCajero = async (
  req: Request<ParametrosId>,
  res: Response<MensajeRespuesta>,
  next: NextFunction
): Promise<void> => {
  try {
    const usuario = req.usuario as UsuarioToken;
    const tiendaId = convertirAObjectId(usuario.tiendaId);
    const cajero = await ModeloUsuario.findOne({ id: req.params.id, tiendaId: usuario.tiendaId, rol: 'cajero' }).exec();

    if (cajero === null) {
      res.status(404).json(crearRespuestaError('No se encontró el cajero solicitado.'));
      return;
    }

    const ventasRealizadas = await ModeloVenta.countDocuments({ tiendaId, usuarioId: cajero._id }).exec();
    if (ventasRealizadas > 0) {
      res.status(409).json(crearRespuestaError('No se puede eliminar un cajero con ventas registradas.'));
      return;
    }

    await ModeloUsuario.deleteOne({ _id: cajero._id }).exec();
    res.json(crearRespuestaSinDatos('Cajero eliminado correctamente.'));
  } catch (error: unknown) {
    next(error);
  }
};
