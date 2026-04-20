interface EstadoVacioProps {
  titulo: string;
  descripcion: string;
}

export function EstadoVacio({ titulo, descripcion }: EstadoVacioProps): JSX.Element {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center shadow-sm">
      <h3 className="text-lg font-bold text-slate-900">{titulo}</h3>
      <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-500">{descripcion}</p>
    </div>
  );
}
