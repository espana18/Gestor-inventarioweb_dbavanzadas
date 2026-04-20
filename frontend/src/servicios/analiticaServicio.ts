import { api } from './api';
import type { RespuestaApi, ResumenHoy, VentaDiaria } from '../tipos/modelos';

export const obtenerResumenHoy = async (): Promise<ResumenHoy> => {
  const respuesta = await api.get<RespuestaApi<ResumenHoy>>('/analitica/resumen');
  return respuesta.data.datos;
};

export const obtenerVentasSemanales = async (): Promise<VentaDiaria[]> => {
  const respuesta = await api.get<RespuestaApi<VentaDiaria[]>>('/analitica/semanal');
  return respuesta.data.datos;
};
