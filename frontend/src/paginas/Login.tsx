import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { PeticionLogin, SesionUsuario } from '../tipos/modelos';
import { useAuth } from '../contexto/AuthContexto';
import { api } from '../servicios/api';
import { guardarSesion } from '../servicios/sesion';

interface ErroresLogin {
  correo?: string;
  contrasena?: string;
}

const validarCorreo = (valor: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);

const rutaInicialPorRol = (rol: SesionUsuario['usuario']['rol']): string => (rol === 'cajero' ? '/caja' : '/dashboard');

const campoBase = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-primario focus:ring-4 focus:ring-blue-100';

export function Login(): JSX.Element {
  const navigate = useNavigate();
  const { iniciarSesion, usuario } = useAuth();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [recordarme, setRecordarme] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [errores, setErrores] = useState<ErroresLogin>({});
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);

  useEffect(() => {
    if (usuario !== null) {
      navigate(rutaInicialPorRol(usuario.rol), { replace: true });
    }
  }, [navigate, usuario]);

  const validar = (): ErroresLogin => {
    const nuevosErrores: ErroresLogin = {};

    if (!validarCorreo(correo)) {
      nuevosErrores.correo = 'Ingresa un correo válido.';
    }

    if (contrasena.trim().length === 0) {
      nuevosErrores.contrasena = 'La contraseña es obligatoria.';
    }

    return nuevosErrores;
  };

  const manejarSubmit = async (): Promise<void> => {
    const nuevosErrores = validar();
    setErrores(nuevosErrores);
    setErrorGlobal(null);

    if (Object.keys(nuevosErrores).length > 0) {
      return;
    }

    try {
      setCargando(true);
      const peticion: PeticionLogin = { correo, contrasena };
      const respuesta = await api.post<{ mensaje: string; datos: SesionUsuario }>('/auth/login', peticion);
      guardarSesion(respuesta.data.datos, recordarme);
      iniciarSesion(respuesta.data.datos, recordarme);
      navigate(rutaInicialPorRol(respuesta.data.datos.usuario.rol), { replace: true });
    } catch (errorInterno: unknown) {
      const mensaje = errorInterno instanceof Error ? errorInterno.message : 'No fue posible iniciar sesión.';
      setErrorGlobal(mensaje);
    } finally {
      setCargando(false);
    }
  };

  const detectarEnter = (evento: import('react').KeyboardEvent<HTMLInputElement>): void => {
    if (evento.key === 'Enter') {
      void manejarSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#eff6ff,_#f8fafc_40%,_#eef2ff_100%)]">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative overflow-hidden px-6 py-10 sm:px-10 lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-12">
          <div className="absolute inset-0 bg-gradient-to-br from-primario via-blue-700 to-sky-600" />
          <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-10 right-0 h-64 w-64 rounded-full bg-sky-300/20 blur-3xl" />

          <div className="relative z-10 max-w-xl text-white">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
              Gestor Inventario
            </div>
            <h1 className="mt-8 text-4xl font-black leading-tight tracking-tight sm:text-5xl">Controla ventas, stock y cajeros sin ruido visual.</h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-white/80 sm:text-lg">Acceso rápido, limpio y profesional para administrar tu tienda desde cualquier equipo.</p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                ['Inventario en tiempo real', 'Stock sincronizado por tienda'],
                ['Caja rápida', 'Flujo simple para cajeros'],
                ['Reportes claros', 'Datos listos para decidir']
              ].map(([titulo, descripcion]) => (
                <article key={titulo} className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <p className="text-sm font-semibold text-white">{titulo}</p>
                  <p className="mt-2 text-sm leading-6 text-white/75">{descripcion}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="relative z-10 mt-12 grid gap-4 sm:grid-cols-3 lg:max-w-xl">
            {[
              ['Fácil', 'Login en segundos'],
              ['Seguro', 'JWT y roles'],
              ['Ordenado', 'UI consistente']
            ].map(([valor, etiqueta]) => (
              <article key={valor} className="rounded-3xl border border-white/15 bg-white/10 px-4 py-4 text-white backdrop-blur">
                <p className="text-2xl font-black">{valor}</p>
                <p className="mt-1 text-sm text-white/70">{etiqueta}</p>
              </article>
            ))}
          </div>
        </section>

        <main className="flex items-center justify-center px-6 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-xl rounded-[2rem] border border-slate-200/80 bg-white/95 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-primario">Iniciar sesión</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Bienvenido de nuevo</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Ingresa con el correo de tu tienda. El acceso se ajusta según tu rol.</p>

            <div className="mt-8 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Correo electrónico</span>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">@</span>
                  <input
                    className={`${campoBase} pl-11`}
                    type="email"
                    placeholder="correo@tutienda.com"
                    value={correo}
                    onChange={(evento) => setCorreo(evento.target.value)}
                    onKeyDown={detectarEnter}
                  />
                </div>
                {errores.correo ? <p className="mt-2 text-xs font-medium text-red-600">{errores.correo}</p> : null}
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Contraseña</span>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔒</span>
                  <input
                    className={`${campoBase} pl-11 pr-12`}
                    type={mostrarContrasena ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={contrasena}
                    onChange={(evento) => setContrasena(evento.target.value)}
                    onKeyDown={detectarEnter}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                    onClick={() => setMostrarContrasena((anterior) => !anterior)}
                  >
                    {mostrarContrasena ? 'Ocultar' : 'Ver'}
                  </button>
                </div>
                {errores.contrasena ? <p className="mt-2 text-xs font-medium text-red-600">{errores.contrasena}</p> : null}
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <input type="checkbox" checked={recordarme} onChange={(evento) => setRecordarme(evento.target.checked)} className="h-4 w-4 rounded border-slate-300 text-primario focus:ring-primario" />
                Recordarme en este equipo
              </label>

              {errorGlobal ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorGlobal}</div> : null}

              <button
                className="flex w-full items-center justify-center rounded-2xl bg-primario px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                disabled={cargando}
                onClick={() => void manejarSubmit()}
              >
                {cargando ? 'Iniciando...' : 'Entrar al sistema'}
              </button>

              <p className="text-center text-sm text-slate-500">
                ¿No tienes cuenta?{' '}
                <Link className="font-semibold text-primario transition hover:text-blue-700" to="/registro">
                  Crear tienda
                </Link>
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
