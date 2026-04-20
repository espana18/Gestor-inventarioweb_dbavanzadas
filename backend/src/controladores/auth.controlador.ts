import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { ModeloTienda, type DocumentoTienda } from '../modelos/tienda.modelo';
import { ModeloUsuario } from '../modelos/usuario.modelo';
import type { MensajeRespuesta, PeticionLogin, PeticionRegistro, RespuestaApi, SesionUsuario, Tienda, Usuario } from '../modelos/tipos';

interface RespuestaPerfil {
  tienda: Omit<Tienda, 'contrasena'>;
}

interface SolicitudActualizarPerfil {
  nombreTienda?: string;
  nombrePropietario?: string;
  stockMinimoGlobal?: number;
}

interface SolicitudCambiarContrasena {
  contrasenaActual?: string;
  nuevaContrasena?: string;
  confirmarNuevaContrasena?: string;
}

const generarToken = (datos: { id: string; usuarioId: string; usuarioMongoId: string; correo: string; rol: string; tiendaId: string; nombreTienda: string }): string => {
  const secreto = process.env.JWT_SECRETO;
  const expira = process.env.JWT_EXPIRA ?? '7d';

  if (secreto === undefined || secreto.trim().length === 0) {
    throw new Error('La variable JWT_SECRETO no está configurada.');
  }

  if (expira === undefined) {
    return jwt.sign(datos, secreto);
  }

  return jwt.sign(datos, secreto, { expiresIn: expira as Exclude<SignOptions['expiresIn'], undefined> });
};

const esTextoValido = (valor: unknown): valor is string => typeof valor === 'string' && valor.trim().length > 0;

const construirSesionUsuario = (tienda: DocumentoTienda, usuario: Usuario): SesionUsuario => ({
  token: generarToken({
    id: usuario.id,
    usuarioId: usuario.id,
    usuarioMongoId: String(usuario._id),
    correo: usuario.correo,
    rol: usuario.rol,
    tiendaId: String(tienda._id),
    nombreTienda: tienda.nombreTienda
  }),
  usuario: {
    id: usuario.id,
    usuarioId: usuario.id,
    usuarioMongoId: String(usuario._id),
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: usuario.rol,
    tiendaId: String(tienda._id),
    nombreTienda: tienda.nombreTienda
  }
});

export const registrarTienda = async (
  req: Request<Record<string, never>, RespuestaApi<SesionUsuario> | MensajeRespuesta, PeticionRegistro>,
  res: Response<RespuestaApi<SesionUsuario> | MensajeRespuesta>,
  next: NextFunction
): Promise<void> => {
  try {
    const { nombreTienda, nombrePropietario, correo, contrasena, confirmarContrasena } = req.body;

    if (![nombreTienda, nombrePropietario, correo, contrasena, confirmarContrasena].every(esTextoValido)) {
      res.status(400).json({ mensaje: 'Todos los campos del registro son obligatorios.', datos: null });
      return;
    }

    if (contrasena !== confirmarContrasena) {
      res.status(400).json({ mensaje: 'Las contraseñas no coinciden', datos: null });
      return;
    }

    if (contrasena.length < 8) {
      res.status(400).json({ mensaje: 'La contraseña debe tener al menos 8 caracteres', datos: null });
      return;
    }

    const correoExistente = await ModeloTienda.findOne({ correo: correo.trim().toLowerCase() }).exec();
    if (correoExistente !== null) {
      res.status(409).json({ mensaje: 'Ya existe una cuenta con ese correo', datos: null });
      return;
    }

    const idTienda = randomUUID();
    const tienda = await ModeloTienda.create({
      id: idTienda,
      nombreTienda: nombreTienda.trim(),
      nombrePropietario: nombrePropietario.trim(),
      correo: correo.trim().toLowerCase(),
      contrasena,
      plan: 'gratis',
      activa: true,
      configuracion: {
        moneda: 'COP',
        zonaHoraria: 'America/Bogota',
        stockMinimoGlobal: 5
      }
    });

    const usuarioAdmin = await ModeloUsuario.create({
      id: randomUUID(),
      nombre: nombrePropietario.trim(),
      rol: 'admin',
      correo: correo.trim().toLowerCase(),
      contrasena: await bcrypt.hash(contrasena, 12),
      activo: true,
      fechaRegistro: new Date(),
      tiendaId: tienda._id
    });

    const sesion = construirSesionUsuario(tienda, usuarioAdmin.toObject() as Usuario);

    res.status(201).json({ mensaje: 'Tienda registrada exitosamente', datos: sesion });
  } catch (error: unknown) {
    next(error);
  }
};

