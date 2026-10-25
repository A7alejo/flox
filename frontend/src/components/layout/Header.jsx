// Barra superior (diseño aprobado): a la izquierda, logo (celular) o sección actual (escritorio);
// usuario (avatar, nombre, rol) y cerrar sesión a la derecha.
// En escritorio convive con la barra lateral; en celular es el único lugar
// donde se ve el usuario y se puede cerrar sesión.
import { TemaSelector } from './TemaSelector';

const TITULOS = {
  dashboard: 'Inicio',
  inventario: 'Stock',
  caja: 'Caja',
  envios: 'Envíos',
  usuarios: 'Usuarios',
};

const ROL_LABEL = { admin: 'Admin', operador: 'Operador' };

export function Header({ active, usuario, onLogout }) {
  const inicial = (usuario.nombre || '?').trim().charAt(0).toUpperCase();
  const rol = ROL_LABEL[usuario.rol] || 'Operador';

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-[#DDE5E1] pt-[env(safe-area-inset-top)]">
      <div className="h-[72px] px-4 md:px-8 flex items-center justify-between gap-3 text-[#1F2A2E]">
        {/* Celular: logo + "Floxer". Escritorio: solo el nombre de la sección actual. */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="md:hidden w-[34px] h-[34px] rounded-[10px] bg-[#0F766E] text-white font-display font-bold text-[17px] flex items-center justify-center shrink-0" aria-hidden="true">
            F
          </div>
          <span className="md:hidden font-display font-bold text-lg">Floxer</span>
          <span className="hidden md:inline font-display font-bold text-xl truncate">{TITULOS[active]}</span>
        </div>

        <div className="flex items-center gap-2.5 md:gap-3.5 min-w-0">
          {/* Celular: nombre a la izquierda del avatar; escritorio: a la derecha */}
          <div className="flex flex-col items-end md:items-start leading-tight min-w-0 md:order-2">
            <span className="text-sm md:text-[15px] font-semibold truncate max-w-[9rem] md:max-w-[14rem]">{usuario.nombre}</span>
            <span className="text-xs md:text-[13px] text-[#4B5B5F]">{rol}</span>
          </div>
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#D9F0EC] text-[#0F5C55] font-bold text-[15px] md:text-base flex items-center justify-center shrink-0 md:order-1" aria-hidden="true">
            {inicial}
          </div>
          <TemaSelector />
          <button
            type="button"
            onClick={onLogout}
            aria-label="Cerrar sesión"
            className="min-h-[44px] min-w-[44px] px-3 md:px-[18px] md:ml-2 rounded-xl border border-[#B8C6C1] bg-white text-sm md:text-[15px] font-semibold hover:bg-slate-50 shrink-0 md:order-3"
          >
            <span className="md:hidden">Salir</span>
            <span className="hidden md:inline">Cerrar sesión</span>
          </button>
        </div>
      </div>
    </header>
  );
}
