import { Router } from 'express';
import { actualizarCategoria, crearCategoria, eliminarCategoria, listarCategorias } from '../controladores/categorias.controlador';
import { autenticar } from '../middleware/autenticar';
import { verificarRol } from '../middleware/verificarRol';

export const rutasCategorias = Router();

rutasCategorias.use(autenticar, verificarRol(['admin']));
rutasCategorias.get('/', listarCategorias);
rutasCategorias.post('/', crearCategoria);
rutasCategorias.put('/:id', actualizarCategoria);
rutasCategorias.delete('/:id', eliminarCategoria);
