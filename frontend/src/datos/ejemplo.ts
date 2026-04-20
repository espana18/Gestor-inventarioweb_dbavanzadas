import type { LineaVenta, MetodoPago, Producto, Usuario, Venta } from '../tipos/modelos';

const crearFecha = (diasAtras: number, hora: number, minuto: number): string => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - diasAtras);
  fecha.setHours(hora, minuto, 0, 0);
  return fecha.toISOString();
};

const crearImagenSvg = (texto: string, fondo: string): string => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
      <defs>
        <linearGradient id="fondo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${fondo}" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>
      </defs>
      <rect width="400" height="400" rx="48" fill="url(#fondo)" />
      <circle cx="320" cy="80" r="68" fill="rgba(255,255,255,0.12)" />
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" font-weight="700" fill="#ffffff">${texto}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const crearIniciales = (nombre: string): string => {
  const palabras = nombre
    .split(' ')
    .map((palabra) => palabra.trim())
    .filter((palabra) => palabra.length > 0);

  return palabras
    .slice(0, 2)
    .map((palabra) => palabra[0]?.toUpperCase() ?? '')
    .join('');
};

const crearProducto = (
  id: string,
  nombre: string,
  precio: number,
  stock: number,
  categoria: string,
  fondo: string
): Producto => ({
  id,
  nombre,
  precio,
  stock,
  stockMinimo: 5,
  categoria: categoria.toUpperCase(),
  imagenUrl: crearImagenSvg(crearIniciales(nombre), fondo),
  fechaActualizacion: new Date().toISOString()
});

export const productosEjemplo: Producto[] = [
  crearProducto('prod-001', 'Arroz Diana 1 kg', 5200, 24, 'Abarrotes', '#0056b3'),
  crearProducto('prod-002', 'Aceite Premier 1 L', 16800, 12, 'Abarrotes', '#0d47a1'),
  crearProducto('prod-003', 'Leche Alquería 900 ml', 4200, 18, 'Lácteos', '#1565c0'),
  crearProducto('prod-004', 'Café Buendía 250 g', 14900, 9, 'Bebidas', '#1976d2'),
  crearProducto('prod-005', 'Jabón Rey x3', 7800, 4, 'Limpieza', '#0288d1'),
  crearProducto('prod-006', 'Detergente Líquido 1 L', 12400, 7, 'Limpieza', '#0277bd'),
  crearProducto('prod-007', 'Pan Tajado Integral', 6900, 15, 'Panadería', '#1e88e5'),
  crearProducto('prod-008', 'Manzana Roja 1 kg', 8900, 6, 'Frutas', '#2e7d32'),
  crearProducto('prod-009', 'Shampoo Herbal 400 ml', 21900, 11, 'Cuidado personal', '#5e35b1'),
  crearProducto('prod-010', 'Galletas Ducales', 4300, 3, 'Snacks', '#3949ab'),
  crearProducto('prod-011', 'Yogur Griego 1 L', 12900, 8, 'Lácteos', '#4f83cc')
];

const crearLineaVenta = (producto: Producto, cantidad: number): LineaVenta => ({
  productoId: producto.id,
  nombre: producto.nombre,
  cantidad,
  precioUnitario: producto.precio,
  subtotal: producto.precio * cantidad
});

const crearVenta = (
  id: string,
  diasAtras: number,
  hora: number,
  minuto: number,
  metodoPago: MetodoPago,
  cajero: string,
  lineas: Array<{ producto: Producto; cantidad: number }>
): Venta => {
  const productos = lineas.map(({ producto, cantidad }) => crearLineaVenta(producto, cantidad));
  const total = productos.reduce((acumulado, linea) => acumulado + linea.subtotal, 0);
  const ganancia = total;

  return {
    id,
    productos,
    total,
    ganancia,
    metodoPago,
    fecha: crearFecha(diasAtras, hora, minuto),
    cajero
  };
};

const productoArroz = productosEjemplo[0]!;
const productoAceite = productosEjemplo[1]!;
const productoLeche = productosEjemplo[2]!;
const productoCafe = productosEjemplo[3]!;
const productoJabon = productosEjemplo[4]!;
const productoDetergente = productosEjemplo[5]!;
const productoPan = productosEjemplo[6]!;
const productoManzana = productosEjemplo[7]!;
const productoShampoo = productosEjemplo[8]!;
const productoGalletas = productosEjemplo[9]!;
const productoYogur = productosEjemplo[10]!;

export const ventasEjemplo: Venta[] = [
  crearVenta('venta-001', 0, 9, 15, 'Efectivo', 'Laura Pérez', [
    { producto: productoArroz, cantidad: 2 },
    { producto: productoLeche, cantidad: 3 }
  ]),
  crearVenta('venta-002', 0, 13, 42, 'Tarjeta', 'Laura Pérez', [
    { producto: productoShampoo, cantidad: 1 },
    { producto: productoJabon, cantidad: 2 }
  ]),
  crearVenta('venta-003', 1, 17, 5, 'Transferencia', 'Andrés Mora', [
    { producto: productoCafe, cantidad: 1 },
    { producto: productoGalletas, cantidad: 4 }
  ]),
  crearVenta('venta-004', 2, 11, 28, 'Efectivo', 'Laura Pérez', [
    { producto: productoManzana, cantidad: 5 },
    { producto: productoPan, cantidad: 2 }
  ]),
  crearVenta('venta-005', 3, 15, 55, 'Tarjeta', 'Sofía Ríos', [
    { producto: productoAceite, cantidad: 2 },
    { producto: productoYogur, cantidad: 1 }
  ]),
  crearVenta('venta-006', 4, 10, 3, 'Transferencia', 'Sofía Ríos', [
    { producto: productoDetergente, cantidad: 2 },
    { producto: productoLeche, cantidad: 4 }
  ]),
  crearVenta('venta-007', 5, 18, 20, 'Efectivo', 'Andrés Mora', [
    { producto: productoArroz, cantidad: 1 },
    { producto: productoCafe, cantidad: 2 },
    { producto: productoGalletas, cantidad: 1 }
  ]),
  crearVenta('venta-008', 6, 8, 40, 'Tarjeta', 'Laura Pérez', [
    { producto: productoPan, cantidad: 6 },
    { producto: productoManzana, cantidad: 2 }
  ])
];

export const usuarioEjemplo: Usuario = {
  id: 'usuario-001',
  nombre: 'Laura Pérez',
  rol: 'admin',
  correo: 'laura.perez@gestorinventario.com',
  contrasena: 'hash-demo-gestor-inventario'
};
