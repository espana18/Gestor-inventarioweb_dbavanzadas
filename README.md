# Gestor Inventario

Sistema POS y de inventario para tiendas pequeÃ±as, medianas y grandes.

## PropÃ³sito

Resolver el control operativo de una tienda en un solo sistema:

- inventario con stock mÃ­nimo por producto
- caja con flujo de venta para cajeros
- historial y reportes para administraciÃ³n
- categorÃ­as CRUD
- control de cajeros por tienda
- analÃ­tica en tiempo real

EstÃ¡ pensado para tiendas que necesitan vender, registrar stock, ver alertas y tomar decisiones sin depender de hojas de cÃ¡lculo o procesos manuales.

## Stack TecnolÃ³gico

### Frontend

- `React 18.3.1`: interfaz de usuario
- `TypeScript 5.7.3`: tipado estricto
- `Vite 5.4.12`: desarrollo y build
- `React Router DOM 6.30.1`: rutas y navegaciÃ³n
- `Axios 1.8.0`: consumo de API
- `Recharts 2.15.3`: grÃ¡ficas y analÃ­tica
- `Tailwind CSS 3.4.17`: estilos

### Backend

- `Node.js` + `Express 5.2.1`: API HTTP
- `TypeScript 5.7.3`: tipado estricto
- `MongoDB Atlas` + `Mongoose 8.9.5`: persistencia
- `bcryptjs 3.0.3`: hashes de contraseÃ±as
- `jsonwebtoken 9.0.3`: autenticaciÃ³n por token
- `cors 2.8.5`: acceso del frontend
- `dotenv 16.4.7`: variables de entorno
- `morgan 1.10.0`: logs de peticiones

### Herramientas de desarrollo

- `ts-node-dev 2.0.0`: backend en modo desarrollo
- `npm`: instalaciÃ³n y ejecuciÃ³n

## QuÃ© se hizo

### EvoluciÃ³n por fases

#### Fase 1

- estructura base del proyecto
- frontend y backend separados
- modelos y vistas iniciales
- CRUD base
- primer flujo POS

#### Fase 2

- conexiÃ³n real con MongoDB Atlas
- migraciÃ³n desde persistencia temporal a API real
- servicios HTTP centralizados con Axios
- analÃ­tica bÃ¡sica en dashboard
- ventas con validaciÃ³n real de stock

#### Fase 3

- login y registro mejorados
- separaciÃ³n de roles admin/cajero
- caja persistente en backend
- historial de ventas
- reportes avanzados
- categorÃ­as dedicadas
- cajeros con gestiÃ³n administrativa

#### Fase actual, MVP consolidado

- inventario con `stockMinimo` por producto
- categorÃ­as CRUD
- caja exclusiva para cajeros
- historial filtrable por cajero
- reportes con filtros por perÃ­odo y cajero
- ventas y stock actualizados en tiempo real
- modal profesional de cierre de venta
- impresiÃ³n de factura con cambio
- mejor UX general

## Arquitectura

### Frontend

El frontend consume la API real y mantiene la lÃ³gica de negocio separada por servicios.

- `componentes/`: piezas reutilizables de UI
- `paginas/`: pantallas principales
- `servicios/`: llamadas HTTP y utilidades
- `contexto/`: sesiÃ³n y autenticaciÃ³n
- `tipos/`: modelos TypeScript compartidos

### Backend

El backend estÃ¡ organizado por dominio.

- `modelos/`: esquemas de MongoDB y tipos
- `controladores/`: lÃ³gica de negocio
- `rutas/`: endpoints HTTP
- `middleware/`: autenticaciÃ³n y roles
- `utilidades/`: helpers de respuestas

## CÃ³mo funciona la API

La API sigue el formato:

```json
{ "mensaje": "...", "datos": ... }
```

### Flujo general

1. La ruta recibe la peticiÃ³n.
2. El middleware valida token y rol.
3. El controlador ejecuta la lÃ³gica.
4. El modelo accede a MongoDB.
5. Se responde con `{ mensaje, datos }`.

### Ejemplo

- `GET /api/productos`
- `POST /api/ventas`
- `GET /api/ventas/historial`
- `GET /api/analitica/reporte`

## CÃ³mo se conectan controladores, modelos y rutas

- `rutas`: exponen los endpoints.
- `controladores`: reciben `req`, validan, consultan y responden.
- `modelos`: definen cÃ³mo se guardan los datos en MongoDB.

