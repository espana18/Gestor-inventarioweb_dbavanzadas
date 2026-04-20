import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexto/AuthContexto';
import { EstadoCargando } from './EstadoCargando';

export function RutaProtegida(): JSX.Element {
  const { usuario, cargandoAuth } = useAuth();

  if (cargandoAuth) {
    return <EstadoCargando texto="Cargando autenticación..." />;
  }

  if (usuario === null) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export function RutaProtegidaAdmin(): JSX.Element {
  const { usuario, cargandoAuth } = useAuth();

  if (cargandoAuth) {
    return <EstadoCargando texto="Cargando autenticación..." />;
  }

  if (usuario === null) {
    return <Navigate to="/login" replace />;
  }

  if (usuario.rol !== 'admin') {
    return <Navigate to="/sin-permiso" replace />;
  }

  return <Outlet />;
}

export function RutaProtegidaCajero(): JSX.Element {
  const { usuario, cargandoAuth } = useAuth();

  if (cargandoAuth) {
    return <EstadoCargando texto="Cargando autenticación..." />;
  }

  if (usuario === null) {
    return <Navigate to="/login" replace />;
  }

  if (usuario.rol !== 'cajero') {
    return <Navigate to="/sin-permiso" replace />;
  }

  return <Outlet />;
}
