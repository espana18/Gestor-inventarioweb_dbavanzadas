import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { PeticionRegistro, SesionUsuario } from '../tipos/modelos';
import { useAuth } from '../contexto/AuthContexto';
import { api } from '../servicios/api';
import { guardarSesion } from '../servicios/sesion';

interface ErroresRegistro {
  nombreTienda?: string;
  nombrePropietario?: string;
  correo?: string;
  contrasena?: string;
  confirmarContrasena?: string;
}

const validarCorreo = (valor: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);

const evaluarFuerza = (valor: string): { nivel: string; color: string; segmentos: number } => {
  const criterios = [valor.length >= 8, /[A-Z]/.test(valor), /[0-9]/.test(valor), /[^A-Za-z0-9]/.test(valor)].filter(Boolean).length;
  if (criterios <= 1) return { nivel: 'Muy débil', color: 'bg-red-500', segmentos: 1 };
  if (criterios === 2) return { nivel: 'Débil', color: 'bg-orange-500', segmentos: 2 };
  if (criterios === 3) return { nivel: 'Buena', color: 'bg-yellow-500', segmentos: 3 };
  return { nivel: 'Fuerte', color: 'bg-emerald-500', segmentos: 4 };
};

const rutaInicialPorRol = (rol: SesionUsuario['usuario']['rol']): string => (rol === 'cajero' ? '/caja' : '/dashboard');

const campoBase = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-primario focus:ring-4 focus:ring-blue-100';