Ejemplo:

- `rutas/productos.rutas.ts` llama a `controladores/productos.controlador.ts`
- el controlador usa `modelos/producto.modelo.ts`
- la respuesta vuelve al frontend con Axios

## ConexiÃ³n con la base de datos

El backend usa MongoDB Atlas.

### Archivo

- `backend/.env`

### Variables principales

```env
MONGO_URI=mongodb+srv://<usuario>:<contraseña>@<cluster>.mongodb.net/?appName=Cluster0
JWT_SECRETO=tu_secreto
JWT_EXPIRA=7d
PUERTO=3001
```

### Arranque

1. `src/servidor.ts` carga variables con `dotenv`.
2. `mongoose.connect(MONGO_URI)` abre conexiÃ³n.
3. Se registran las rutas en `/api`.
4. El servidor escucha en el puerto configurado.

## Estructura de carpetas

```text
Gestor_Inventario/
â”œâ”€ frontend/
â”‚  â””â”€ src/
â”‚     â”œâ”€ componentes/     UI reutilizable
â”‚     â”œâ”€ contexto/        sesiÃ³n y auth
â”‚     â”œâ”€ datos/           datos de ejemplo
â”‚     â”œâ”€ paginas/         pantallas
â”‚     â”œâ”€ servicios/       llamadas a API
â”‚     â””â”€ tipos/           tipos TS compartidos
â”œâ”€ backend/
â”‚  â””â”€ src/
â”‚     â”œâ”€ controladores/   lÃ³gica de negocio
â”‚     â”œâ”€ middleware/      auth y permisos
â”‚     â”œâ”€ modelos/         esquemas MongoDB
â”‚     â”œâ”€ rutas/           endpoints REST
â”‚     â”œâ”€ scripts/         semillas y utilidades
â”‚     â””â”€ utilidades/      helpers de respuesta
â””â”€ README.md
```

## InstalaciÃ³n

### 1. Clonar o abrir el proyecto

```bash
git clone <url-del-repositorio>
cd Gestor_Inventario
```

### 2. Instalar dependencias

```bash
cd frontend
npm install
```

```bash
cd ../backend
npm install
```

### 3. Configurar variables de entorno

Crear `backend/.env` con:

```env
MONGO_URI=...
JWT_SECRETO=...
JWT_EXPIRA=7d
PUERTO=3001
```

### 4. Ejecutar en desarrollo

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

## Comandos Ãºtiles

### Frontend

```bash
npm run dev
npm run build
npm run preview
npm run typecheck
```

### Backend

```bash
npm run dev
npm run build
npm run start
npm run typecheck
npm run poblar
```

## Funcionalidades principales

- login y registro por tienda
- roles `admin` y `cajero`
- caja exclusiva para cajero
- inventario con stock mÃ­nimo por producto
- categorÃ­as CRUD
- ventas con descuento automÃ¡tico de stock
- historial de ventas por fecha y cajero
- reportes con filtros y analÃ­tica
- gestiÃ³n de cajeros
- persistencia real del carrito de caja

## Roles

### Admin

- ve dashboard, inventario, historial, reportes y cajeros
- gestiona productos, categorÃ­as y cajeros
- consulta ventas y analÃ­tica global de la tienda

### Cajero

- solo accede a Caja
- registra ventas con stock real
- ve cambio, factura e impresiÃ³n
- su actividad queda asociada a su usuario y tienda

## Endpoints principales

| MÃ©todo | Ruta | Uso |
| --- | --- | --- |
| `POST` | `/api/auth/registro` | Registrar tienda y admin |
| `POST` | `/api/auth/login` | Iniciar sesiÃ³n |
| `GET` | `/api/productos` | Listar productos |
| `POST` | `/api/productos` | Crear producto |
| `PUT` | `/api/productos/:id` | Editar producto |
| `DELETE` | `/api/productos/:id` | Eliminar producto |
| `GET` | `/api/categorias` | Listar categorÃ­as |
| `POST` | `/api/categorias` | Crear categorÃ­a |
| `PUT` | `/api/categorias/:id` | Editar categorÃ­a |
| `DELETE` | `/api/categorias/:id` | Eliminar categorÃ­a |
| `GET` | `/api/carrito` | Obtener carrito del cajero |
| `POST` | `/api/carrito` | Guardar carrito del cajero |
| `DELETE` | `/api/carrito` | Limpiar carrito del cajero |
| `GET` | `/api/ventas` | Listar ventas |
| `POST` | `/api/ventas` | Registrar venta |
| `GET` | `/api/ventas/historial` | Historial con filtros |
| `GET` | `/api/analitica/resumen` | Resumen del dÃ­a |
| `GET` | `/api/analitica/semanal` | Ventas semanales |
| `GET` | `/api/analitica/reporte` | Reporte general |
| `GET` | `/api/analitica/productos-mas-vendidos` | Ranking de productos |
| `GET` | `/api/usuarios` | Listar cajeros |
| `POST` | `/api/usuarios` | Crear cajero |
| `PATCH` | `/api/usuarios/:id/estado` | Activar o desactivar cajero |
| `DELETE` | `/api/usuarios/:id` | Eliminar cajero |

