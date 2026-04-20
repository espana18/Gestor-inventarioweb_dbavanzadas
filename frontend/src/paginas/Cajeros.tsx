import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Boton } from '../componentes/Boton';
import { EstadoCargando } from '../componentes/EstadoCargando';
import { EstadoError } from '../componentes/EstadoError';
import { EstadoVacio } from '../componentes/EstadoVacio';
import { Modal } from '../componentes/Modal';
import { escucharVentaRegistrada } from '../servicios/eventos';
import { crearCajero, eliminarCajero, alternarEstado, obtenerCajeros } from '../servicios/usuariosServicio';
import type { CajeroListado } from '../tipos/modelos';

interface FormularioCajero {
  nombre: string;
  correo: string;
  contrasena: string;
}

const formularioInicial = (): FormularioCajero => ({ nombre: '', correo: '', contrasena: '' });

const campoBase = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-primario focus:ring-4 focus:ring-blue-100';

const iniciales = (nombre: string): string =>
  nombre
    .split(' ')
    .map((fragmento) => fragmento.trim())
    .filter((fragmento) => fragmento.length > 0)
    .slice(0, 2)
    .map((fragmento) => fragmento[0]?.toUpperCase() ?? '')
    .join('');

export function Cajeros(): JSX.Element {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cajeros, setCajeros] = useState<CajeroListado[]>([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [cajeroSeleccionado, setCajeroSeleccionado] = useState<CajeroListado | null>(null);
  const [cajeroCreado, setCajeroCreado] = useState<(CajeroListado & { contrasenaTemporal?: string }) | null>(null);
  const [formulario, setFormulario] = useState<FormularioCajero>(formularioInicial());

  const cargar = async (): Promise<void> => {
    try {
      setError(null);
      setCargando(true);
      setCajeros(await obtenerCajeros());
    } catch (errorInterno: unknown) {
      setError(errorInterno instanceof Error ? errorInterno.message : 'No se pudieron cargar los cajeros.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    void cargar();
  }, []);

  useEffect(() => escucharVentaRegistrada(() => void cargar()), []);

  useEffect(() => {
    if (!modalAbierto) {
      setFormulario(formularioInicial());
    }
  }, [modalAbierto]);

  const guardar = async (evento: FormEvent<HTMLFormElement>): Promise<void> => {
    evento.preventDefault();
    try {
      const creado = await crearCajero(formulario);
      setCajeroCreado(creado);
      setModalAbierto(false);
      await cargar();
    } catch (errorInterno: unknown) {
      setError(errorInterno instanceof Error ? errorInterno.message : 'No se pudo crear el cajero.');
    }
  };

  const cambiarEstado = async (cajero: CajeroListado): Promise<void> => {
    if (!window.confirm(`¿Desactivar/activar a ${cajero.nombre}?`)) return;
    try {
      await alternarEstado(cajero.id);
      await cargar();
    } catch (errorInterno: unknown) {
      setError(errorInterno instanceof Error ? errorInterno.message : 'No se pudo actualizar el estado.');
    }
  };

  const copiar = async (valor: string): Promise<void> => {
    await navigator.clipboard.writeText(valor);
  };

  const eliminar = async (cajero: CajeroListado): Promise<void> => {
    if (cajero.ventasRealizadas > 0) return;
    if (!window.confirm(`¿Eliminar el cajero ${cajero.nombre}?`)) return;
    try {
      await eliminarCajero(cajero.id);
      await cargar();
    } catch (errorInterno: unknown) {
      setError(errorInterno instanceof Error ? errorInterno.message : 'No se pudo eliminar el cajero.');
    }
  };

  if (cargando) return <EstadoCargando />;
  if (error !== null) return <EstadoError mensaje={error} alReintentar={() => void cargar()} />;

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-primario">Cajeros</p>
            <h1 className="mt-2 text-2xl font-black text-slate-900">Gestión de cajeros</h1>
            <p className="mt-2 text-sm text-slate-500">Cada cajero pertenece solo a esta tienda y recibe una contraseña fija.</p>
          </div>
          <Boton variante="primario" onClick={() => setModalAbierto(true)}>Agregar cajero</Boton>
        </div>
      </div>

      {cajeros.length === 0 ? (
        <EstadoVacio titulo="No hay cajeros" descripcion="Aún no se han registrado usuarios con rol cajero." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cajeros.map((cajero) => (
            <article key={cajero.id} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primarioClaro text-sm font-black text-primario">{iniciales(cajero.nombre)}</div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-lg font-bold text-slate-900">{cajero.nombre}</h2>
                  <p className="truncate text-sm text-slate-500">{cajero.correo}</p>
                </div>
                <span className={['rounded-full px-3 py-1 text-xs font-semibold', cajero.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'].join(' ')}>{cajero.activo ? 'Activo' : 'Inactivo'}</span>
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p>Registro: {new Date(cajero.fechaRegistro).toLocaleDateString('es-CO')}</p>
                <p>Ventas realizadas: {cajero.ventasRealizadas}</p>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Boton variante="secundario" tamano="pequeno" onClick={() => setCajeroSeleccionado(cajero)}>Ver credenciales</Boton>
                <Boton variante="contorno" tamano="pequeno" onClick={() => void cambiarEstado(cajero)}>{cajero.activo ? 'Desactivar' : 'Activar'}</Boton>
                <Boton variante="peligro" tamano="pequeno" disabled={cajero.ventasRealizadas > 0} onClick={() => void eliminar(cajero)}>Eliminar</Boton>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal abierto={modalAbierto} alCerrar={() => setModalAbierto(false)} titulo="Agregar cajero" subtitulo="La contraseña se mostrará al finalizar la creación." anchoMaximo="lg">
        <form className="space-y-4" onSubmit={guardar}>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Nombre completo</span>
            <input className={campoBase} value={formulario.nombre} onChange={(evento) => setFormulario((anterior) => ({ ...anterior, nombre: evento.target.value }))} required />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Correo electrónico</span>
            <input type="email" className={campoBase} value={formulario.correo} onChange={(evento) => setFormulario((anterior) => ({ ...anterior, correo: evento.target.value }))} required />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Contraseña fija</span>
            <input type="password" minLength={8} className={campoBase} value={formulario.contrasena} onChange={(evento) => setFormulario((anterior) => ({ ...anterior, contrasena: evento.target.value }))} required />
          </label>
          <div className="flex justify-end gap-3">
            <Boton variante="secundario" onClick={() => setModalAbierto(false)}>Cancelar</Boton>
            <Boton variante="primario" type="submit">Crear cajero</Boton>
          </div>
        </form>
      </Modal>

      <Modal abierto={cajeroSeleccionado !== null} alCerrar={() => setCajeroSeleccionado(null)} titulo="Credenciales del cajero" subtitulo="Copia los datos para compartirlos con el cajero." anchoMaximo="md">
        {cajeroSeleccionado ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Correo</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="truncate text-sm font-semibold text-slate-900">{cajeroSeleccionado.correo}</span>
                <Boton variante="contorno" tamano="pequeno" onClick={() => void copiar(cajeroSeleccionado.correo)}>Copiar</Boton>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Contraseña</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="truncate text-sm font-semibold text-slate-900">{cajeroCreado?.id === cajeroSeleccionado.id && cajeroCreado.contrasenaTemporal !== undefined ? cajeroCreado.contrasenaTemporal : 'No disponible para este cajero'}</span>
                {cajeroCreado?.id === cajeroSeleccionado.id && cajeroCreado.contrasenaTemporal !== undefined ? (
                  <Boton variante="contorno" tamano="pequeno" onClick={() => void copiar(cajeroCreado.contrasenaTemporal ?? '')}>Copiar contraseña</Boton>
                ) : (
                  <Boton variante="contorno" tamano="pequeno" onClick={() => void copiar(cajeroSeleccionado.correo)}>Copiar correo</Boton>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal abierto={cajeroCreado !== null} alCerrar={() => setCajeroCreado(null)} titulo="Cajero creado" subtitulo="Comparte estas credenciales con el cajero." anchoMaximo="md" bloquearCierre>
        {cajeroCreado ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Correo</p>
              <p className="mt-1 font-semibold text-slate-900">{cajeroCreado.correo}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Contraseña</p>
              <p className="mt-1 break-all font-semibold text-slate-900">{cajeroCreado.contrasenaTemporal ?? 'No disponible'}</p>
            </div>
            <div className="flex justify-end">
              <Boton variante="primario" onClick={() => setCajeroCreado(null)}>Entendido</Boton>
            </div>
          </div>
        ) : null}
      </Modal>
    </section>
  );
}
