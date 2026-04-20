import { Router } from 'express';
import {
  actualizarVenta,
  crearVenta,
  eliminarVenta,
  obtenerHistorial,
  obtenerVentaPorId,
  obtenerVentas
} from '../controladores/ventas.controlador';
import { autenticar } from '../middleware/autenticar';
import { verificarRol } from '../middleware/verificarRol';

export const rutasVentas = Router();

rutasVentas.use(autenticar);
rutasVentas.get('/', obtenerVentas);
rutasVentas.get('/historial', verificarRol(['admin']), obtenerHistorial);
rutasVentas.get('/:id', obtenerVentaPorId);
rutasVentas.post('/', crearVenta);
rutasVentas.put('/:id', actualizarVenta);
rutasVentas.delete('/:id', eliminarVenta);
