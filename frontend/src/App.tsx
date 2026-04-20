import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { BarraNavegacion } from './componentes/BarraNavegacion';
import { RutaProtegida, RutaProtegidaAdmin, RutaProtegidaCajero } from './componentes/RutaProtegida';
import { useAuth } from './contexto/AuthContexto';
import { Caja } from './paginas/Caja';
import { Cajeros } from './paginas/Cajeros';
import { Historial } from './paginas/Historial';
import { Inicio } from './paginas/Inicio';
import { Inventario } from './paginas/Inventario';
import { Login } from './paginas/Login';
import { Registro } from './paginas/Registro';
import { Reportes } from './paginas/Reportes';
import { SinPermiso } from './paginas/SinPermiso';

function LayoutProtegido(): JSX.Element {
  const { usuario, cerrarSesion } = useAuth();
  const navegar = useNavigate();
  const ubicacion = useLocation();

  const determinarPaginaActiva = (): 'inicio' | 'inventario' | 'caja' | 'historial' | 'cajeros' | 'reportes' => {
    if (ubicacion.pathname.includes('/inventario')) return 'inventario';
    if (ubicacion.pathname.includes('/cajeros')) return 'cajeros';
    if (ubicacion.pathname.includes('/caja')) return 'caja';
    if (ubicacion.pathname.includes('/historial')) return 'historial';
    if (ubicacion.pathname.includes('/reportes')) return 'reportes';
    return 'inicio';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <BarraNavegacion
        paginaActiva={determinarPaginaActiva()}
        alCambiarPagina={(pagina) => navegar(`/${pagina === 'inicio' ? 'dashboard' : pagina}`)}
        usuarioActivo={usuario}
        alCerrarSesion={cerrarSesion}
      />
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}

export function App(): JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/sin-permiso" element={<SinPermiso />} />
      <Route element={<RutaProtegida />}> 
        <Route element={<LayoutProtegido />}> 
          <Route element={<RutaProtegidaAdmin />}> 
            <Route path="/dashboard" element={<Inicio />} />
            <Route path="/inventario" element={<Inventario />} />
            <Route path="/historial" element={<Historial />} />
            <Route path="/reportes" element={<Reportes />} />
            <Route path="/cajeros" element={<Cajeros />} />
          </Route>
          <Route element={<RutaProtegidaCajero />}> 
            <Route path="/caja" element={<Caja />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
