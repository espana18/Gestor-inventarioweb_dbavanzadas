import type { NextFunction, Request, Response } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';

export interface UsuarioToken {
  id: string;
  usuarioId: string;
  usuarioMongoId?: string | undefined;
  correo: string;
  rol: string;
  tiendaId: string;
  nombreTienda: string;
}

declare global {
  namespace Express {
    interface Request {
      usuario?: UsuarioToken;
    }
  }
}

const extraerToken = (encabezadoAutorizacion: string | undefined): string | null => {
  if (encabezadoAutorizacion === undefined) {
    return null;
  }

  const [tipo, token] = encabezadoAutorizacion.split(' ');
  if (tipo !== 'Bearer' || token === undefined || token.trim().length === 0) {
    return null;
  }

  return token.trim();
};

export const autenticar = (req: Request, res: Response, next: NextFunction): void => {
  const token = extraerToken(req.header('authorization'));

  if (token === null) {
    res.status(401).json({ mensaje: 'Acceso denegado. Se requiere autenticación', datos: null });
    return;
  }

  const secreto = process.env.JWT_SECRETO;
  if (secreto === undefined || secreto.trim().length === 0) {
    res.status(500).json({ mensaje: 'La configuración de autenticación no está disponible', datos: null });
    return;
  }

  try {
    const verificado = jwt.verify(token, secreto) as JwtPayload;
    const usuario = {
      id: String(verificado.id),
      usuarioId: String(verificado.usuarioId ?? verificado.id),
      usuarioMongoId: typeof verificado.usuarioMongoId === 'string' ? verificado.usuarioMongoId : undefined,
      correo: String(verificado.correo),
      rol: String(verificado.rol),
      tiendaId: String(verificado.tiendaId),
      nombreTienda: String(verificado.nombreTienda)
    };

    req.usuario = usuario;
    next();
  } catch {
    res.status(401).json({ mensaje: 'Token inválido o expirado. Inicia sesión de nuevo', datos: null });
  }
};
