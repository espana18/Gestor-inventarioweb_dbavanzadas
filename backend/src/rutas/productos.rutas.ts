import { Router } from 'express';
import {
  actualizarProducto,
  crearProducto,
  eliminarProducto,
  obtenerProductoPorId,
  obtenerProductos
} from '../controladores/productos.controlador';
import { autenticar } from '../middleware/autenticar';

export const rutasProductos = Router();

rutasProductos.use(autenticar);
rutasProductos.get('/', obtenerProductos);
rutasProductos.get('/:id', obtenerProductoPorId);
rutasProductos.post('/', crearProducto);
rutasProductos.put('/:id', actualizarProducto);
rutasProductos.delete('/:id', eliminarProducto);
