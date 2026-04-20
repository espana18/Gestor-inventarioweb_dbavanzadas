import { Schema, model } from 'mongoose';
import type { Producto } from './tipos';

const esquemaProducto = new Schema<Producto>(
  {
    id: {
      type: String,
      required: [true, 'El identificador del producto es obligatorio.'],
      unique: true,
      trim: true
    },
    nombre: {
      type: String,
      required: [true, 'El nombre del producto es obligatorio.'],
      trim: true
    },
    precio: {
      type: Number,
      required: [true, 'El precio del producto es obligatorio.'],
      min: [0, 'El precio del producto no puede ser negativo.']
    },
    stock: {
      type: Number,
      required: [true, 'El stock del producto es obligatorio.'],
      min: [0, 'El stock del producto no puede ser negativo.']
    },
    stockMinimo: {
      type: Number,
      required: [true, 'El stock mínimo del producto es obligatorio.'],
      min: [0, 'El stock mínimo del producto no puede ser negativo.']
    },
    categoria: {
      type: String,
      required: [true, 'La categoría del producto es obligatoria.'],
      trim: true,
      uppercase: true
    },
    imagenUrl: {
      type: String,
      required: [true, 'La imagen del producto es obligatoria.'],
      trim: true
    },
    codigoProducto: {
      type: String,
      trim: true,
      sparse: true
    },
    tiendaId: {
      type: Schema.Types.ObjectId,
      ref: 'Tienda',
      required: true,
      index: true
    },
    fechaActualizacion: {
      type: String,
      required: [true, 'La fecha de actualización es obligatoria.'],
      trim: true
    }
  },
  {
    versionKey: false,
    collection: 'productos'
  }
);

esquemaProducto.index({ tiendaId: 1, codigoProducto: 1 }, { unique: true, sparse: true });

export const ModeloProducto = model<Producto>('Producto', esquemaProducto);