export const iniciarSesion = async (
  req: Request<Record<string, never>, RespuestaApi<SesionUsuario> | MensajeRespuesta, PeticionLogin>,
  res: Response<RespuestaApi<SesionUsuario> | MensajeRespuesta>,
  next: NextFunction
): Promise<void> => {
  try {
    const { correo, contrasena } = req.body;

    if (!esTextoValido(correo) || !esTextoValido(contrasena)) {
      res.status(400).json({ mensaje: 'Correo y contraseña son obligatorios.', datos: null });
      return;
    }

    const usuario = (await ModeloUsuario.findOne({ correo: correo.trim().toLowerCase() }).select('+contrasena').exec()) as Usuario | null;

    if (usuario === null) {
      res.status(401).json({ mensaje: 'Correo o contraseña incorrectos', datos: null });
      return;
    }

    if (!usuario.activo) {
      res.status(403).json({ mensaje: 'Este usuario está desactivado', datos: null });
      return;
    }

    const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!contrasenaValida) {
      res.status(401).json({ mensaje: 'Correo o contraseña incorrectos', datos: null });
      return;
    }

    const tienda = (await ModeloTienda.findById(usuario.tiendaId).exec()) as DocumentoTienda | null;
    if (tienda === null) {
      res.status(404).json({ mensaje: 'No se encontró la tienda asociada al usuario', datos: null });
      return;
    }

    if (!tienda.activa) {
      res.status(403).json({ mensaje: 'Esta cuenta está desactivada', datos: null });
      return;
    }

    const sesion = construirSesionUsuario(tienda, usuario);

    res.status(200).json({ mensaje: 'Sesión iniciada correctamente', datos: sesion });
  } catch (error: unknown) {
    next(error);
  }
};

export const obtenerPerfil = async (
  req: Request,
  res: Response<RespuestaApi<RespuestaPerfil> | MensajeRespuesta>
): Promise<void> => {
  try {
    if (req.usuario === undefined) {
      res.status(401).json({ mensaje: 'Acceso denegado. Se requiere autenticación', datos: null });
      return;
    }

    const tienda = await ModeloTienda.findById(req.usuario.tiendaId).select('-contrasena').lean().exec();

    if (tienda === null) {
      res.status(404).json({ mensaje: 'No se encontró la tienda asociada a la sesión', datos: null });
      return;
    }

    res.json({
      mensaje: 'Perfil obtenido correctamente',
      datos: {
        tienda: tienda as Omit<Tienda, 'contrasena'>
      }
    });
  } catch (error: unknown) {
    res.status(500).json({ mensaje: error instanceof Error ? error.message : 'No fue posible obtener el perfil', datos: null });
  }
};

export const actualizarPerfil = async (
  req: Request<Record<string, never>, RespuestaApi<RespuestaPerfil> | MensajeRespuesta, SolicitudActualizarPerfil>,
  res: Response<RespuestaApi<RespuestaPerfil> | MensajeRespuesta>
): Promise<void> => {
  try {
    if (req.usuario === undefined) {
      res.status(401).json({ mensaje: 'Acceso denegado. Se requiere autenticación', datos: null });
      return;
    }

    const tienda = await ModeloTienda.findById(req.usuario.tiendaId).exec();
    if (tienda === null) {
      res.status(404).json({ mensaje: 'No se encontró la tienda asociada a la sesión', datos: null });
      return;
    }

    if (req.body.nombreTienda !== undefined) {
      tienda.nombreTienda = req.body.nombreTienda.trim();
    }

    if (req.body.nombrePropietario !== undefined) {
      tienda.nombrePropietario = req.body.nombrePropietario.trim();
    }

    if (req.body.stockMinimoGlobal !== undefined) {
      tienda.configuracion.stockMinimoGlobal = req.body.stockMinimoGlobal;
    }

    await tienda.save();

    res.json({
      mensaje: 'Perfil actualizado correctamente',
      datos: {
        tienda: tienda.toObject({ versionKey: false }) as Omit<Tienda, 'contrasena'>
      }
    });
  } catch (error: unknown) {
    res.status(500).json({ mensaje: error instanceof Error ? error.message : 'No fue posible actualizar el perfil', datos: null });
  }
};

export const cambiarContrasena = async (
  req: Request<Record<string, never>, RespuestaApi<null> | MensajeRespuesta, SolicitudCambiarContrasena>,
  res: Response<RespuestaApi<null> | MensajeRespuesta>
): Promise<void> => {
  try {
    if (req.usuario === undefined) {
      res.status(401).json({ mensaje: 'Acceso denegado. Se requiere autenticación', datos: null });
      return;
    }

    const { contrasenaActual, nuevaContrasena, confirmarNuevaContrasena } = req.body;
    if (!esTextoValido(contrasenaActual) || !esTextoValido(nuevaContrasena) || !esTextoValido(confirmarNuevaContrasena)) {
      res.status(400).json({ mensaje: 'Todos los campos de contraseña son obligatorios.', datos: null });
      return;
    }

    if (nuevaContrasena.length < 8) {
      res.status(400).json({ mensaje: 'La nueva contraseña debe tener al menos 8 caracteres.', datos: null });
      return;
    }

    if (nuevaContrasena !== confirmarNuevaContrasena) {
      res.status(400).json({ mensaje: 'Las nuevas contraseñas no coinciden.', datos: null });
      return;
    }

    const usuario = await ModeloUsuario.findById(req.usuario.usuarioMongoId ?? req.usuario.id).select('+contrasena').exec();
    if (usuario === null) {
      res.status(404).json({ mensaje: 'No se encontró el usuario autenticado.', datos: null });
      return;
    }

    const contrasenaValida = await bcrypt.compare(contrasenaActual, usuario.contrasena);
    if (!contrasenaValida) {
      res.status(400).json({ mensaje: 'La contraseña actual es incorrecta.', datos: null });
      return;
    }

    usuario.contrasena = await bcrypt.hash(nuevaContrasena, 12);
    await usuario.save();

    res.json({ mensaje: 'Contraseña actualizada correctamente', datos: null });
  } catch (error: unknown) {
    res.status(500).json({ mensaje: error instanceof Error ? error.message : 'No fue posible actualizar la contraseña', datos: null });
  }
};
