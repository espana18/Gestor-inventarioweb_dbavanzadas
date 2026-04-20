import { api } from './api';
import type { RespuestaApi, RespuestaProductosMasVendidosAvanzado, RespuestaReporteAvanzado } from '../tipos/modelos';

export const obtenerReporte = async (filtros: { desde?: string; hasta?: string; usuarioId?: string }): Promise<{
  totalIngresos: number;
  gananciaTotal: number;
  totalVentas: number;
  unidadesVendidas: number;
  ventasPorDia: Array<{ dia: string; total: number }>;
  ventasPorMetodoPago: Array<{ _id: string; total: number }>;
  ventasPorCajero: Array<{ usuarioId: string; nombre: string; totalVentas: number; totalIngresos: number; gananciaTotal: number }>;
}> => {
  const respuesta = await api.get<RespuestaApi<RespuestaReporteAvanzado>>('/analitica/reporte', { params: filtros });
  return respuesta.data.datos;
};

export const obtenerProductosMasVendidos = async (filtros: { desde?: string; hasta?: string; limite?: number }): Promise<{
  productos: Array<{ productoId: string; nombre: string; unidadesVendidas: number; ingresosGenerados: number; gananciaGenerada: number }>;
  total: number;
  limite: number;
}> => {
  const respuesta = await api.get<RespuestaApi<RespuestaProductosMasVendidosAvanzado>>('/analitica/productos-mas-vendidos', { params: filtros });
  return respuesta.data.datos;
};
