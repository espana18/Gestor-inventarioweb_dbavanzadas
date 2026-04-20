import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { Boton } from '../componentes/Boton';
import { EstadoCargando } from '../componentes/EstadoCargando';
import { EstadoError } from '../componentes/EstadoError';
import { EstadoVacio } from '../componentes/EstadoVacio';
import { Modal } from '../componentes/Modal';
import { formatearMonedaColombiana } from '../servicios/formato';
import { escucharVentaRegistrada } from '../servicios/eventos';
import { obtenerProductosMasVendidos, obtenerReporte } from '../servicios/analiticaAvanzadaServicio';
import * as productosServicio from '../servicios/productosServicio';
import { obtenerCajeros } from '../servicios/usuariosServicio';
import type { Producto } from '../tipos/modelos';

type RangoFiltro = 'hoy' | 'semana' | 'mes' | 'personalizado';

interface FiltrosReporte {
  rango: RangoFiltro;
  desde: string;
  hasta: string;
  usuarioId: string;
}

interface ProductoMasVendido {
  productoId: string;
  nombre: string;
  unidadesVendidas: number;
  ingresosGenerados: number;
  gananciaGenerada: number;
}

const coloresPie = ['#0056b3', '#14b8a6', '#8b5cf6', '#f59e0b'];

const obtenerFechaISO = (fecha: Date): string => fecha.toISOString().slice(0, 10);

const obtenerInicioSemana = (fecha: Date): Date => {
  const copia = new Date(fecha);
  const indice = copia.getDay();
  copia.setDate(copia.getDate() - indice);
  copia.setHours(0, 0, 0, 0);
  return copia;
};

const obtenerInicioMes = (fecha: Date): Date => new Date(fecha.getFullYear(), fecha.getMonth(), 1);

const formatoMonedaCorta = (valor: number): string => formatearMonedaColombiana(valor);