## GuÃ­a para Postman

Base URL:

```text
http://localhost:3001/api
```

### 1. Registrar tienda

`POST /auth/registro`

Body JSON:

```json
{
  "nombreTienda": "Tienda D1",
  "nombrePropietario": "Martha",
  "correo": "martha@tienda.com",
  "contrasena": "12345678",
  "confirmarContrasena": "12345678"
}
```

### 2. Iniciar sesiÃ³n

`POST /auth/login`

Body JSON:

```json
{
  "correo": "martha@tienda.com",
  "contrasena": "12345678"
}
```

Respuesta esperada:

- `token`
- `usuario`

Usa el token en Postman como `Bearer Token` o en header:

```text
Authorization: Bearer TU_TOKEN
```

### 3. Ver perfil de sesiÃ³n

`GET /auth/perfil`

Headers:

```text
Authorization: Bearer TU_TOKEN
```

### 4. Crear producto

`POST /productos`

Headers:

```text
Authorization: Bearer TU_TOKEN
Content-Type: application/json
```

Body JSON:

```json
{
  "nombre": "Arroz Diana 1 kg",
  "codigoProducto": "ARZ-001",
  "precio": 5200,
  "stock": 40,
  "stockMinimo": 10,
  "categoria": "GRANOS",
  "imagenUrl": "https://placehold.co/600x600"
}
```

### 5. Editar producto
.0
`PUT /productos/:id`

Body JSON:

```json
{
  "nombre": "Arroz Diana 1 kg",
  "codigoProducto": "ARZ-001",
  "precio": 5300,
  "stock": 38,
  "stockMinimo": 10,
  "categoria": "GRANOS",
  "imagenUrl": "https://placehold.co/600x600"
}
```

### 6. Crear categorÃ­a

`POST /categorias`

Body JSON:

```json
{
  "nombre": "Granos"
}
```

### 7. Editar categorÃ­a

`PUT /categorias/:id`

Body JSON:

```json
{
  "nombre": "Cereales"
}
```

### 8. Crear cajero

`POST /usuarios`

Body JSON:

```json
{
  "nombre": "Cajero 1",
  "correo": "cajero1@tienda.com",
  "contrasena": "12345678"
}
```

### 9. Listar cajeros

`GET /usuarios`

### 10. Registrar venta

`POST /ventas`

Body JSON:

```json
{
  "productos": [
    {
      "productoId": "prod-001",
      "cantidad": 2
    }
  ],
  "total": 10400,
  "ganancia": 10400,
  "metodoPago": "Efectivo",
  "fecha": "2026-04-13T12:00:00.000Z",
  "cajero": "Cajero 1"
}
```

### 11. Ver historial

`GET /ventas/historial?desde=2026-04-13&hasta=2026-04-13&metodoPago=Efectivo`

### 12. Ver analÃ­tica

`GET /analitica/resumen`

`GET /analitica/semanal`

`GET /analitica/reporte?desde=2026-04-13&hasta=2026-04-13`

### 13. Carrito del cajero

`GET /carrito`

`PUT /carrito`

Body JSON:

```json
{
  "productos": [
    {
      "productoId": "prod-001",
      "nombre": "Arroz Diana 1 kg",
      "cantidad": 1,
      "precioUnitario": 5200,
      "subtotal": 5200
    }
  ]
}
```

`DELETE /carrito`

### 14. Eliminar o activar cajero

`PATCH /usuarios/:id/estado`

`DELETE /usuarios/:id`

## Recomendaciones para probar en Postman

