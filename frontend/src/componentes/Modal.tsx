import { useEffect, type MouseEvent, type ReactNode } from 'react';

interface ModalProps {
  abierto: boolean;
  titulo: string;
  subtitulo?: string;
  alCerrar: () => void;
  children: ReactNode;
  anchoMaximo?: 'md' | 'lg' | 'xl';
  bloquearCierre?: boolean;
}

const anchoModal: Record<NonNullable<ModalProps['anchoMaximo']>, string> = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl'
};

export function Modal({ abierto, titulo, subtitulo, alCerrar, children, anchoMaximo = 'lg', bloquearCierre = false }: ModalProps): JSX.Element | null {
  useEffect(() => {
    if (!abierto) {
      return undefined;
    }

    const manejarTecla = (evento: KeyboardEvent): void => {
      if (bloquearCierre) {
        return;
      }

      if (evento.key === 'Escape') {
        alCerrar();
      }
    };

    window.addEventListener('keydown', manejarTecla);

    return () => window.removeEventListener('keydown', manejarTecla);
  }, [abierto, alCerrar]);

  if (!abierto) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm"
      onClick={bloquearCierre ? undefined : alCerrar}
      role="presentation"
    >
      <div
        className={[
          'w-full rounded-3xl bg-white p-6 shadow-2xl',
          anchoModal[anchoMaximo]
        ].join(' ')}
        onClick={(evento: MouseEvent<HTMLDivElement>) => evento.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-titulo"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="modal-titulo" className="text-xl font-bold text-slate-900">
              {titulo}
            </h2>
            {subtitulo ? <p className="mt-1 text-sm text-slate-500">{subtitulo}</p> : null}
          </div>
          {bloquearCierre ? null : (
            <button
              type="button"
              className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
              onClick={alCerrar}
              aria-label="Cerrar modal"
            >
              ×
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
