import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SesionUsuario } from '../tipos/modelos';
import { establecerCerradorSesionGlobal, limpiarSesion, obtenerSesionGuardada, guardarSesion } from '../servicios/sesion';

interface AuthContextoValor {
  usuario: SesionUsuario['usuario'] | null;
  cargandoAuth: boolean;
  iniciarSesion: (datos: SesionUsuario, recordar: boolean) => void;
  cerrarSesion: () => void;
}

const AuthContexto = createContext<AuthContextoValor | undefined>(undefined);

const tokenExpirado = (token: string): boolean => {
  try {
    const partes = token.split('.');
    if (partes.length !== 3) {
      return true;
    }

    const contenidoBase64 = partes[1];
    if (contenidoBase64 === undefined) {
      return true;
    }

    const contenidoJson = atob(contenidoBase64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(contenidoJson) as { exp?: number };
    if (payload.exp === undefined) {
      return false;
    }

    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
};

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<SesionUsuario['usuario'] | null>(null);
  const [cargandoAuth, setCargandoAuth] = useState(true);

  useEffect(() => {
    const sesion = obtenerSesionGuardada();
    if (sesion === null || tokenExpirado(sesion.token)) {
      limpiarSesion();
      setUsuario(null);
      setCargandoAuth(false);
      return;
    }

    setUsuario(sesion.usuario);
    setCargandoAuth(false);
  }, []);

  const iniciarSesion = (datos: SesionUsuario, recordar: boolean): void => {
    guardarSesion(datos, recordar);
    setUsuario(datos.usuario);
  };

  const cerrarSesion = (): void => {
    limpiarSesion();
    setUsuario(null);
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    establecerCerradorSesionGlobal(cerrarSesion);
    return () => establecerCerradorSesionGlobal(null);
  }, []);

  const valor = useMemo<AuthContextoValor>(
    () => ({ usuario, cargandoAuth, iniciarSesion, cerrarSesion }),
    [usuario, cargandoAuth]
  );

  return <AuthContexto.Provider value={valor}>{children}</AuthContexto.Provider>;
}

export const useAuth = (): AuthContextoValor => {
  const contexto = useContext(AuthContexto);

  if (contexto === undefined) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }

  return contexto;
};
