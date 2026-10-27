// Barra superior: la franja azul de la etiqueta Flox, con la ola turquesa abajo.
// A la izquierda, logo (celular) o sección actual (escritorio); usuario (avatar,
// nombre, rol) y cerrar sesión a la derecha.
// En escritorio convive con la barra lateral; en celular es el único lugar
// donde se ve el usuario y se puede cerrar sesión.
// Alto total 72px (64 de franja + 8 de ola): la barra lateral se ubica debajo.
import { TemaSelector } from './TemaSelector';
import { Marca, Ola } from '../ui/Marca';

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
    <header className="sticky top-0 z-20 pt-[env(safe-area-inset-top)] bg-tinta">
      <div className="h-16 px-4 md:px-8 flex items-center justify-between gap-3 text-white">
        {/* Celular: logo + "Floxer". Escritorio: solo el nombre de la sección actual. */}
        <div className="flex items-center gap-2.5 min-w-0">
          <Marca claro className="md:hidden w-9 h-9" />
          <span className="md:hidden font-display font-extrabold text-[22px] leading-none pt-1">Floxer</span>
          <span className="hidden md:inline font-display font-bold text-2xl leading-none pt-1 truncate">{TITULOS[active]}</span>
        </div>

        <div className="flex items-center gap-2.5 md:gap-3.5 min-w-0">
          {/* Celular: nombre a la izquierda del avatar; escritorio: a la derecha */}
          <div className="flex flex-col items-end md:items-start leading-tight min-w-0 md:order-2">
            <span className="text-sm md:text-[15px] font-bold truncate max-w-[9rem] md:max-w-[14rem]">{usuario.nombre}</span>
            <span className="text-xs md:text-[13px] text-white/75">{rol}</span>
          </div>
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/15 text-white font-display font-bold text-base flex items-center justify-center shrink-0 md:order-1" aria-hidden="true">
            {inicial}
          </div>
          <TemaSelector />
          <button
            type="button"
            onClick={onLogout}
            aria-label="Cerrar sesión"
            className="min-h-[44px] min-w-[44px] px-3 md:px-[18px] md:ml-2 rounded-xl border border-white/30 text-white text-sm md:text-[15px] font-bold hover:bg-white/10 shrink-0 md:order-3"
          >
            <span className="md:hidden">Salir</span>
            <span className="hidden md:inline">Cerrar sesión</span>
          </button>
        </div>
      </div>
      {/* La ola va fuera del fondo azul: debajo se ve el fondo de la página. */}
      <div className="absolute inset-x-0 top-full">
        <Ola className="h-2" />
      </div>
    </header>
  );
}
