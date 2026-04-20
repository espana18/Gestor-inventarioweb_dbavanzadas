import type { ButtonHTMLAttributes, ReactNode } from 'react';

type VarianteBoton = 'primario' | 'secundario' | 'peligro' | 'contorno' | 'texto';
type TamanoBoton = 'pequeno' | 'mediano' | 'grande';

interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBoton;
  tamano?: TamanoBoton;
  anchoCompleto?: boolean;
  iconoIzquierdo?: ReactNode;
  iconoDerecho?: ReactNode;
  children?: ReactNode;
  className?: string;
}

const clasesVariante: Record<VarianteBoton, string> = {
  primario: 'bg-primario text-white hover:bg-blue-700 border border-primario shadow-sm',
  secundario: 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200',
  peligro: 'bg-red-600 text-white hover:bg-red-700 border border-red-600',
  contorno: 'bg-transparent text-primario hover:bg-primarioClaro border border-blue-200',
  texto: 'bg-transparent text-primario hover:bg-blue-50 border border-transparent'
};

const clasesTamano: Record<TamanoBoton, string> = {
  pequeno: 'px-3 py-2 text-sm',
  mediano: 'px-4 py-2.5 text-sm',
  grande: 'px-5 py-3 text-base'
};

export function Boton({
  variante = 'primario',
  tamano = 'mediano',
  anchoCompleto = false,
  iconoIzquierdo,
  iconoDerecho,
  className = '',
  children,
  type = 'button',
  ...resto
}: BotonProps): JSX.Element {
  return (
    <button
      type={type}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition duration-200 focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        clasesVariante[variante],
        clasesTamano[tamano],
        anchoCompleto ? 'w-full' : '',
        className
      ]
        .filter(Boolean)
        .join(' ')}
      {...resto}
    >
      {iconoIzquierdo}
      <span>{children}</span>
      {iconoDerecho}
    </button>
  );
}
