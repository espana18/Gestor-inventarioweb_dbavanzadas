import { Schema, model } from 'mongoose';
import type { CarritoCaja, LineaVenta } from './tipos';

const esquemaLineaCarrito = new Schema<LineaVenta>(
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
      required: [true, 'La cantidad del carrito es obligatoria.'],
      min: [1, 'La cantidad del carrito debe ser al menos 1.']
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

const esquemaCarritoCaja = new Schema<CarritoCaja>(
  {
    usuarioId: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
      unique: true,
      index: true
    },
    tiendaId: {
      type: Schema.Types.ObjectId,
      ref: 'Tienda',
      required: true,
      index: true
    },
    productos: {
      type: [esquemaLineaCarrito],
      default: []
    },
    fechaActualizacion: {
      type: Date,
      default: Date.now
    }
  },
  {
    versionKey: false,
    collection: 'carritos_caja'
  }
);

export const ModeloCarritoCaja = model<CarritoCaja>('CarritoCaja', esquemaCarritoCaja);
