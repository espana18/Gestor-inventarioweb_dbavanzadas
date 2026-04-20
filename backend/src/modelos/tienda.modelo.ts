import bcrypt from 'bcryptjs';
import { Schema, model, type HydratedDocument, type Model } from 'mongoose';
import type { ConfiguracionTienda, PlanTienda, Tienda } from './tipos';

interface MetodosTienda {
  compararContrasena(contrasenaCandidata: string): Promise<boolean>;
}

export type DocumentoTienda = HydratedDocument<Tienda, MetodosTienda>;

const esquemaConfiguracion = new Schema<ConfiguracionTienda>(
  {
    moneda: {
      type: String,
      default: 'COP',
      trim: true
    },
    zonaHoraria: {
      type: String,
      default: 'America/Bogota',
      trim: true
    },
    stockMinimoGlobal: {
      type: Number,
      default: 5,
      min: [0, 'El stock mínimo global no puede ser negativo.']
    }
  },
  { _id: false }
);

const esquemasPlanes: PlanTienda[] = ['gratis', 'basico', 'premium'];

const esquemaTienda = new Schema<Tienda, unknown, MetodosTienda>(
  {
    id: {
      type: String,
      required: [true, 'El identificador de la tienda es obligatorio.'],
      unique: true,
      trim: true
    },
    nombreTienda: {
      type: String,
      required: [true, 'El nombre de la tienda es obligatorio.'],
      trim: true
    },
    nombrePropietario: {
      type: String,
      required: [true, 'El nombre del propietario es obligatorio.'],
      trim: true
    },
    correo: {
      type: String,
      required: [true, 'El correo es obligatorio.'],
      unique: true,
      lowercase: true,
      trim: true
    },
    contrasena: {
      type: String,
      required: [true, 'La contraseña es obligatoria.'],
      minlength: [8, 'La contraseña debe tener al menos 8 caracteres.'],
      select: false
    },
    plan: {
      type: String,
      enum: esquemasPlanes,
      default: 'gratis'
    },
    activa: {
      type: Boolean,
      default: true
    },
    fechaRegistro: {
      type: Date,
      default: Date.now
    },
    configuracion: {
      type: esquemaConfiguracion,
      default: () => ({})
    }
  },
  {
    versionKey: false,
    collection: 'tiendas'
  }
);

esquemaTienda.methods.compararContrasena = function compararContrasena(
  this: DocumentoTienda,
  contrasenaCandidata: string
): Promise<boolean> {
  return bcrypt.compare(contrasenaCandidata, this.contrasena);
};

esquemaTienda.pre('save', async function hashContrasena(this: DocumentoTienda, siguiente) {
  if (!this.isModified('contrasena')) {
    siguiente();
    return;
  }

  this.contrasena = await bcrypt.hash(this.contrasena, 12);
  siguiente();
});

interface ModeloTiendaCompleto extends Model<Tienda, unknown, MetodosTienda> {}

export const ModeloTienda = model<Tienda, ModeloTiendaCompleto>('Tienda', esquemaTienda);
