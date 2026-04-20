import type { MensajeRespuesta, RespuestaApi } from '../modelos/tipos';

export const crearRespuestaError = (mensaje: string): MensajeRespuesta => ({
  mensaje,
  datos: null
});

export const crearRespuestaApi = <T>(mensaje: string, datos: T): RespuestaApi<T> => ({
  mensaje,
  datos
});

export const crearRespuestaSinDatos = (mensaje: string): MensajeRespuesta => ({
  mensaje,
  datos: null
});
