import { Schema, model } from 'mongoose';
import type { LineaVenta, Venta } from './tipos';
import { metodosPago } from './tipos';

const esquemaLineaVenta = new Schema<LineaVenta>(
  {
    productoId: {
      type: String,
      required: [true, 'El identificador del producto es obligatorio.'],
      trim: true
    },
    nombre: {
      type: String,
      required: [true, 'El nombre del producto es obligatorio.'],
      trim: true
    },
    cantidad: {
      type: Number,
      required: [true, 'La cantidad vendida es obligatoria.'],
      min: [1, 'La cantidad vendida debe ser al menos 1.']
    },
    precioUnitario: {
      type: Number,
      required: [true, 'El precio unitario es obligatorio.'],
      min: [0, 'El precio unitario no puede ser negativo.']
    },
    subtotal: {
      type: Number,
      required: [true, 'El subtotal es obligatorio.'],
      min: [0, 'El subtotal no puede ser negativo.']
    }
  },
  { _id: false }
);

const esquemaVenta = new Schema<Venta>(
  {
    id: {
      type: String,
      required: [true, 'El identificador de la venta es obligatorio.'],
      unique: true,
      trim: true
    },
    productos: {
      type: [esquemaLineaVenta],
      required: [true, 'La venta debe incluir al menos un producto.'],
      validate: {
        validator: (valor: LineaVenta[]): boolean => valor.length > 0,
        message: 'La venta debe incluir al menos un producto.'
      }
    },
    total: {
      type: Number,
      required: [true, 'El total de la venta es obligatorio.'],
      min: [0, 'El total de la venta no puede ser negativo.']
    },
    ganancia: {
      type: Number,
      required: [true, 'La ganancia de la venta es obligatoria.']
    },
    metodoPago: {
      type: String,
      required: [true, 'El método de pago es obligatorio.'],
      enum: {
        values: metodosPago,
        message: 'El método de pago debe ser Efectivo, Tarjeta o Transferencia.'
      }
    },
    fecha: {
      type: String,
      required: [true, 'La fecha de la venta es obligatoria.'],
      trim: true
    },
    cajero: {
      type: String,
      required: [true, 'El nombre del cajero es obligatorio.'],
      trim: true
    },
    usuarioId: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
      index: true
    },
    tiendaId: {
      type: Schema.Types.ObjectId,
      ref: 'Tienda',
      required: true,
      index: true
    }
  },
  {
    versionKey: false,
    collection: 'ventas'
  }
);

export const ModeloVenta = model<Venta>('Venta', esquemaVenta);
