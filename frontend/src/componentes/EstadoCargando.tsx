interface EstadoCargandoProps {
  texto?: string;
}

export function EstadoCargando({ texto = 'Cargando datos...' }: EstadoCargandoProps): JSX.Element {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-sm">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-primario" />
        <p className="text-sm font-semibold text-slate-600">{texto}</p>
      </div>
    </div>
  );
}