export function Reportes(): JSX.Element {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<FiltrosReporte>({
    rango: 'hoy',
    desde: obtenerFechaISO(new Date()),
    hasta: obtenerFechaISO(new Date()),
    usuarioId: ''
  });
  const [filtrosAplicados, setFiltrosAplicados] = useState<FiltrosReporte>(filtros);
  const [reporte, setReporte] = useState<{
    totalIngresos: number;
    gananciaTotal: number;
    totalVentas: number;
    unidadesVendidas: number;
    ventasPorDia: Array<{ dia: string; total: number }>;
    ventasPorMetodoPago: Array<{ _id: string; total: number }>;
  } | null>(null);
  const [productosMasVendidos, setProductosMasVendidos] = useState<ProductoMasVendido[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productoEntrada, setProductoEntrada] = useState<Producto | null>(null);
  const [cantidadEntrada, setCantidadEntrada] = useState('');
  const [cajeros, setCajeros] = useState<Array<{ id: string; nombre: string }>>([]);

  const cargar = async (filtrosActuales: FiltrosReporte): Promise<void> => {
    try {
      setError(null);
      setCargando(true);
      const parametrosReporte = {
        desde: filtrosActuales.desde,
        hasta: filtrosActuales.hasta
      } as const;

      const [datosReporte, datosProductosMasVendidos, productosObtenidos] = await Promise.all([
        obtenerReporte(
          filtrosActuales.usuarioId.length > 0
            ? { ...parametrosReporte, usuarioId: filtrosActuales.usuarioId }
            : parametrosReporte
        ),
        obtenerProductosMasVendidos({ desde: filtrosActuales.desde, hasta: filtrosActuales.hasta, limite: 10 }),
        productosServicio.obtenerTodos()
      ]);

      setReporte(datosReporte);
      setProductosMasVendidos(datosProductosMasVendidos.productos);
      setProductos(productosObtenidos);
    } catch (errorInterno: unknown) {
      const mensaje = errorInterno instanceof Error ? errorInterno.message : 'No se pudieron cargar los reportes.';
      setError(mensaje);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    void cargar(filtrosAplicados);
  }, [filtrosAplicados]);

  useEffect(() => escucharVentaRegistrada(() => void cargar(filtrosAplicados)), [filtrosAplicados]);

  useEffect(() => {
    void obtenerCajeros().then((datos) => setCajeros(datos.map((cajero) => ({ id: cajero.usuarioMongoId, nombre: cajero.nombre })))).catch(() => setCajeros([]));
  }, []);

  const aplicarFiltros = (): void => {
    setFiltrosAplicados(filtros);
  };

  const actualizarRango = (rango: RangoFiltro): void => {
    const hoy = new Date();
    let desde = obtenerFechaISO(hoy);
    let hasta = obtenerFechaISO(hoy);

    if (rango === 'semana') {
      desde = obtenerFechaISO(obtenerInicioSemana(hoy));
    }

    if (rango === 'mes') {
      desde = obtenerFechaISO(obtenerInicioMes(hoy));
    }

    setFiltros((anterior) => ({ ...anterior, rango, desde, hasta }));
  };

  const limpiar = (): void => {
    const hoy = obtenerFechaISO(new Date());
    const nuevosFiltros: FiltrosReporte = { rango: 'hoy', desde: hoy, hasta: hoy, usuarioId: '' };
    setFiltros(nuevosFiltros);
    setFiltrosAplicados(nuevosFiltros);
  };

  const datosBarras = reporte?.ventasPorDia ?? [];
  const datosPie = reporte?.ventasPorMetodoPago ?? [];

  const productosAlertados = useMemo(() => productos.filter((producto) => producto.stock <= 5), [productos]);

  const registrarEntradaStock = async (): Promise<void> => {
    if (productoEntrada === null) {
      return;
    }

    const cantidad = Number(cantidadEntrada);
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      return;
    }

    await productosServicio.actualizar(productoEntrada.id, {
      stock: productoEntrada.stock + cantidad,
      fechaActualizacion: new Date().toISOString()
    });

    setProductoEntrada(null);
    setCantidadEntrada('');
    await cargar(filtrosAplicados);
  };

  if (cargando) {
    return <EstadoCargando />;
  }

  if (error !== null) {
    return <EstadoError mensaje={error} alReintentar={() => void cargar(filtrosAplicados)} />;
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primario">Reportes</p>
        <h1 className="mt-2 text-2xl font-black text-slate-900">Panel de analítica</h1>
        <p className="mt-2 text-sm text-slate-500">Resumen del período, productos vendidos y alertas de inventario.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        {(['resumen', 'vendidos', 'inventario'] as const).map((pestana) => (
          <button key={pestana} type="button" className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
            {pestana === 'resumen' ? 'Resumen del período' : pestana === 'vendidos' ? 'Productos más vendidos' : 'Alertas de inventario'}
          </button>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-end">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Rango de fechas</span>
              <select
                value={filtros.rango}
                onChange={(evento) => actualizarRango(evento.target.value as RangoFiltro)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
              >
                <option value="hoy">Hoy</option>
                <option value="semana">Esta semana</option>
                <option value="mes">Este mes</option>
                <option value="personalizado">Rango personalizado</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Cajero</span>
              <select
                value={filtros.usuarioId}
                onChange={(evento) => setFiltros((anterior) => ({ ...anterior, usuarioId: evento.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
              >
                <option value="">Todos</option>
                {cajeros.map((cajero) => (
                  <option key={cajero.id} value={cajero.id}>{cajero.nombre}</option>
                ))}
              </select>
            </label>

            {filtros.rango === 'personalizado' ? (
              <>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Desde</span>
                  <input type="date" value={filtros.desde} onChange={(evento) => setFiltros((anterior) => ({ ...anterior, desde: evento.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Hasta</span>
                  <input type="date" value={filtros.hasta} onChange={(evento) => setFiltros((anterior) => ({ ...anterior, hasta: evento.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" />
                </label>
              </>
            ) : null}
          </div>

          <div className="flex gap-3">
            <Boton type="button" variante="primario" onClick={aplicarFiltros}>Aplicar filtros</Boton>
            <Boton type="button" variante="secundario" onClick={limpiar}>Limpiar</Boton>
          </div>
        </div>
      </div>

      {reporte ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Ingresos totales</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{formatoMonedaCorta(reporte.totalIngresos)}</p>
            </article>
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Ganancia neta</p>
              <p className="mt-2 text-2xl font-black text-emerald-700">{formatoMonedaCorta(reporte.gananciaTotal)}</p>
            </article>
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Número de ventas</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{reporte.totalVentas}</p>
            </article>
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Productos vendidos</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{reporte.unidadesVendidas}</p>
            </article>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Ventas por día</h2>
              <div className="mt-4 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={datosBarras}>
                    <XAxis dataKey="dia" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip formatter={(valor: number) => [formatoMonedaCorta(valor), 'Ventas']} />
                    <Bar dataKey="total" fill="#0056b3" radius={[12, 12, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Distribución por método de pago</h2>
              <div className="mt-4 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={datosPie} dataKey="total" nameKey="_id" innerRadius={70} outerRadius={110} paddingAngle={4}>
                      {datosPie.map((_entrada, indice) => (
                        <Cell key={indice} fill={coloresPie[indice % coloresPie.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(valor: number) => formatoMonedaCorta(valor)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </article>
          </div>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Productos más vendidos</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">#</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Producto</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Unidades</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Ingresos</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Ganancia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {productosMasVendidos.map((producto, indice) => (
                    <tr key={producto.productoId}>
                      <td className="px-5 py-4 text-sm font-bold text-slate-900">#{indice + 1}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">{producto.nombre}</td>
                      <td className="px-5 py-4 text-sm text-slate-900">{producto.unidadesVendidas}</td>
                      <td className="px-5 py-4 text-sm text-slate-900">{formatoMonedaCorta(producto.ingresosGenerados)}</td>
                      <td className="px-5 py-4 text-sm text-emerald-700">{formatoMonedaCorta(producto.gananciaGenerada)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-900">Alertas de inventario</h2>
              <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-700">{productosAlertados.length} productos necesitan reabastecimiento</span>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Nombre</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Categoría</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Stock actual</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Stock mínimo</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Déficit</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {productosAlertados.map((producto) => (
                    <tr key={producto.id}>
                      <td className="px-5 py-4 text-sm text-slate-900">{producto.nombre}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">{producto.categoria}</td>
                      <td className="px-5 py-4 text-sm text-slate-900">{producto.stock}</td>
                      <td className="px-5 py-4 text-sm text-slate-900">5</td>
                      <td className="px-5 py-4 text-sm text-red-700">{Math.max(0, 5 - producto.stock)}</td>
                      <td className="px-5 py-4">
                        <Boton variante="texto" tamano="pequeno" onClick={() => setProductoEntrada(producto)}>Registrar entrada de stock</Boton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </>
      ) : (
        <EstadoVacio titulo="Sin datos" descripcion="No hay información para el período seleccionado." />
      )}

      <Modal abierto={productoEntrada !== null} titulo="Registrar entrada" subtitulo={productoEntrada ? productoEntrada.nombre : ''} alCerrar={() => setProductoEntrada(null)} anchoMaximo="md">
        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Cantidad a agregar</span>
            <input type="number" min={1} step={1} value={cantidadEntrada} onChange={(evento) => setCantidadEntrada(evento.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" />
          </label>
          <div className="flex justify-end gap-3">
            <Boton variante="secundario" onClick={() => setProductoEntrada(null)}>Cancelar</Boton>
            <Boton variante="primario" onClick={() => void registrarEntradaStock()}>Guardar</Boton>
          </div>
        </div>
      </Modal>
    </section>
  );
}