export function Registro(): JSX.Element {
  const navigate = useNavigate();
  const { iniciarSesion } = useAuth();
  const [paso, setPaso] = useState<1 | 2>(1);
  const [cargando, setCargando] = useState(false);
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [errores, setErrores] = useState<ErroresRegistro>({});
  const [formulario, setFormulario] = useState<PeticionRegistro>({
    nombreTienda: '',
    nombrePropietario: '',
    correo: '',
    contrasena: '',
    confirmarContrasena: ''
  });

  const fortaleza = useMemo(() => evaluarFuerza(formulario.contrasena), [formulario.contrasena]);

  const continuar = (): void => {
    const nuevosErrores: ErroresRegistro = {};
    if (formulario.nombreTienda.trim().length === 0) nuevosErrores.nombreTienda = 'El nombre de la tienda es obligatorio.';
    if (formulario.nombrePropietario.trim().length === 0) nuevosErrores.nombrePropietario = 'El nombre del propietario es obligatorio.';
    setErrores(nuevosErrores);

    if (Object.keys(nuevosErrores).length === 0) {
      setPaso(2);
    }
  };

  const crearTienda = async (): Promise<void> => {
    const nuevosErrores: ErroresRegistro = {};
    if (!validarCorreo(formulario.correo)) nuevosErrores.correo = 'Ingresa un correo válido.';
    if (formulario.contrasena.length < 8) nuevosErrores.contrasena = 'La contraseña debe tener al menos 8 caracteres.';
    if (formulario.contrasena !== formulario.confirmarContrasena) nuevosErrores.confirmarContrasena = 'Las contraseñas deben coincidir exactamente.';
    setErrores(nuevosErrores);

    if (Object.keys(nuevosErrores).length > 0) {
      return;
    }

    try {
      setCargando(true);
      const respuesta = await api.post<{ mensaje: string; datos: SesionUsuario }>('/auth/registro', formulario);
      guardarSesion(respuesta.data.datos, true);
      iniciarSesion(respuesta.data.datos, true);
      navigate(rutaInicialPorRol(respuesta.data.datos.usuario.rol), { replace: true });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#eff6ff,_#f8fafc_40%,_#eef2ff_100%)]">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative overflow-hidden px-6 py-10 sm:px-10 lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-12">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0056b3] via-blue-700 to-sky-600" />
          <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-10 right-0 h-64 w-64 rounded-full bg-sky-300/20 blur-3xl" />

          <div className="relative z-10 max-w-xl text-white">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
              Crea tu tienda
            </div>
            <h1 className="mt-8 text-4xl font-black leading-tight tracking-tight sm:text-5xl">Empieza con una base limpia y profesional.</h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-white/80 sm:text-lg">Registra tu tienda y deja listo el punto de venta, el inventario y los reportes en menos de dos minutos.</p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                ['Paso 1', 'Datos de tienda'],
                ['Paso 2', 'Cuenta principal'],
                ['Listo', 'Acceso inmediato']
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
              ['Seguro', 'JWT + bcrypt'],
              ['Aislado', 'Por tienda'],
              ['Escalable', 'Admin y cajero']
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
            <div className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-500">
              <span className={paso === 1 ? 'text-primario' : ''}>Paso 1</span>
              <span>→</span>
              <span className={paso === 2 ? 'text-primario' : ''}>Paso 2</span>
            </div>

            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900">Crear tienda</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Cada campo tiene borde y foco visible para una captura más clara.</p>

            {paso === 1 ? (
              <div className="mt-8 space-y-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Nombre de la tienda</span>
                  <input
                    className={campoBase}
                    value={formulario.nombreTienda}
                    onChange={(evento) => setFormulario((anterior) => ({ ...anterior, nombreTienda: evento.target.value }))}
                    placeholder="Mi tienda"
                  />
                  {errores.nombreTienda ? <p className="mt-2 text-xs font-medium text-red-600">{errores.nombreTienda}</p> : null}
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Tu nombre completo</span>
                  <input
                    className={campoBase}
                    value={formulario.nombrePropietario}
                    onChange={(evento) => setFormulario((anterior) => ({ ...anterior, nombrePropietario: evento.target.value }))}
                    placeholder="Nombre del propietario"
                  />
                  {errores.nombrePropietario ? <p className="mt-2 text-xs font-medium text-red-600">{errores.nombrePropietario}</p> : null}
                </label>

                <button className="flex w-full items-center justify-center rounded-2xl bg-primario px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700" type="button" onClick={continuar}>
                  Continuar →
                </button>
              </div>
            ) : (
              <div className="mt-8 space-y-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Correo electrónico</span>
                  <input
                    className={campoBase}
                    type="email"
                    value={formulario.correo}
                    onChange={(evento) => setFormulario((anterior) => ({ ...anterior, correo: evento.target.value }))}
                    placeholder="correo@tutienda.com"
                  />
                  {errores.correo ? <p className="mt-2 text-xs font-medium text-red-600">{errores.correo}</p> : null}
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Contraseña</span>
                  <div className="relative">
                    <input
                      className={`${campoBase} pr-12`}
                      type={mostrarContrasena ? 'text' : 'password'}
                      value={formulario.contrasena}
                      onChange={(evento) => setFormulario((anterior) => ({ ...anterior, contrasena: evento.target.value }))}
                      placeholder="Mínimo 8 caracteres"
                    />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-sm font-semibold text-slate-500 transition hover:bg-slate-100" onClick={() => setMostrarContrasena((anterior) => !anterior)}>
                      {mostrarContrasena ? 'Ocultar' : 'Ver'}
                    </button>
                  </div>
                  {errores.contrasena ? <p className="mt-2 text-xs font-medium text-red-600">{errores.contrasena}</p> : null}
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Confirmar contraseña</span>
                  <div className="relative">
                    <input
                      className={`${campoBase} pr-12`}
                      type={mostrarConfirmar ? 'text' : 'password'}
                      value={formulario.confirmarContrasena}
                      onChange={(evento) => setFormulario((anterior) => ({ ...anterior, confirmarContrasena: evento.target.value }))}
                      placeholder="Repite la contraseña"
                    />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-sm font-semibold text-slate-500 transition hover:bg-slate-100" onClick={() => setMostrarConfirmar((anterior) => !anterior)}>
                      {mostrarConfirmar ? 'Ocultar' : 'Ver'}
                    </button>
                  </div>
                  {errores.confirmarContrasena ? <p className="mt-2 text-xs font-medium text-red-600">{errores.confirmarContrasena}</p> : null}
                </label>

                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-700">Fortaleza de contraseña</span>
                    <span className="text-slate-500">{fortaleza.nivel}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {Array.from({ length: 4 }, (_valor, indice) => (
                      <div key={indice} className={`h-2 rounded-full ${indice < fortaleza.segmentos ? fortaleza.color : 'bg-slate-200'}`} />
                    ))}
                  </div>
                </div>

                <button className="flex w-full items-center justify-center rounded-2xl bg-primario px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60" type="button" disabled={cargando} onClick={() => void crearTienda()}>
                  {cargando ? 'Creando...' : 'Crear mi tienda'}
                </button>

                <p className="text-center text-sm text-slate-500">
                  ¿Ya tienes cuenta?{' '}
                  <Link className="font-semibold text-primario transition hover:text-blue-700" to="/login">
                    Inicia sesión
                  </Link>
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
