import { Router } from 'express';
import { guardarCarrito, limpiarCarrito, obtenerCarrito } from '../controladores/carrito.controlador';
import { autenticar } from '../middleware/autenticar';

export const rutasCarrito = Router();

rutasCarrito.use(autenticar);
rutasCarrito.get('/', obtenerCarrito);
rutasCarrito.put('/', guardarCarrito);
rutasCarrito.delete('/', limpiarCarrito);
