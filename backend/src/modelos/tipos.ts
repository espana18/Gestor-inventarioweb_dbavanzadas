import type { Types } from 'mongoose';

export const rolesUsuario = ['admin', 'cajero'] as const;
export type RolUsuario = (typeof rolesUsuario)[number];

export const planesTienda = ['gratis', 'basico', 'premium'] as const;
export type PlanTienda = (typeof planesTienda)[number];

export const metodosPago = ['Efectivo', 'Tarjeta', 'Transferencia'] as const;
export type MetodoPago = (typeof metodosPago)[number];

export interface Producto {
  _id?: Types.ObjectId;
  id: string;
  nombre: string;
  precio: number;
  stock: number;
  stockMinimo: number;
  categoria: string;
  imagenUrl: string;
  codigoProducto?: string;
  fechaActualizacion: string;
  tiendaId?: Types.ObjectId;
}

export interface LineaVenta {
  productoId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Venta {
  _id?: Types.ObjectId;
  id: string;
  productos: LineaVenta[];
  total: number;
  ganancia: number;
  metodoPago: MetodoPago;
  fecha: string;
  cajero: string;
  usuarioId?: Types.ObjectId;
  tiendaId?: Types.ObjectId;
}

export interface Usuario {
  _id?: Types.ObjectId;
  id: string;
  nombre: string;
  rol: RolUsuario;
  correo: string;
  contrasena: string;
  activo: boolean;
  fechaRegistro: Date;
  tiendaId?: Types.ObjectId;
}

export interface ConfiguracionTienda {
  moneda: string;
  zonaHoraria: string;
  stockMinimoGlobal: number;
}

export interface Tienda {
  _id?: Types.ObjectId;
  id: string;
  nombreTienda: string;
  nombrePropietario: string;
  correo: string;
  contrasena: string;
  plan: PlanTienda;
  activa: boolean;
  fechaRegistro: Date;
  configuracion: ConfiguracionTienda;
}

export interface RespuestaApi<T> {
  mensaje: string;
  datos: T;
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

export interface UsuarioSesion {
  id: string;
  usuarioId: string;
  usuarioMongoId: string;
  nombre: string;
  correo: string;
  rol: RolUsuario;
  tiendaId: string;
  nombreTienda: string;
}

export interface SesionUsuario {
  token: string;
  usuario: UsuarioSesion;
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

export interface LineaVentaSolicitud {
  productoId: string;
  cantidad: number;
  nombre?: string;
}

export interface SolicitudCrearProducto {
  id?: string;
  nombre: string;
  precio: number;
  stock: number;
  stockMinimo: number;
  categoria: string;
  imagenUrl: string;
  codigoProducto?: string;
  fechaActualizacion?: string;
}

export interface SolicitudActualizarProducto {
  nombre?: string;
  precio?: number;
  stock?: number;
  stockMinimo?: number;
  categoria?: string;
  imagenUrl?: string;
  codigoProducto?: string;
  fechaActualizacion?: string;
}

export interface SolicitudCrearVenta {
  productos: LineaVentaSolicitud[];
  metodoPago: MetodoPago;
  fecha?: string;
  cajero: string;
}

export interface RegistroProducto {
  id?: string;
  nombre: string;
  precio: number;
  stock: number;
  stockMinimo: number;
  categoria: string;
  imagenUrl: string;
  codigoProducto?: string;
}

export interface CategoriaProducto {
  _id?: Types.ObjectId;
  nombre: string;
  tiendaId?: Types.ObjectId;
  fechaCreacion: Date;
}

export interface CarritoCaja {
  _id?: Types.ObjectId;
  usuarioId: Types.ObjectId;
  tiendaId: Types.ObjectId;
  productos: LineaVenta[];
  fechaActualizacion: Date;
}

export interface SolicitudCrearCategoria {
  nombre: string;
}

export interface SolicitudActualizarCategoria {
  nombre: string;
}

export interface SolicitudGuardarCarrito {
  productos: LineaVenta[];
}

export interface RegistroVenta {
  id?: string;
  productos: LineaVenta[];
  total: number;
  ganancia: number;
  metodoPago: MetodoPago;
  fecha?: string;
  cajero: string;
}

export interface RegistroUsuario {
  id?: string;
  nombre: string;
  rol: RolUsuario;
  correo: string;
  contrasena: string;
}

export interface MensajeRespuesta {
  mensaje: string;
  datos: null;
}

export const diasSemanaCortos = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as const;

export const esMetodoPagoValido = (valor: string): valor is MetodoPago =>
  metodosPago.includes(valor as MetodoPago);

export const esRolUsuarioValido = (valor: string): valor is RolUsuario =>
  rolesUsuario.includes(valor as RolUsuario);
