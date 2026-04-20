import { Schema, model } from 'mongoose';
import type { CategoriaProducto } from './tipos';

const esquemaCategoria = new Schema<CategoriaProducto>(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre de la categoría es obligatorio.'],
      trim: true,
      uppercase: true
    },
    tiendaId: {
      type: Schema.Types.ObjectId,
      ref: 'Tienda',
      required: true,
      index: true
    },
    fechaCreacion: {
      type: Date,
      default: Date.now
    }
  },
  {
    versionKey: false,
    collection: 'categorias'
  }
);

esquemaCategoria.index({ tiendaId: 1, nombre: 1 }, { unique: true });

export const ModeloCategoria = model<CategoriaProducto>('Categoria', esquemaCategoria);
