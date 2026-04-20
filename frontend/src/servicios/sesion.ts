import type { SesionUsuario } from '../tipos/modelos';

const claveSesionLocal = 'gestor_inventario_sesion_local';
const claveSesionSesion = 'gestor_inventario_sesion_sesion';

let cerradorSesionGlobal: (() => void) | null = null;

export const obtenerSesionGuardada = (): SesionUsuario | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const contenido = window.localStorage.getItem(claveSesionLocal) ?? window.sessionStorage.getItem(claveSesionSesion);
  if (contenido === null) {
    return null;
  }

  try {
    return JSON.parse(contenido) as SesionUsuario;
  } catch {
    return null;
  }
};

export const guardarSesion = (sesion: SesionUsuario, recordar: boolean): void => {
  if (typeof window === 'undefined') {
    return;
  }

  const contenido = JSON.stringify(sesion);
  if (recordar) {
    window.localStorage.setItem(claveSesionLocal, contenido);
    window.sessionStorage.removeItem(claveSesionSesion);
    return;
  }

  window.sessionStorage.setItem(claveSesionSesion, contenido);
  window.localStorage.removeItem(claveSesionLocal);
};

export const limpiarSesion = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(claveSesionLocal);
  window.sessionStorage.removeItem(claveSesionSesion);
};

export const establecerCerradorSesionGlobal = (cerrador: (() => void) | null): void => {
  cerradorSesionGlobal = cerrador;
};

export const ejecutarCerradorSesionGlobal = (): void => {
  cerradorSesionGlobal?.();
};

export const obtenerTokenSesion = (): string | null => obtenerSesionGuardada()?.token ?? null;
