import { Icon } from '../ui/Icon';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', mobileLabel: 'Inicio', icon: Icon.home },
  { id: 'inventario', label: 'Inventario', mobileLabel: 'Stock', icon: Icon.box },
  { id: 'caja', label: 'Caja', mobileLabel: 'Caja', icon: Icon.wallet },
  { id: 'envios', label: 'Envíos', mobileLabel: 'Envíos', icon: Icon.truck },
];

// Panel de Admin: solo se agrega al menú si el usuario es admin.
const ADMIN_ITEM = { id: 'usuarios', label: 'Usuarios', mobileLabel: 'Admin', icon: Icon.users };

export function navItemsPara(usuario) {
  return usuario?.rol === 'admin' ? [...NAV_ITEMS, ADMIN_ITEM] : NAV_ITEMS;
}

export function Sidebar({ active, onChange, usuario, onLogout }) {
  return (
    <aside className="hidden md:flex md:flex-col md:w-60 md:shrink-0 md:border-r md:border-slate-200 md:bg-white md:py-6 md:px-4 md:gap-1 md:sticky md:top-0 md:h-screen">
      <div className="flex items-center gap-2 px-2 pb-6">
        <div className="w-9 h-9 rounded-lg bg-flox-600 text-white font-display font-extrabold flex items-center justify-center" aria-hidden="true">F</div>
        <span className="font-display font-extrabold text-lg">Flox</span>
      </div>
      <nav aria-label="Navegación principal" className="flex flex-col gap-1">
        {navItemsPara(usuario).map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={'flex items-center gap-3 h-12 px-3 rounded-lg text-sm font-semibold transition-colors ' + (isActive ? 'bg-flox-100 text-flox-700' : 'text-slate-600 hover:bg-slate-50')}
            >
              <item.icon className="w-5 h-5 shrink-0" aria-hidden="true" />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="mt-auto flex items-center gap-2 px-2 pt-4 border-t border-slate-100">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">{usuario.nombre}</div>
          <div className="text-xs text-slate-500 truncate">{usuario.email}{usuario.rol === 'admin' ? ' · Admin' : ''}</div>
        </div>
        <button type="button" onClick={onLogout} aria-label="Cerrar sesión" className="w-12 h-12 rounded-lg text-slate-500 hover:bg-slate-100 flex items-center justify-center">
          <Icon.logout className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
}

export function BottomNav({ active, onChange, usuario }) {
  return (
    <nav aria-label="Navegación principal" className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 flex items-stretch justify-around pb-[env(safe-area-inset-bottom)] z-20">
      {navItemsPara(usuario).map((item) => {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            aria-current={isActive ? 'page' : undefined}
            className={'flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[56px] py-2 text-[11px] font-semibold ' + (isActive ? 'text-flox-600' : 'text-slate-500')}
          >
            <item.icon className="w-5 h-5" aria-hidden="true" />
            {item.mobileLabel}
          </button>
        );
      })}
    </nav>
  );
}
