import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import type { Producto, Venta } from '../tipos/modelos';
import type { ResumenHoy, VentaDiaria } from '../tipos/modelos';
import { TarjetaResumen } from '../componentes/TarjetaResumen';
import { TablaUltimasVentas } from '../componentes/TablaUltimasVentas';
import { EstadoCargando } from '../componentes/EstadoCargando';
import { EstadoError } from '../componentes/EstadoError';
import { EstadoVacio } from '../componentes/EstadoVacio';
import { obtenerResumenHoy, obtenerVentasSemanales } from '../servicios/analiticaServicio';
import { obtenerTodas as obtenerVentas } from '../servicios/ventasServicio';
import { formatearMonedaColombiana } from '../servicios/formato';
import { escucharVentaRegistrada } from '../servicios/eventos';

interface PropiedadesInicio {
  productos?: Producto[];
  ventas?: Venta[];
}

export function Inicio({}: PropiedadesInicio): JSX.Element {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resumenHoy, setResumenHoy] = useState<ResumenHoy | null>(null);
  const [ventasSemanales, setVentasSemanales] = useState<VentaDiaria[]>([]);
  const [ultimasVentas, setUltimasVentas] = useState<Venta[]>([]);

  const cargar = async (): Promise<void> => {
    try {
      setError(null);
      setCargando(true);
      const [resumen, semanal, ventasObtenidas] = await Promise.all([
        obtenerResumenHoy(),
        obtenerVentasSemanales(),
        obtenerVentas()
      ]);

      setResumenHoy(resumen);
      setVentasSemanales(semanal);
      setUltimasVentas(ventasObtenidas);
    } catch (errorInterno: unknown) {
      const mensaje = errorInterno instanceof Error ? errorInterno.message : 'No se pudieron cargar los datos. Intenta de nuevo.';
      setError(mensaje);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    void cargar();
  }, []);

  useEffect(() => escucharVentaRegistrada(() => void cargar()), []);

  if (cargando) {
    return <EstadoCargando />;
  }

  if (error !== null) {
    return <EstadoError mensaje={error} alReintentar={() => void cargar()} />;
  }

  if (resumenHoy === null) {
    return (
      <EstadoVacio
        titulo="No hay información disponible"
        descripcion="Aún no existen datos para mostrar el panel. Agrega ventas desde Caja o ejecuta el script de poblar."
      />
    );
  }

  return (
    <section className="space-y-8">
      <div className="rounded-[2rem] bg-gradient-to-r from-primario to-blue-700 px-6 py-8 text-white shadow-slate-200 sm:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-blue-100">Panel de control</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Resumen operativo de la tienda</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-blue-50 sm:text-base">
          Consulta ventas del día, alertas de inventario, tendencia semanal y las transacciones recientes desde una sola vista.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <TarjetaResumen
          titulo="Total ventas del día"
          valor={formatearMonedaColombiana(resumenHoy.totalVentasHoy)}
          descripcion="Suma total facturada en la fecha actual."
          icono={
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
              <path d="M4 19V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M4 19H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M7 15L11 10L14 13L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
        <TarjetaResumen
          titulo="Productos con stock bajo"
          valor={`${resumenHoy.productosStockBajo}`}
          descripcion="Productos con menos de 5 unidades disponibles."
          icono={
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
              <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M4 11H20" stroke="currentColor" strokeWidth="2" />
              <path d="M9 6V18" stroke="currentColor" strokeWidth="2" />
            </svg>
          }
        />
        <TarjetaResumen
          titulo="Ganancia neta del día"
          valor={formatearMonedaColombiana(resumenHoy.gananciaNeta)}
          descripcion="Margen acumulado por ventas registradas hoy."
          icono={
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
              <path d="M12 2V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M16.5 6.5C16.5 5.11929 14.4853 4 12 4C9.51472 4 7.5 5.11929 7.5 6.5C7.5 7.88071 9.51472 9 12 9C14.4853 9 16.5 10.1193 16.5 11.5C16.5 12.8807 14.4853 14 12 14C9.51472 14 7.5 12.8807 7.5 11.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          }
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Ventas semanales</h2>
              <p className="text-sm text-slate-500">Ingresos en pesos colombianos por día de la semana.</p>
            </div>
            <span className="inline-flex w-fit rounded-full bg-primarioClaro px-3 py-1 text-xs font-semibold text-primario">
              Datos desde MongoDB Atlas
            </span>
          </div>

          {ventasSemanales.length === 0 ? (
            <EstadoVacio
              titulo="No hay ventas semanales"
              descripcion="Aún no existen ventas para mostrar la gráfica. Registra una venta en Caja o ejecuta el script de poblar."
            />
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ventasSemanales} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0056b3" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#0056b3" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="dia" tickLine={false} axisLine={false} stroke="#64748b" />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    stroke="#64748b"
                    tickFormatter={(valor) => formatearMonedaColombiana(valor).replace(/^\$\s*/, '')}
                  />
                  <Tooltip
                    formatter={(valor: number) => [formatearMonedaColombiana(valor), 'Ingresos']}
                    labelStyle={{ color: '#0f172a', fontWeight: 700 }}
                    contentStyle={{ borderRadius: 16, borderColor: '#e2e8f0' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#0056b3"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorIngresos)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>

        {ultimasVentas.length === 0 ? (
          <EstadoVacio
            titulo="No hay ventas registradas"
            descripcion="La tabla de últimas ventas aparecerá aquí cuando existan transacciones en la base de datos."
          />
        ) : (
          <TablaUltimasVentas ventas={ultimasVentas} />
        )}
      </div>
    </section>
  );
}
