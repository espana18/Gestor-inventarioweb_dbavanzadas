import { useEffect, useMemo, useState } from 'react';
import { Boton } from '../componentes/Boton';
import { TarjetaProducto } from '../componentes/TarjetaProducto';
import { EstadoCargando } from '../componentes/EstadoCargando';
import { EstadoError } from '../componentes/EstadoError';
import { EstadoVacio } from '../componentes/EstadoVacio';
import { Modal } from '../componentes/Modal';
import { imprimirTicket } from '../componentes/TicketVenta';
import { useAuth } from '../contexto/AuthContexto';
import { notificarVentaRegistrada } from '../servicios/eventos';
import { formatearMonedaColombiana } from '../servicios/formato';
import * as carritoServicio from '../servicios/carritoServicio';
import * as productosServicio from '../servicios/productosServicio';
import * as ventasServicio from '../servicios/ventasServicio';
import type { LineaVenta, MetodoPago, Producto, Venta } from '../tipos/modelos';

const metodosPago: MetodoPago[] = ['Efectivo', 'Tarjeta', 'Transferencia'];

const subtotalLinea = (linea: LineaVenta): number => linea.precioUnitario * linea.cantidad;

export function Caja(): JSX.Element {
  const { usuario } = useAuth();
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [carrito, setCarrito] = useState<LineaVenta[]>([]);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('Efectivo');
  const [ventaProcesada, setVentaProcesada] = useState<Venta | null>(null);
  const [efectivoRecibido, setEfectivoRecibido] = useState('');
  const [resumenCierreAbierto, setResumenCierreAbierto] = useState(false);
  const [ventaPendiente, setVentaPendiente] = useState<{ carrito: LineaVenta[]; total: number; metodoPago: MetodoPago } | null>(null);
  const [postCompraActiva, setPostCompraActiva] = useState(false);

  const cargar = async (): Promise<void> => {
    try {
      setError(null);
      setCargando(true);
      const [productosObtenidos, carritoGuardado] = await Promise.all([productosServicio.obtenerTodos(), carritoServicio.obtenerCarrito()]);
      setProductos(productosObtenidos);
      setCarrito(carritoGuardado?.productos ?? []);
    } catch (errorInterno: unknown) {
      setError(errorInterno instanceof Error ? errorInterno.message : 'No se pudo cargar la caja.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    void cargar();
  }, []);

  useEffect(() => {
    if (cargando) return;
    void carritoServicio.guardarCarrito(carrito).catch(() => undefined);
  }, [carrito, cargando]);

  const productosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return productos.filter((producto) => {
      if (texto.length === 0) return true;
      return producto.nombre.toLowerCase().includes(texto) || producto.categoria.toLowerCase().includes(texto) || producto.codigoProducto?.toLowerCase().includes(texto) === true;
    });
  }, [busqueda, productos]);

  const total = useMemo(() => carrito.reduce((acumulado, linea) => acumulado + subtotalLinea(linea), 0), [carrito]);
  const efectivo = Number(efectivoRecibido.replace(/\D/g, ''));
  const cambio = Number.isFinite(efectivo) ? Math.max(0, efectivo - total) : 0;
  const efectivoSuficiente = !Number.isFinite(efectivo) || efectivo >= total;

  const agregarProducto = (producto: Producto): void => {
    if (producto.stock <= 0) return;
    setCarrito((anterior) => {
      const existe = anterior.find((linea) => linea.productoId === producto.id);
      if (existe === undefined) {
        return [...anterior, { productoId: producto.id, nombre: producto.nombre, cantidad: 1, precioUnitario: producto.precio, subtotal: producto.precio }];
      }

      return anterior.map((linea) =>
        linea.productoId === producto.id
          ? { ...linea, cantidad: linea.cantidad + 1, subtotal: producto.precio * (linea.cantidad + 1) }
          : linea
      );
    });
  };

  const actualizarCantidad = (productoId: string, delta: 1 | -1): void => {
    setCarrito((anterior) =>
      anterior
        .map((linea) => {
          if (linea.productoId !== productoId) return linea;
          const nuevoTotal = linea.cantidad + delta;
          if (nuevoTotal <= 0) return linea;
          return { ...linea, cantidad: nuevoTotal, subtotal: linea.precioUnitario * nuevoTotal };
        })
        .filter((linea) => linea.cantidad > 0)
    );
  };

  const eliminarLinea = (productoId: string): void => {
    setCarrito((anterior) => anterior.filter((linea) => linea.productoId !== productoId));
  };

  const limpiarCarrito = async (): Promise<void> => {
    setCarrito([]);
    await carritoServicio.limpiarCarrito();
  };

  const abrirCierreVenta = (): void => {
    if (carrito.length === 0) return;
    setVentaPendiente({ carrito: [...carrito], total, metodoPago });
    setResumenCierreAbierto(true);
  };

  const cancelarCierre = (): void => {
    setResumenCierreAbierto(false);
    setVentaPendiente(null);
  };

  const confirmarCompra = async (): Promise<void> => {
    if (ventaPendiente === null) return;

    if (ventaPendiente.metodoPago === 'Efectivo' && efectivo < ventaPendiente.total) {
      return;
    }

    try {
      const venta = await ventasServicio.crear({
        productos: ventaPendiente.carrito,
        total: ventaPendiente.total,
        ganancia: ventaPendiente.total,
        metodoPago: ventaPendiente.metodoPago,
        fecha: new Date().toISOString(),
        cajero: usuario?.nombre ?? 'Cajero'
      });

      setVentaProcesada(venta);
      setPostCompraActiva(true);
      await limpiarCarrito();
      notificarVentaRegistrada();
      await cargar();
      setResumenCierreAbierto(false);
      setVentaPendiente(null);
    } catch (errorInterno: unknown) {
      setError(errorInterno instanceof Error ? errorInterno.message : 'No se pudo finalizar la venta.');
    }
  };

  const finalizarVenta = async (): Promise<void> => {
    abrirCierreVenta();
  };

  const continuarPostCompra = (): void => {
    setPostCompraActiva(false);
    setVentaProcesada(null);
    setEfectivoRecibido('');
  };

  if (cargando) return <EstadoCargando />;
  if (error !== null) return <EstadoError mensaje={error} alReintentar={() => void cargar()} />;

  return (
    <section className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
      <div className="space-y-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-primario">Caja / POS</p>
          <h1 className="mt-2 text-2xl font-black text-slate-900">Punto de venta</h1>
          <p className="mt-2 text-sm text-slate-500">Esta vista es exclusiva para cajeros.</p>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Buscar producto</span>
          <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-primario focus:ring-4 focus:ring-blue-100" value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Nombre, categoría o código" />
        </label>

        {productosFiltrados.length === 0 ? (
          <EstadoVacio titulo="No hay productos" descripcion="No existen productos que coincidan con la búsqueda." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {productosFiltrados.map((producto) => (
              <TarjetaProducto key={producto.id} producto={producto} alAgregar={agregarProducto} />
            ))}
          </div>
        )}
      </div>

      <aside className="space-y-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primario">Carrito</p>
              <h2 className="mt-2 text-xl font-black text-slate-900">Resumen</h2>
            </div>
            <button type="button" className="text-sm font-semibold text-red-600" onClick={() => void limpiarCarrito()}>Limpiar</button>
          </div>

          <div className="mt-4 space-y-3">
            {carrito.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">El carrito está vacío.</p>
            ) : (
              carrito.map((linea) => (
                <article key={linea.productoId} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">{linea.nombre}</h3>
                      <p className="mt-1 text-sm text-slate-600">{formatearMonedaColombiana(linea.precioUnitario)} por unidad</p>
                    </div>
                    <button type="button" className="text-sm font-semibold text-red-600" onClick={() => eliminarLinea(linea.productoId)}>Eliminar</button>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="inline-flex items-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      <button type="button" className="px-3 py-2 text-slate-600" onClick={() => actualizarCantidad(linea.productoId, -1)}>-</button>
                      <span className="min-w-12 px-4 py-2 text-sm font-semibold">{linea.cantidad}</span>
                      <button type="button" className="px-3 py-2 text-slate-600" onClick={() => actualizarCantidad(linea.productoId, 1)}>+</button>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{formatearMonedaColombiana(linea.subtotal)}</p>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Método de pago</span>
            <select className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-primario focus:ring-4 focus:ring-blue-100" value={metodoPago} onChange={(evento) => setMetodoPago(evento.target.value as MetodoPago)}>
              {metodosPago.map((metodo) => <option key={metodo} value={metodo}>{metodo}</option>)}
            </select>
          </label>

          <div className="mt-5 rounded-3xl bg-primarioClaro px-5 py-4">
            <p className="text-sm font-semibold text-primario">Total a cobrar</p>
            <p className="mt-2 text-3xl font-black text-slate-900">{formatearMonedaColombiana(total)}</p>
          </div>

          <Boton variante="primario" tamano="grande" anchoCompleto className="mt-5" onClick={() => void finalizarVenta()}>
            Finalizar venta
          </Boton>
        </div>
      </aside>

      <Modal abierto={resumenCierreAbierto && ventaPendiente !== null} titulo="Confirmar compra" subtitulo="Revisa el cobro antes de registrar la venta." alCerrar={cancelarCierre} anchoMaximo="md" bloquearCierre>
        {ventaPendiente ? (
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{formatearMonedaColombiana(ventaPendiente.total)}</p>
            </div>

            {ventaPendiente.metodoPago === 'Efectivo' ? (
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Efectivo recibido</span>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-primario focus:ring-4 focus:ring-blue-100"
                  value={efectivoRecibido}
                  onChange={(evento) => setEfectivoRecibido(evento.target.value)}
                  placeholder={ventaPendiente.total.toString()}
                  inputMode="numeric"
                />
                <p className="mt-2 text-sm text-slate-500">Cambio: {formatearMonedaColombiana(cambio)}</p>
              </label>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Boton variante="secundario" onClick={cancelarCierre}>Cancelar</Boton>
              <Boton variante="primario" disabled={ventaPendiente.metodoPago === 'Efectivo' && !efectivoSuficiente} onClick={() => void confirmarCompra()}>
                Finalizar compra
              </Boton>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal abierto={ventaProcesada !== null} titulo="Venta registrada" subtitulo={postCompraActiva ? 'La venta ya fue guardada. Puedes imprimir o cerrar.' : 'Imprime el ticket o inicia otra venta.'} alCerrar={() => setVentaProcesada(null)} anchoMaximo="md" bloquearCierre={postCompraActiva}>
        {ventaProcesada ? (
          <div className="space-y-4">
            {ventaProcesada.metodoPago === 'Efectivo' ? <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">Cambio: {formatearMonedaColombiana(cambio)}</div> : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Boton variante="contorno" onClick={() => imprimirTicket(ventaProcesada, usuario?.nombreTienda ?? 'Gestor Inventario', ventaProcesada.metodoPago === 'Efectivo' && Number.isFinite(efectivo) ? efectivo : undefined)}>Imprimir ticket</Boton>
              <Boton variante="primario" onClick={continuarPostCompra}>Finalizar y salir</Boton>
            </div>
          </div>
        ) : null}
      </Modal>
    </section>
  );
}
