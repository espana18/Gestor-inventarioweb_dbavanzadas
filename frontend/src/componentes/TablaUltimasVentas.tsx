import type { Venta } from '../tipos/modelos';
import { formatearHora, formatearMonedaColombiana } from '../servicios/formato';

interface TablaUltimasVentasProps {
  ventas: Venta[];
}

export function TablaUltimasVentas({ ventas }: TablaUltimasVentasProps): JSX.Element {
  const ventasRecientes = [...ventas].sort(
    (ventaA, ventaB) => new Date(ventaB.fecha).getTime() - new Date(ventaA.fecha).getTime()
  ).slice(0, 5);

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-4">
        <h3 className="text-lg font-bold text-slate-900">Últimas ventas</h3>
        <p className="mt-1 text-sm text-slate-500">Las 5 transacciones más recientes del sistema.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Hora</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Cajero</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Total</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Método de pago</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {ventasRecientes.length === 0 ? (
              <tr>
                <td className="px-6 py-10 text-center text-sm text-slate-500" colSpan={4}>
                  Aún no hay ventas registradas.
                </td>
              </tr>
            ) : (
              ventasRecientes.map((venta) => (
                <tr key={venta.id} className="transition hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{formatearHora(venta.fecha)}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{venta.cajero}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">{formatearMonedaColombiana(venta.total)}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{venta.metodoPago}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
