import { api } from './api';
import type { CategoriaProducto, Producto, RespuestaApi } from '../tipos/modelos';

export const obtenerTodos = async (): Promise<Producto[]> => {
  const respuesta = await api.get<RespuestaApi<Producto[]>>('/productos');
  return respuesta.data.datos;
};

export const obtenerPorId = async (id: string): Promise<Producto> => {
  const respuesta = await api.get<RespuestaApi<Producto>>(`/productos/${id}`);
  return respuesta.data.datos;
};

export const crear = async (producto: Omit<Producto, 'id'>): Promise<Producto> => {
  const respuesta = await api.post<RespuestaApi<Producto>>('/productos', producto);
  return respuesta.data.datos;
};

export const actualizar = async (id: string, datos: Partial<Producto>): Promise<Producto> => {
  const respuesta = await api.put<RespuestaApi<Producto>>(`/productos/${id}`, datos);
  return respuesta.data.datos;
};

export const eliminar = async (id: string): Promise<void> => {
  await api.delete(`/productos/${id}`);
};

export const obtenerCategorias = async (): Promise<CategoriaProducto[]> => {
  const respuesta = await api.get<RespuestaApi<CategoriaProducto[]>>('/categorias');
  return respuesta.data.datos;
};

export const crearCategoria = async (nombre: string): Promise<CategoriaProducto> => {
  const respuesta = await api.post<RespuestaApi<CategoriaProducto>>('/categorias', { nombre });
  return respuesta.data.datos;
};

export const actualizarCategoria = async (id: string, nombre: string): Promise<CategoriaProducto> => {
  const respuesta = await api.put<RespuestaApi<CategoriaProducto>>(`/categorias/${id}`, { nombre });
  return respuesta.data.datos;
};

export const eliminarCategoria = async (id: string): Promise<void> => {
  await api.delete(`/categorias/${id}`);
};
