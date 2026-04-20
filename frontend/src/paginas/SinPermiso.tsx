import { Link } from 'react-router-dom';

export function SinPermiso(): JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#eff6ff,_#f8fafc_45%,_#eef2ff_100%)] px-4">
      <div className="w-full max-w-xl rounded-[2rem] border border-slate-200 bg-white/95 p-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-2xl">⛔</div>
        <p className="mt-5 text-sm font-semibold uppercase tracking-[0.35em] text-red-600">Acceso restringido</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">No tienes permisos para esta sección</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">Tu rol actual no permite entrar a esta vista. Vuelve al panel permitido para tu usuario.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link className="rounded-2xl bg-primario px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700" to="/login">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
