import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { ejecutarCerradorSesionGlobal } from './sesion';

type RespuestaApiDesconocida = {
  mensaje?: string;
  datos?: unknown;
};

const api: AxiosInstance = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

const obtenerToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const sesionLocal = window.localStorage.getItem('gestor_inventario_sesion_local');
  const sesionSesion = window.sessionStorage.getItem('gestor_inventario_sesion_sesion');
  const contenido = sesionLocal ?? sesionSesion;

  if (contenido === null) {
    return null;
  }

  try {
    const sesion = JSON.parse(contenido) as { token?: string };
    return sesion.token ?? null;
  } catch {
    return null;
  }
};

api.interceptors.request.use((configuracion: InternalAxiosRequestConfig) => {
  const token = obtenerToken();
  if (token !== null) {
    configuracion.headers.Authorization = `Bearer ${token}`;
  }

  return configuracion;
});

api.interceptors.response.use(
  (respuesta) => respuesta,
  (error: AxiosError<RespuestaApiDesconocida>) => {
    if (error.response?.status === 401) {
      ejecutarCerradorSesionGlobal();
    }

    const mensajeServidor = error.response?.data?.mensaje;
    const mensaje = mensajeServidor ?? 'Ocurrió un error al comunicarse con el servidor.';
    return Promise.reject(new Error(mensaje));
  }
);

export { api };
