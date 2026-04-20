import { api } from './api';
import type { RespuestaApi, RespuestaHistorialVentas } from '../tipos/modelos';

export interface FiltrosHistorialVentas {
  desde?: string;
  hasta?: string;
  metodoPago?: string;
  usuarioId?: string;
  pagina?: number;
  limite?: number;
}

export const obtenerHistorial = async (filtros: FiltrosHistorialVentas): Promise<RespuestaHistorialVentas> => {
  const respuesta = await api.get<RespuestaApi<RespuestaHistorialVentas>>('/ventas/historial', {
    params: {
      ...filtros,
      metodoPago: filtros.metodoPago === 'Todos' ? undefined : filtros.metodoPago
    }
  });

  return respuesta.data.datos;
};
