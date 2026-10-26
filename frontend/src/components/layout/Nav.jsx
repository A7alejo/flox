import { Icon } from '../ui/Icon';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Inicio', mobileLabel: 'Inicio', icon: Icon.home },
  { id: 'inventario', label: 'Stock', mobileLabel: 'Stock', icon: Icon.box },
  { id: 'caja', label: 'Caja', mobileLabel: 'Caja', icon: Icon.wallet },
  { id: 'envios', label: 'Envíos', mobileLabel: 'Envíos', icon: Icon.truck },
];

// Panel de Admin: solo se agrega al menú si el usuario es admin.
const ADMIN_ITEM = { id: 'usuarios', label: 'Usuarios', mobileLabel: 'Admin', icon: Icon.users };

export function navItemsPara(usuario) {
  return usuario?.rol === 'admin' ? [...NAV_ITEMS, ADMIN_ITEM] : NAV_ITEMS;
}

// Texto que solo aparece con la barra abierta (mouse encima o foco con teclado).
const LABEL = 'whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-has-[:focus-visible]:opacity-100';

// Escritorio (prototipo "Menú lateral"): debajo del header, barra de 72px con
// íconos que se abre a 232px con el mouse (o con Tab: foco visible; un clic no
// la deja abierta). Está en el flujo de la página, así que al abrirse EMPUJA el
// contenido en vez de taparlo. Cerrar sesión vive en el Header.
export function Sidebar({ active, onChange, usuario }) {
  return (
    <aside className="group hidden md:block shrink-0 sticky top-[72px] self-start h-[calc(100vh-72px)] w-[72px] hover:w-[232px] has-[:focus-visible]:w-[232px] transition-[width] duration-200 overflow-hidden py-5 px-3 border-r border-[#DDE5E1] bg-white">
      <div className="flex items-center gap-3 px-1.5 pb-5">
        <div className="w-9 h-9 shrink-0 rounded-[10px] bg-[#0F766E] text-white font-display font-bold text-lg flex items-center justify-center" aria-hidden="true">F</div>
        <span className={'font-display font-bold text-xl text-[#1F2A2E] ' + LABEL}>Floxer</span>
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
              aria-label={item.label}
              title={item.label}
              className={'flex items-center gap-3 h-11 px-3.5 rounded-xl text-[15px] transition-colors ' + (isActive ? 'bg-[#E3F1EE] text-[#0F3D3A] font-semibold' : 'text-[#4B5B5F] font-medium hover:bg-slate-50')}
            >
              <item.icon className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span className={LABEL}>{item.label}</span>
            </button>
          );
        })}
      </nav>
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
            className={'flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[56px] py-2 text-[11px] font-semibold transition-[color,transform] duration-150 active:scale-90 ' + (isActive ? 'text-flox-600' : 'text-slate-500')}
          >
            <item.icon className={'w-5 h-5 transition-transform duration-200 ' + (isActive ? '-translate-y-0.5 scale-110' : '')} aria-hidden="true" />
            {item.mobileLabel}
          </button>
        );
      })}
    </nav>
  );
}
