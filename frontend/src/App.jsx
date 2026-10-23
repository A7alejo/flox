import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { BottomNav, Sidebar } from './components/layout/Nav';
import { InstallBanner } from './components/layout/InstallBanner';
import { Spinner } from './components/ui/States';
import { Button } from './components/ui/Primitives';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import InventarioPage from './pages/InventarioPage';
import CajaPage from './pages/CajaPage';
import EnviosPage from './pages/EnviosPage';

const PAGES = {
  dashboard: DashboardPage,
  inventario: InventarioPage,
  caja: CajaPage,
  envios: EnviosPage,
};

function Shell() {
  const { usuario, logout } = useAuth();
  const [active, setActive] = useState('dashboard');
  const Page = PAGES[active];

  return (
    <div className="min-h-screen flex bg-[var(--bg)]">
      <Sidebar active={active} onChange={setActive} usuario={usuario} onLogout={logout} />
      <div className="flex-1 min-w-0 flex flex-col">
        <main className="flex-1 px-4 sm:px-6 md:px-10 pt-[max(1.5rem,env(safe-area-inset-top))] md:pt-8 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-8 max-w-5xl w-full mx-auto">
          <InstallBanner />
          <Page />
        </main>
        <footer className="hidden md:block px-10 py-4 max-w-5xl w-full mx-auto text-xs text-slate-500">
          Flox — panel de gestión interna
        </footer>
      </div>
      <BottomNav active={active} onChange={setActive} />
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
