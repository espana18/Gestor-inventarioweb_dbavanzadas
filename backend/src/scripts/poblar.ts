import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { resolve } from 'node:path';
import { ModeloProducto } from '../modelos/producto.modelo';
import { ModeloVenta } from '../modelos/venta.modelo';
import type { Producto, Venta } from '../modelos/tipos';

dotenv.config({ path: resolve(__dirname, '../../.env') });

const mongoUri = process.env.MONGO_URI;

if (mongoUri === undefined || mongoUri.trim().length === 0) {
  throw new Error('La variable MONGO_URI no está configurada en backend/.env.');
}

const fechaActual = new Date();

const crearFecha = (diasAtras: number, hora: number, minuto: number): string => {
  const fecha = new Date(fechaActual);
  fecha.setDate(fecha.getDate() - diasAtras);
  fecha.setHours(hora, minuto, 0, 0);
  return fecha.toISOString();
};

const productosEjemplo: Producto[] = [
  { id: 'prod-001', nombre: 'Agua Cristal 600 ml', precio: 2500, stock: 40, stockMinimo: 8, categoria: 'BEBIDAS', imagenUrl: 'https://placehold.co/600x600', fechaActualizacion: fechaActual.toISOString() },
  { id: 'prod-002', nombre: 'Gaseosa Coca-Cola 1.5 L', precio: 6500, stock: 28, stockMinimo: 6, categoria: 'BEBIDAS', imagenUrl: 'https://placehold.co/600x600', fechaActualizacion: fechaActual.toISOString() },
  { id: 'prod-003', nombre: 'Leche Alquería 1 L', precio: 4200, stock: 30, stockMinimo: 10, categoria: 'LÁCTEOS', imagenUrl: 'https://placehold.co/600x600', fechaActualizacion: fechaActual.toISOString() },
  { id: 'prod-004', nombre: 'Yogur con cereal', precio: 5500, stock: 18, stockMinimo: 6, categoria: 'LÁCTEOS', imagenUrl: 'https://placehold.co/600x600', fechaActualizacion: fechaActual.toISOString() },
  { id: 'prod-005', nombre: 'Papas Margarita', precio: 4800, stock: 22, stockMinimo: 8, categoria: 'SNACKS', imagenUrl: 'https://placehold.co/600x600', fechaActualizacion: fechaActual.toISOString() },
  { id: 'prod-006', nombre: 'Galletas Festival', precio: 3600, stock: 35, stockMinimo: 8, categoria: 'SNACKS', imagenUrl: 'https://placehold.co/600x600', fechaActualizacion: fechaActual.toISOString() },
  { id: 'prod-007', nombre: 'Detergente líquido 1 L', precio: 12900, stock: 14, stockMinimo: 5, categoria: 'ASEO', imagenUrl: 'https://placehold.co/600x600', fechaActualizacion: fechaActual.toISOString() },
  { id: 'prod-008', nombre: 'Jabón en polvo 1 kg', precio: 8400, stock: 16, stockMinimo: 5, categoria: 'ASEO', imagenUrl: 'https://placehold.co/600x600', fechaActualizacion: fechaActual.toISOString() },
  { id: 'prod-009', nombre: 'Arroz Diana 1 kg', precio: 5200, stock: 45, stockMinimo: 12, categoria: 'GRANOS', imagenUrl: 'https://placehold.co/600x600', fechaActualizacion: fechaActual.toISOString() },
  { id: 'prod-010', nombre: 'Lenteja roja 500 g', precio: 4300, stock: 26, stockMinimo: 10, categoria: 'GRANOS', imagenUrl: 'https://placehold.co/600x600', fechaActualizacion: fechaActual.toISOString() },
  { id: 'prod-011', nombre: 'Café instantáneo 200 g', precio: 14200, stock: 11, stockMinimo: 4, categoria: 'BEBIDAS', imagenUrl: 'https://placehold.co/600x600', fechaActualizacion: fechaActual.toISOString() },
  { id: 'prod-012', nombre: 'Queso campesino 500 g', precio: 15800, stock: 9, stockMinimo: 4, categoria: 'LÁCTEOS', imagenUrl: 'https://placehold.co/600x600', fechaActualizacion: fechaActual.toISOString() }
];

const ventasEjemplo: Venta[] = [
  {
    id: 'venta-001',
    productos: [
      { productoId: 'prod-001', nombre: 'Agua Cristal 600 ml', cantidad: 4, precioUnitario: 2500, subtotal: 10000 },
      { productoId: 'prod-005', nombre: 'Papas Margarita', cantidad: 2, precioUnitario: 4800, subtotal: 9600 }
    ],
    total: 19600,
    ganancia: 19600,
    metodoPago: 'Efectivo',
    fecha: crearFecha(0, 9, 15),
    cajero: 'Martha'
  },
  {
    id: 'venta-002',
    productos: [
      { productoId: 'prod-003', nombre: 'Leche Alquería 1 L', cantidad: 6, precioUnitario: 4200, subtotal: 25200 },
      { productoId: 'prod-009', nombre: 'Arroz Diana 1 kg', cantidad: 2, precioUnitario: 5200, subtotal: 10400 }
    ],
    total: 35600,
    ganancia: 35600,
    metodoPago: 'Tarjeta',
    fecha: crearFecha(1, 11, 40),
    cajero: 'Martha'
  },
  {
    id: 'venta-003',
    productos: [
      { productoId: 'prod-007', nombre: 'Detergente líquido 1 L', cantidad: 1, precioUnitario: 12900, subtotal: 12900 },
      { productoId: 'prod-006', nombre: 'Galletas Festival', cantidad: 3, precioUnitario: 3600, subtotal: 10800 }
    ],
    total: 23700,
    ganancia: 23700,
    metodoPago: 'Transferencia',
    fecha: crearFecha(2, 16, 5),
    cajero: 'Martha'
  },
  {
    id: 'venta-004',
    productos: [
      { productoId: 'prod-012', nombre: 'Queso campesino 500 g', cantidad: 2, precioUnitario: 15800, subtotal: 31600 }
    ],
    total: 31600,
    ganancia: 31600,
    metodoPago: 'Efectivo',
    fecha: crearFecha(4, 13, 20),
    cajero: 'Martha'
  },
  {
    id: 'venta-005',
    productos: [
      { productoId: 'prod-011', nombre: 'Café instantáneo 200 g', cantidad: 1, precioUnitario: 14200, subtotal: 14200 },
      { productoId: 'prod-010', nombre: 'Lenteja roja 500 g', cantidad: 4, precioUnitario: 4300, subtotal: 17200 }
    ],
    total: 31400,
    ganancia: 31400,
    metodoPago: 'Tarjeta',
    fecha: crearFecha(6, 18, 10),
    cajero: 'Martha'
  }
];

const ejecutar = async (): Promise<void> => {
  try {
    await mongoose.connect(mongoUri);
    await Promise.all([ModeloProducto.deleteMany({}), ModeloVenta.deleteMany({})]);

    const productosInsertados = await ModeloProducto.insertMany(productosEjemplo);
    const ventasInsertadas = await ModeloVenta.insertMany(ventasEjemplo);

    console.log(`Productos insertados: ${productosInsertados.length}`);
    console.log(`Ventas insertadas: ${ventasInsertadas.length}`);
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : 'Error desconocido al poblar la base de datos.';
    console.error(mensaje);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

void ejecutar();