1. Primero registra la tienda.
2. Luego inicia sesiÃ³n y copia el token.
3. Agrega el token en Authorization para todas las rutas protegidas.
4. Crea categorÃ­as antes de crear productos.
5. Crea productos con cÃ³digos Ãºnicos por tienda.
6. Registra una venta para comprobar stock, historial y reportes.


## Flujo general

```mermaid
flowchart TD
  A[Login / Registro] --> B[Token JWT]
  B --> C{Rol}
  C -->|Admin| D[Dashboard / Inventario / Historial / Reportes / Cajeros]
  C -->|Cajero| E[Caja]
  E --> F[Carrito en backend]
  F --> G[Registrar venta]
  G --> H[Descontar stock]
  G --> I[Actualizar historial y reportes]
  H --> J[Dashboard se refresca]
  I --> J
```

## Flujo de venta

1. El cajero agrega productos al carrito.
2. El carrito se guarda en backend por usuario y tienda.
3. Al finalizar, el sistema valida stock y forma de pago.
4. Se registra la venta en MongoDB.
5. El stock se descuenta en la misma transacciÃ³n.
6. El dashboard, historial y reportes se actualizan.
7. La factura muestra total, efectivo recibido y cambio.

## Flujo de categorÃ­as

1. El admin crea una categorÃ­a desde Inventario.
2. Puede editarla o eliminarla desde la lista.
3. Las categorÃ­as se guardan por tienda.
4. Los productos usan categorÃ­as normalizadas en mayÃºscula.

## Notas del MVP

Este proyecto llegÃ³ a un MVP funcional para operaciÃ³n real en tienda pequeÃ±a o mediana, con capacidad de escalar a tiendas mÃ¡s grandes por separaciÃ³n de dominios, multiusuario por tienda e integraciÃ³n con MongoDB Atlas.

El foco principal fue evitar procesos manuales, mejorar control de ventas, disminuir errores de caja y dar visibilidad al stock y al movimiento de dinero en tiempo real.

## VerificaciÃ³n rÃ¡pida

1. Inicia backend y frontend.
2. Abre sesiÃ³n como admin o cajero.
3. Registra una venta desde Caja.
4. Verifica que el stock baje.
5. Revisa `Inicio`, `Historial` y `Reportes` para ver la actualizaciÃ³n.


## Pruebas automatizadas con Cypress

Suite E2E (interfaz y API) del Gestor Inventario Web. Cada spec lleva en el nombre el ID del caso de prueba del documento de casos (por ejemplo `cp-caj-001-...`).

### Requisitos

- Node.js 22 o superior
- Frontend en `http://localhost:5173` y backend en `http://localhost:3001` en ejecuciÃ³n
- Una tienda de prueba con: un administrador, un cajero y el producto Â«Arroz 500 gÂ» (cÃ³digo `ARR-500`, con stock)
- No ejecutar `npm run poblar` (borra productos y ventas de toda la base de datos)

### InstalaciÃ³n

```bash
cd frontend
npm install
```

### Credenciales (no se suben a Git)

Copie la plantilla y complete con los datos de la tienda de prueba:

```bash
cp cypress.env.example.json cypress.env.json
```

`cypress.env.json` estÃ¡ en `.gitignore`. TambiÃ©n pueden usarse variables de entorno `CYPRESS_adminCorreo`, `CYPRESS_adminContrasena`, `CYPRESS_cajeroCorreo` y `CYPRESS_cajeroContrasena`.

### EjecuciÃ³n

```bash
npx cypress run                                  # toda la suite
npx cypress run --spec "cypress/e2e/cp-seg-*"    # solo los casos de seguridad
npx cypress open                                 # modo interactivo
```

La URL de la aplicaciÃ³n (`baseUrl`) y de la API (`env.apiUrl`) se definen en `cypress.config.js`.

### Estructura

```
frontend/
â”œâ”€â”€ cypress.config.js          # baseUrl, API y opciones
â”œâ”€â”€ cypress.env.example.json   # plantilla de credenciales (sin datos reales)
â””â”€â”€ cypress/
    â”œâ”€â”€ e2e/                   # specs *.cy.js, uno por caso de prueba
    â”œâ”€â”€ fixtures/              # datos de prueba
    â””â”€â”€ support/               # comandos: loginAdmin, loginCajero, apiLogin
```

### Resultados esperados

Algunos specs **fallan a propÃ³sito**: verifican el resultado esperado del caso y el fallo evidencia un defecto real de la aplicaciÃ³n (ver reporte de defectos del informe).


