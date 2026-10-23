import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { BottomNav, Sidebar } from './components/layout/Nav';
import { InstallBanner } from './components/layout/InstallBanner';
import { Footer } from './components/layout/Footer';
import { Header } from './components/layout/Header';
import { Spinner } from './components/ui/States';
import { Button } from './components/ui/Primitives';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import InventarioPage from './pages/InventarioPage';
import CajaPage from './pages/CajaPage';
import EnviosPage from './pages/EnviosPage';
import UsuariosPage from './pages/UsuariosPage';

const PAGES = {
  dashboard: DashboardPage,
  inventario: InventarioPage,
  caja: CajaPage,
  envios: EnviosPage,
  usuarios: UsuariosPage, // solo admin (ver abajo)
};

function Shell() {
  const { usuario, logout } = useAuth();
  const [active, setActive] = useState('dashboard');
  // Un no-admin nunca ve el panel aunque quede seleccionado (ej. si le cambian el rol)
  const pagina = active === 'usuarios' && usuario.rol !== 'admin' ? 'dashboard' : active;
  const Page = PAGES[pagina];

  return (
    // Header arriba a todo el ancho; debajo, barra lateral (escritorio) + contenido.
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      <Header active={pagina} usuario={usuario} onLogout={logout} />
      <div className="flex-1 flex">
        <Sidebar active={pagina} onChange={setActive} usuario={usuario} />
        <div className="flex-1 min-w-0 flex flex-col">
          <main className="flex-1 px-4 sm:px-6 md:px-10 pt-6 md:pt-8 pb-8 max-w-5xl w-full mx-auto">
            <InstallBanner />
            <Page />
          </main>
          <Footer />
        </div>
      </div>
      <BottomNav active={pagina} onChange={setActive} usuario={usuario} />
    </div>
  );
}

function FullScreen({ children }) {
  return <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">{children}</div>;
}

export default function App() {
  const { usuario, bootError, retry } = useAuth();

  // No se pudo ni preguntar si hay sesión (sin red, servidor caído): distinto de "no hay sesión".
  if (bootError) {
    return (
      <FullScreen>
        <p className="text-sm font-semibold text-red-700 max-w-xs">{bootError.message}</p>
        <Button onClick={retry}>Reintentar</Button>
      </FullScreen>
    );
  }
  if (usuario === undefined) {
    return (
      <FullScreen>
        <Spinner className="w-8 h-8" />
        <p role="status" className="text-sm text-slate-500">Conectando con el servidor…</p>
      </FullScreen>
    );
  }
  if (usuario === null) return <LoginPage />;
  return <Shell />;
}
