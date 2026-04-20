import { api } from './api';
import type { RespuestaApi, Venta } from '../tipos/modelos';

export const obtenerTodas = async (): Promise<Venta[]> => {
  const respuesta = await api.get<RespuestaApi<Venta[]>>('/ventas');
  return respuesta.data.datos;
};

export const crear = async (venta: Omit<Venta, 'id'>): Promise<Venta> => {
  const respuesta = await api.post<RespuestaApi<Venta>>('/ventas', {
    productos: venta.productos.map((linea) => ({
      productoId: linea.productoId,
      cantidad: linea.cantidad,
      nombre: linea.nombre
    })),
    metodoPago: venta.metodoPago,
    fecha: venta.fecha,
    cajero: venta.cajero
  });
  return respuesta.data.datos;
};
