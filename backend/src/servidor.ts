import cors from 'cors';
import dotenv from 'dotenv';
import express, { type NextFunction, type Request, type Response } from 'express';
import mongoose from 'mongoose';
import morgan from 'morgan';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { rutasAnalitica } from './rutas/analitica.rutas';
import { rutasCarrito } from './rutas/carrito.rutas';
import { rutasCategorias } from './rutas/categorias.rutas';
import { rutasAuth } from './rutas/auth.rutas';
import { rutasProductos } from './rutas/productos.rutas';
import { rutasVentas } from './rutas/ventas.rutas';
import { rutasUsuarios } from './rutas/usuarios.rutas';
import { crearRespuestaApi, crearRespuestaError } from './utilidades/respuestas';

dotenv.config({ path: resolve(__dirname, '../.env') });

const aplicacion = express();
const puerto = Number(process.env.PUERTO ?? 3001);
const mongoUri = process.env.MONGO_URI;

aplicacion.use(cors());
aplicacion.use(express.json());
aplicacion.use(morgan('dev'));

aplicacion.get('/api/salud', (_req: Request, res: Response<{ mensaje: string; datos: { idSolicitud: string } }>) => {
  res.json(crearRespuestaApi('Servidor operativo.', { idSolicitud: randomUUID() }));
});

aplicacion.use('/api/auth', rutasAuth);
aplicacion.use('/api/productos', rutasProductos);
aplicacion.use('/api/categorias', rutasCategorias);
aplicacion.use('/api/carrito', rutasCarrito);
aplicacion.use('/api/ventas', rutasVentas);
aplicacion.use('/api/analitica', rutasAnalitica);
aplicacion.use('/api/usuarios', rutasUsuarios);

aplicacion.use((_req: Request, res: Response<{ mensaje: string; datos: null }>) => {
  res.status(404).json(crearRespuestaError('Ruta no encontrada.'));
});

aplicacion.use((error: unknown, _req: Request, res: Response<{ mensaje: string; datos: null }>, _next: NextFunction) => {
  const errorTipado = error as { code?: number; name?: string; message?: string };

  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json(crearRespuestaError('El cuerpo JSON enviado no es válido.'));
    return;
  }

  if (errorTipado.code === 11000) {
    res.status(409).json(crearRespuestaError('Ya existe un registro con ese identificador o correo.'));
    return;
  }

  if (error instanceof mongoose.Error.ValidationError) {
    const mensajes = Object.values(error.errors).map((errorInterno) => errorInterno.message);
    res.status(400).json(crearRespuestaError(mensajes.join(' ')));
    return;
  }

  console.error('Error no controlado:', error);
  res.status(500).json(crearRespuestaError(errorTipado.message ?? 'Ocurrió un error interno en el servidor.'));
});

const iniciarServidor = async (): Promise<void> => {
  try {
    if (mongoUri === undefined || mongoUri.trim().length === 0) {
      console.error('No se encontró la variable MONGO_URI en backend/.env.');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('Conexión a MongoDB Atlas establecida correctamente');
    aplicacion.listen(puerto, () => {
      console.log(`Servidor listo en http://localhost:${puerto}`);
    });
  } catch (error: unknown) {
    const mensajeError = error instanceof Error ? error.message : 'Error desconocido al conectar con MongoDB Atlas.';
    console.error(`No se pudo conectar a MongoDB Atlas: ${mensajeError}`);
    process.exit(1);
  }
};

void iniciarServidor();
