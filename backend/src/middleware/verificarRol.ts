import type { NextFunction, Request, Response } from 'express';

export const verificarRol = (rolesPermitidos: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.usuario === undefined || !rolesPermitidos.includes(req.usuario.rol)) {
      res.status(403).json({ mensaje: 'No tienes permisos para realizar esta acción', datos: null });
      return;
    }

    next();
  };
};
