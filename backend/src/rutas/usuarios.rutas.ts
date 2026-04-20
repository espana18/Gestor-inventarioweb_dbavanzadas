import { Router } from 'express';
import { alternarEstadoCajero, crearCajero, eliminarCajero, listarCajeros } from '../controladores/usuarios.controlador';
import { autenticar } from '../middleware/autenticar';
import { verificarRol } from '../middleware/verificarRol';

export const rutasUsuarios = Router();

rutasUsuarios.use(autenticar, verificarRol(['admin']));
rutasUsuarios.get('/', listarCajeros);
rutasUsuarios.post('/', crearCajero);
rutasUsuarios.patch('/:id/estado', alternarEstadoCajero);
rutasUsuarios.delete('/:id', eliminarCajero);
