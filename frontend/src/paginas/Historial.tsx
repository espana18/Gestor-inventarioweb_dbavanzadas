import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Boton } from '../componentes/Boton';
import { EstadoCargando } from '../componentes/EstadoCargando';
import { EstadoError } from '../componentes/EstadoError';
import { EstadoVacio } from '../componentes/EstadoVacio';
import { Modal } from '../componentes/Modal';
import { formatearMonedaColombiana } from '../servicios/formato';
import { escucharVentaRegistrada } from '../servicios/eventos';
import { obtenerHistorial } from '../servicios/ventasHistorialServicio';
import { obtenerCajeros } from '../servicios/usuariosServicio';
import type { Venta } from '../tipos/modelos';

type RangoFiltro = 'hoy' | 'semana' | 'mes' | 'personalizado';
type MetodoPagoFiltro = 'Todos' | 'Efectivo' | 'Tarjeta' | 'Transferencia';

interface FormularioFiltros {
  rango: RangoFiltro;
  desde: string;
  hasta: string;
  metodoPago: MetodoPagoFiltro;
  usuarioId: string;
}

const obtenerFechaISO = (fecha: Date): string => {
  const anio = fecha.getFullYear();
  const mes = `${fecha.getMonth() + 1}`.padStart(2, '0');
  const dia = `${fecha.getDate()}`.padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

const obtenerInicioSemana = (fecha: Date): Date => {
  const copia = new Date(fecha);
  const indice = copia.getDay();
  copia.setDate(copia.getDate() - indice);
  copia.setHours(0, 0, 0, 0);
  return copia;
};

const obtenerInicioMes = (fecha: Date): Date => new Date(fecha.getFullYear(), fecha.getMonth(), 1);

const formatearFechaYHora = (fechaTexto: string): string => {
  const fecha = new Date(fechaTexto);
  const fechaParte = new Intl.DateTimeFormat('es-CO', {
    weekday: 'short',
    day: '2-digit',
    month: 'short'
  }).format(fecha);
  const horaParte = new Intl.DateTimeFormat('es-CO', {
    hour: 'numeric',
    minute: '2-digit'
  }).format(fecha);
  return `${fechaParte} · ${horaParte}`;
};

export function Historial(): JSX.Element {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [filtros, setFiltros] = useState<FormularioFiltros>({
    rango: 'hoy',
    desde: obtenerFechaISO(new Date()),
    hasta: obtenerFechaISO(new Date()),
    metodoPago: 'Todos',
    usuarioId: ''
  });
  const [filtrosAplicados, setFiltrosAplicados] = useState<FormularioFiltros>(filtros);
  const [ventaSeleccionada, setVentaSeleccionada] = useState<Venta | null>(null);
  const [cajeros, setCajeros] = useState<Array<{ id: string; nombre: string }>>([]);

  const resumen = useMemo(() => {
    const totalRecaudado = ventas.reduce((acumulado, venta) => acumulado + venta.total, 0);
    const ganancia = ventas.reduce((acumulado, venta) => acumulado + venta.ganancia, 0);
    return {
      totalRecaudado,
      ganancia,
      ticketPromedio: total > 0 ? totalRecaudado / total : 0
    };
  }, [ventas, total]);

  const cargar = async (paginaSolicitada: number, filtrosActuales: FormularioFiltros): Promise<void> => {
    try {
      setError(null);
      setCargando(true);
      const parametrosHistorial = {
        desde: filtrosActuales.desde,
        hasta: filtrosActuales.hasta,
        metodoPago: filtrosActuales.metodoPago,
        pagina: paginaSolicitada,
        limite: 20
      } as const;

      const respuesta = await obtenerHistorial(
        filtrosActuales.usuarioId.length > 0
          ? { ...parametrosHistorial, usuarioId: filtrosActuales.usuarioId }
          : parametrosHistorial
      );

      setVentas(respuesta.ventas);
      setTotal(respuesta.total);
      setPagina(respuesta.pagina);
      setTotalPaginas(respuesta.totalPaginas);
    } catch (errorInterno: unknown) {
      const mensaje = errorInterno instanceof Error ? errorInterno.message : 'No se pudo cargar el historial.';
      setError(mensaje);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    void cargar(1, filtrosAplicados);
  }, [filtrosAplicados]);

  useEffect(() => escucharVentaRegistrada(() => void cargar(1, filtrosAplicados)), [filtrosAplicados]);

  useEffect(() => {
    void obtenerCajeros().then((datos) => setCajeros(datos.map((cajero) => ({ id: cajero.usuarioMongoId, nombre: cajero.nombre })))).catch(() => setCajeros([]));
  }, []);

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

  const aplicarFiltros = (evento: FormEvent<HTMLFormElement>): void => {
    evento.preventDefault();
    setFiltrosAplicados(filtros);
  };

  const limpiarFiltros = (): void => {
    const hoy = obtenerFechaISO(new Date());
    const nuevosFiltros = {
      rango: 'hoy' as const,
      desde: hoy,
      hasta: hoy,
      metodoPago: 'Todos' as const,
      usuarioId: ''
    };
    setFiltros(nuevosFiltros);
    setFiltrosAplicados(nuevosFiltros);
  };

  const nombresProductos = (venta: Venta): string => {
    const nombres = venta.productos.map((linea) => linea.nombre);
    if (nombres.length <= 2) {
      return nombres.join(', ');
    }

    return `${nombres.slice(0, 2).join(', ')} ... +${nombres.length - 2} más`;
  };

  if (cargando) {
    return <EstadoCargando />;
  }

  if (error !== null) {
    return <EstadoError mensaje={error} alReintentar={() => void cargar(1, filtrosAplicados)} />;
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primario">Historial</p>
        <h1 className="mt-2 text-2xl font-black text-slate-900">Ventas registradas</h1>
        <p className="mt-2 text-sm text-slate-500">Consulta el detalle de ventas por fecha, cajero y método de pago.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total recaudado</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{formatearMonedaColombiana(resumen.totalRecaudado)}</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Número de ventas</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{total}</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Ganancia neta</p>
          <p className="mt-2 text-2xl font-black text-emerald-700">{formatearMonedaColombiana(resumen.ganancia)}</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Ticket promedio</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{formatearMonedaColombiana(resumen.ticketPromedio)}</p>
        </article>
      </div>

      <form className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" onSubmit={aplicarFiltros}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="grid gap-4 xl:grid-cols-4 xl:flex-1">
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
              <span className="mb-2 block text-sm font-semibold text-slate-700">Método de pago</span>
              <select
                value={filtros.metodoPago}
                onChange={(evento) => setFiltros((anterior) => ({ ...anterior, metodoPago: evento.target.value as MetodoPagoFiltro }))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
              >
                <option value="Todos">Todos</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Transferencia">Transferencia</option>
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
                  <input
                    type="date"
                    value={filtros.desde}
                    onChange={(evento) => setFiltros((anterior) => ({ ...anterior, desde: evento.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Hasta</span>
                  <input
                    type="date"
                    value={filtros.hasta}
                    onChange={(evento) => setFiltros((anterior) => ({ ...anterior, hasta: evento.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  />
                </label>
              </>
            ) : null}
          </div>

          <div className="flex gap-3">
            <Boton type="submit" variante="primario">Aplicar filtros</Boton>
            <Boton type="button" variante="secundario" onClick={limpiarFiltros}>Limpiar</Boton>
          </div>
        </div>
      </form>

      {ventas.length === 0 ? (
        <EstadoVacio titulo="No hay ventas" descripcion="No se encontraron ventas con los filtros actuales." />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Fecha y hora</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Cajero</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Productos</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Método</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Total</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Ganancia</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {ventas.map((venta) => (
                  <tr key={venta.id}>
                    <td className="px-5 py-4 text-sm text-slate-600">{formatearFechaYHora(venta.fecha)}</td>
                    <td className="px-5 py-4 text-sm text-slate-900">{venta.cajero}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{nombresProductos(venta)}</td>
                    <td className="px-5 py-4 text-sm">
                      <span className={['rounded-full px-3 py-1 font-semibold', venta.metodoPago === 'Efectivo' ? 'bg-emerald-50 text-emerald-700' : venta.metodoPago === 'Tarjeta' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'].join(' ')}>
                        {venta.metodoPago}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-900">{formatearMonedaColombiana(venta.total)}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-emerald-700">{formatearMonedaColombiana(venta.ganancia)}</td>
                    <td className="px-5 py-4">
                      <Boton variante="texto" tamano="pequeno" onClick={() => setVentaSeleccionada(venta)}>Ver detalle</Boton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">Mostrando {(pagina - 1) * 20 + 1}-{Math.min(pagina * 20, total)} de {total} ventas</p>
            <div className="flex gap-2">
              <Boton variante="secundario" tamano="pequeno" disabled={pagina <= 1} onClick={() => void cargar(pagina - 1, filtrosAplicados)}>← Anterior</Boton>
              <Boton variante="secundario" tamano="pequeno" disabled={pagina >= totalPaginas} onClick={() => void cargar(pagina + 1, filtrosAplicados)}>Siguiente →</Boton>
            </div>
          </div>
        </div>
      )}

      <Modal
        abierto={ventaSeleccionada !== null}
        alCerrar={() => setVentaSeleccionada(null)}
        titulo="Detalle de venta"
        subtitulo={ventaSeleccionada ? `Venta ${ventaSeleccionada.id.slice(0, 8).toUpperCase()}` : ''}
        anchoMaximo="xl"
      >
        {ventaSeleccionada ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase text-slate-500">Número de venta</p>
                <p className="mt-1 font-semibold text-slate-900">{ventaSeleccionada.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase text-slate-500">Fecha y hora</p>
                <p className="mt-1 font-semibold text-slate-900">{new Date(ventaSeleccionada.fecha).toLocaleString('es-CO')}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 sm:col-span-2">
                <p className="text-xs uppercase text-slate-500">Cajero</p>
                <p className="mt-1 font-semibold text-slate-900">{ventaSeleccionada.cajero}</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left">Producto</th>
                    <th className="px-4 py-3 text-left">Cantidad</th>
                    <th className="px-4 py-3 text-left">Precio unitario</th>
                    <th className="px-4 py-3 text-left">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {ventaSeleccionada.productos.map((linea) => (
                    <tr key={`${ventaSeleccionada.id}-${linea.productoId}`}>
                      <td className="px-4 py-3">{linea.nombre}</td>
                      <td className="px-4 py-3">{linea.cantidad}</td>
                      <td className="px-4 py-3">{formatearMonedaColombiana(linea.precioUnitario)}</td>
                      <td className="px-4 py-3">{formatearMonedaColombiana(linea.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-primarioClaro px-4 py-3">
              <div>
                <p className="text-xs uppercase text-primario">Total</p>
                <p className="text-2xl font-black text-slate-900">{formatearMonedaColombiana(ventaSeleccionada.total)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase text-emerald-700">Ganancia neta</p>
                <p className="text-xl font-bold text-emerald-700">{formatearMonedaColombiana(ventaSeleccionada.ganancia)}</p>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </section>
  );
}
