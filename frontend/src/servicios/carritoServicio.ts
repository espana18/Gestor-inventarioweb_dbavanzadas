import { api } from './api';
import type { CarritoCaja, RespuestaApi } from '../tipos/modelos';

export const obtenerCarrito = async (): Promise<CarritoCaja | null> => {
  const respuesta = await api.get<RespuestaApi<CarritoCaja | null>>('/carrito');
  return respuesta.data.datos;
};

export const guardarCarrito = async (productos: CarritoCaja['productos']): Promise<CarritoCaja> => {
  const respuesta = await api.put<RespuestaApi<CarritoCaja>>('/carrito', { productos });
  return respuesta.data.datos;
};

export const limpiarCarrito = async (): Promise<void> => {
  await api.delete('/carrito');
};
