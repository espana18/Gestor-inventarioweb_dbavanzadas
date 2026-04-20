export const formatearMonedaColombiana = (valor: number): string =>
  `$ ${new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: 0
  }).format(valor)}`;

export const formatearHora = (fecha: string | Date): string =>
  new Intl.DateTimeFormat('es-CO', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(typeof fecha === 'string' ? new Date(fecha) : fecha);

export const formatearFechaCorta = (fecha: string | Date): string =>
  new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(typeof fecha === 'string' ? new Date(fecha) : fecha);

export const esMismoDia = (fechaUno: Date, fechaDos: Date): boolean =>
  fechaUno.getFullYear() === fechaDos.getFullYear() &&
  fechaUno.getMonth() === fechaDos.getMonth() &&
  fechaUno.getDate() === fechaDos.getDate();

export const obtenerDiaCorto = (indiceDia: number): string => {
  const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return dias[indiceDia] ?? '';
};

export const obtenerNombreDiaLargo = (indiceDia: number): string => {
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return dias[indiceDia] ?? '';
};
