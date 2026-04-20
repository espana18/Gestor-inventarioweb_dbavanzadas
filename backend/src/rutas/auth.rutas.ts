import { Router } from 'express';
import { cambiarContrasena, iniciarSesion, obtenerPerfil, registrarTienda, actualizarPerfil } from '../controladores/auth.controlador';
import { autenticar } from '../middleware/autenticar';
import { verificarRol } from '../middleware/verificarRol';

export const rutasAuth = Router();

rutasAuth.post('/registro', registrarTienda);
rutasAuth.post('/login', iniciarSesion);
rutasAuth.get('/perfil', autenticar, obtenerPerfil);
rutasAuth.patch('/perfil', autenticar, verificarRol(['admin']), actualizarPerfil);
rutasAuth.patch('/contrasena', autenticar, cambiarContrasena);
