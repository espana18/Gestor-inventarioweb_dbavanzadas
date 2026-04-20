import { Router } from 'express';
import { obtenerProductosMasVendidos, obtenerReporte, obtenerResumenHoy, obtenerVentasSemanales } from '../controladores/analitica.controlador';
import { autenticar } from '../middleware/autenticar';
import { verificarRol } from '../middleware/verificarRol';

export const rutasAnalitica = Router();

rutasAnalitica.use(autenticar);
rutasAnalitica.get('/resumen', obtenerResumenHoy);
rutasAnalitica.get('/semanal', obtenerVentasSemanales);
rutasAnalitica.get('/reporte', verificarRol(['admin']), obtenerReporte);
rutasAnalitica.get('/productos-mas-vendidos', verificarRol(['admin']), obtenerProductosMasVendidos);
