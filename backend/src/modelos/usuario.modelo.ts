import { Schema, model } from 'mongoose';
import type { Usuario } from './tipos';
import { rolesUsuario } from './tipos';

const esquemaUsuario = new Schema<Usuario>(
  {
    id: {
      type: String,
      required: [true, 'El identificador del usuario es obligatorio.'],
      unique: true,
      trim: true
    },
    nombre: {
      type: String,
      required: [true, 'El nombre del usuario es obligatorio.'],
      trim: true
    },
    rol: {
      type: String,
      required: [true, 'El rol del usuario es obligatorio.'],
      enum: {
        values: rolesUsuario,
        message: 'El rol del usuario debe ser admin o cajero.'
      }
    },
    correo: {
      type: String,
      required: [true, 'El correo del usuario es obligatorio.'],
      trim: true,
      lowercase: true
    },
    contrasena: {
      type: String,
      required: [true, 'La contraseña en hash es obligatoria.'],
      trim: true,
      select: false
    },
    activo: {
      type: Boolean,
      default: true
    },
    fechaRegistro: {
      type: Date,
      default: Date.now
    },
    tiendaId: {
      type: Schema.Types.ObjectId,
      ref: 'Tienda',
      required: true
    },
  },
  {
    versionKey: false,
    collection: 'usuarios'
  }
);

esquemaUsuario.index({ tiendaId: 1, correo: 1 }, { unique: true });

export const ModeloUsuario = model<Usuario>('Usuario', esquemaUsuario);
