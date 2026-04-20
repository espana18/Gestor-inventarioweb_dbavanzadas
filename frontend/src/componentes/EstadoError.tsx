import { Boton } from './Boton';

interface EstadoErrorProps {
  mensaje: string;
  alReintentar: () => void;
}

export function EstadoError({ mensaje, alReintentar }: EstadoErrorProps): JSX.Element {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-red-700">No fue posible cargar</p>
        <h2 className="mt-2 text-xl font-bold text-red-900">{mensaje}</h2>
        <p className="mt-3 text-sm text-red-700">Revisa la conexión con el backend y vuelve a intentarlo.</p>
        <div className="mt-5">
          <Boton variante="peligro" onClick={alReintentar}>
            Reintentar
          </Boton>
        </div>
      </div>
    </div>
  );
}
