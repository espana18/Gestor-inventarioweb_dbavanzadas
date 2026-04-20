import type { SesionUsuario } from '../tipos/modelos';
import type { NombrePagina } from '../tipos/paginas';
import { Boton } from './Boton';

interface BarraNavegacionProps {
  paginaActiva: NombrePagina;
  alCambiarPagina: (pagina: NombrePagina) => void;
  usuarioActivo: SesionUsuario['usuario'] | null;
  alCerrarSesion: () => void;
}

const etiquetasPaginas: Record<NombrePagina, string> = {
  inicio: 'Inicio',
  inventario: 'Inventario',
  caja: 'Caja',
  historial: 'Historial',
  cajeros: 'Cajeros',
  reportes: 'Reportes'
};

export function BarraNavegacion({ paginaActiva, alCambiarPagina, usuarioActivo, alCerrarSesion }: BarraNavegacionProps): JSX.Element {
  const paginasVisibles: NombrePagina[] = usuarioActivo?.rol === 'cajero' ? ['caja'] : ['inicio', 'inventario', 'historial', 'cajeros', 'reportes'];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primario text-lg font-black text-white shadow-sm">
            GI
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primario">{usuarioActivo?.nombreTienda ?? 'Gestor Inventario'}</p>
            <p className="text-sm text-slate-500">{usuarioActivo?.nombre ?? 'Inventario, POS y analítica en una sola vista'}</p>
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-2">
          {paginasVisibles.map((pagina) => {
            const activo = paginaActiva === pagina;

            return (
              <button
                key={pagina}
                type="button"
                onClick={() => alCambiarPagina(pagina)}
                className={[
                  'rounded-xl px-4 py-2 text-sm font-semibold transition',
                  activo
                    ? 'bg-primario text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-primario'
                ].join(' ')}
              >
                {etiquetasPaginas[pagina]}
              </button>
            );
          })}
        </nav>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="font-medium text-slate-700">{usuarioActivo?.nombre ?? 'Sesión cerrada'}</span>
            {usuarioActivo?.rol ? <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-primario">{usuarioActivo.rol === 'admin' ? 'Admin' : 'Cajero'}</span> : null}
          </div>

          <Boton variante="secundario" tamano="pequeno" onClick={alCerrarSesion}>
            Cerrar sesión
          </Boton>
        </div>
      </div>
    </header>
  );
}
