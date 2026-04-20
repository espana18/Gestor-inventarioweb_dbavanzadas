import type { Producto, Venta } from '../tipos/modelos';

export interface ResumenInicio {
  totalVentasDelDia: number;
  productosConStockBajo: number;
  gananciaNetaDelDia: number;
}

export interface DatoVentasSemanal {
  dia: string;
  ingresos: number;
}

export const obtenerClaveFechaLocal = (fecha: Date): string => {
  const anio = fecha.getFullYear();
  const mes = `${fecha.getMonth() + 1}`.padStart(2, '0');
  const dia = `${fecha.getDate()}`.padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

export const obtenerVentasDelDia = (ventas: Venta[], fechaReferencia: Date = new Date()): Venta[] => {
  const claveReferencia = obtenerClaveFechaLocal(fechaReferencia);
  return ventas.filter((venta) => obtenerClaveFechaLocal(new Date(venta.fecha)) === claveReferencia);
};

export const calcularResumenInicio = (
  productos: Producto[],
  ventas: Venta[],
  fechaReferencia: Date = new Date()
): ResumenInicio => {
  const ventasDelDia = obtenerVentasDelDia(ventas, fechaReferencia);

  return {
    totalVentasDelDia: ventasDelDia.reduce((acumulado, venta) => acumulado + venta.total, 0),
    productosConStockBajo: productos.filter((producto) => producto.stock < producto.stockMinimo).length,
    gananciaNetaDelDia: ventasDelDia.reduce((acumulado, venta) => acumulado + venta.ganancia, 0)
  };
};

export const obtenerDatosVentasSemanal = (
  ventas: Venta[],
  fechaReferencia: Date = new Date()
): DatoVentasSemanal[] => {
  const datos: DatoVentasSemanal[] = [];

  for (let desplazamiento = 6; desplazamiento >= 0; desplazamiento -= 1) {
    const fechaObjetivo = new Date(fechaReferencia);
    fechaObjetivo.setDate(fechaObjetivo.getDate() - desplazamiento);
    const claveObjetivo = obtenerClaveFechaLocal(fechaObjetivo);

    const ingresos = ventas
      .filter((venta) => obtenerClaveFechaLocal(new Date(venta.fecha)) === claveObjetivo)
      .reduce((acumulado, venta) => acumulado + venta.total, 0);

    datos.push({
      dia: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][fechaObjetivo.getDay()] ?? '',
      ingresos
    });
  }

  return datos;
};

export const obtenerUltimasVentas = (ventas: Venta[], cantidad: number = 5): Venta[] =>
  [...ventas]
    .sort((ventaA, ventaB) => new Date(ventaB.fecha).getTime() - new Date(ventaA.fecha).getTime())
    .slice(0, cantidad);

export const obtenerCategoriasUnicas = (productos: Producto[]): string[] =>
  Array.from(
    new Set(productos.map((producto) => producto.categoria.trim().toUpperCase()).filter((categoria) => categoria.length > 0))
  );
