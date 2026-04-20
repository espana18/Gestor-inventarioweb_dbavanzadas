import { api } from './api';
import type { CajeroListado, RespuestaApi } from '../tipos/modelos';

export interface FormularioCajero {
  nombre: string;
  correo: string;
  contrasena: string;
}

export interface CajeroCreado extends CajeroListado {
  contrasenaTemporal: string;
}

export const obtenerCajeros = async (): Promise<CajeroListado[]> => {
  const respuesta = await api.get<RespuestaApi<CajeroListado[]>>('/usuarios');
  return respuesta.data.datos;
};

export const crearCajero = async (datos: FormularioCajero): Promise<CajeroCreado> => {
  const respuesta = await api.post<RespuestaApi<CajeroCreado>>('/usuarios', datos);
  return respuesta.data.datos;
};

export const alternarEstado = async (id: string): Promise<CajeroListado> => {
  const respuesta = await api.patch<RespuestaApi<CajeroListado>>(`/usuarios/${id}/estado`, {});
  return respuesta.data.datos;
};

export const eliminarCajero = async (id: string): Promise<void> => {
  await api.delete(`/usuarios/${id}`);
};
