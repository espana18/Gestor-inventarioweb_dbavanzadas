export const metodosPago = ['Efectivo', 'Tarjeta', 'Transferencia'] as const;
export type MetodoPago = (typeof metodosPago)[number];

export const rolesUsuario = ['admin', 'cajero'] as const;
export type RolUsuario = (typeof rolesUsuario)[number];

export const planesTienda = ['gratis', 'basico', 'premium'] as const;
export type PlanTienda = (typeof planesTienda)[number];

export interface Producto {
  id: string;
  nombre: string;
  precio: number;
  stock: number;
  stockMinimo: number;
  categoria: string;
  imagenUrl: string;
  codigoProducto?: string;
  fechaActualizacion: string;
}

export interface LineaVenta {
  productoId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Venta {
  id: string;
  productos: LineaVenta[];
  total: number;
  ganancia: number;
  metodoPago: MetodoPago;
  fecha: string;
  cajero: string;
  usuarioId?: string;
}

export interface Usuario {
  id: string;
  nombre: string;
  rol: RolUsuario;
  correo: string;
  contrasena: string;
  tiendaId?: string;
  nombreTienda?: string;
}

export interface ConfiguracionTienda {
  moneda: string;
  zonaHoraria: string;
  stockMinimoGlobal: number;
}

export interface CategoriaProducto {
  id: string;
  nombre: string;
  fechaCreacion: string;
}

export interface CajeroListado {
  id: string;
  usuarioMongoId: string;
  nombre: string;
  correo: string;
  activo: boolean;
  fechaRegistro: string;
  ventasRealizadas: number;
}

export interface CarritoCaja {
  id?: string;
  usuarioId: string;
  tiendaId: string;
  productos: LineaVenta[];
  fechaActualizacion: string;
}

export interface Tienda {
  id: string;
  nombreTienda: string;
  nombrePropietario: string;
  correo: string;
  plan: PlanTienda;
  activa: boolean;
  configuracion: ConfiguracionTienda;
}

export interface SesionUsuario {
  token: string;
  usuario: {
    id: string;
    usuarioMongoId: string;
    nombre: string;
    correo: string;
    rol: RolUsuario;
    tiendaId: string;
    nombreTienda: string;
  };
}

export interface PeticionLogin {
  correo: string;
  contrasena: string;
}

export interface PeticionRegistro {
  nombreTienda: string;
  nombrePropietario: string;
  correo: string;
  contrasena: string;
  confirmarContrasena: string;
}

export interface ResumenHoy {
  totalVentasHoy: number;
  gananciaNeta: number;
  productosStockBajo: number;
}

export interface VentaDiaria {
  dia: string;
  total: number;
}

export interface RespuestaApi<T> {
  mensaje: string;
  datos: T;
}

export interface RespuestaHistorialVentas {
  ventas: Array<Venta & { cajeroNombre: string; usuarioId?: { nombre?: string } }>;
  total: number;
  pagina: number;
  totalPaginas: number;
  resumen: {
    totalRecaudado: number;
    ganancia: number;
    ticketPromedio: number;
  };
}

export interface RespuestaReporteAvanzado {
  totalIngresos: number;
  gananciaTotal: number;
  totalVentas: number;
  unidadesVendidas: number;
  ventasPorDia: Array<{ dia: string; total: number }>;
  ventasPorMetodoPago: Array<{ _id: string; total: number }>;
  ventasPorCajero: Array<{ usuarioId: string; nombre: string; totalVentas: number; totalIngresos: number; gananciaTotal: number }>;
}

export interface RespuestaProductosMasVendidosAvanzado {
  productos: Array<{ productoId: string; nombre: string; unidadesVendidas: number; ingresosGenerados: number; gananciaGenerada: number }>;
  total: number;
  limite: number;
}

export interface RespuestaCajeros {
  mensaje: string;
  datos: CajeroListado[];
}

export type ProductoFormulario = Omit<Producto, 'id' | 'fechaActualizacion'>;

export type ProductoEdicion = ProductoFormulario & {
  id?: string;
};

export type VentaFormulario = Omit<Venta, 'id'> & {
  id?: string;
};
