import type { ReactNode } from 'react';

interface TarjetaResumenProps {
  titulo: string;
  valor: string;
  descripcion: string;
  icono: ReactNode;
}

export function TarjetaResumen({ titulo, valor, descripcion, icono }: TarjetaResumenProps): JSX.Element {
  return (
    <article className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-50 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{titulo}</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">{valor}</p>
        </div>
        <div className="rounded-2xl bg-primarioClaro p-3 text-primario">{icono}</div>
      </div>
      <p className="mt-4 text-sm text-slate-500">{descripcion}</p>
    </article>
  );
}
