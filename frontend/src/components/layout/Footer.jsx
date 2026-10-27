// Footer de la app.
// - Celular: franja oscura compacta con logo chico, centrada.
// - Escritorio: discreto, mismo tamaño que el de Hogar Gestión (texto chico
//   centrado en dos líneas), con los colores de Flox.
import { Marca } from '../ui/Marca';

const VERSION = '1.0';

export function Footer() {
  const anio = new Date().getFullYear();

  return (
    <>
      {/* mb: deja el footer visible por encima de la barra de navegación fija */}
      <footer className="md:hidden bg-tinta text-white/75 text-xs flex flex-col items-center justify-center gap-1.5 text-center px-4 py-4 mb-[calc(4rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-2">
          <Marca claro className="w-5 h-5" />
          <span className="font-display font-bold text-base leading-none pt-0.5 text-white">Floxer</span>
        </div>
        <span>© {anio} · Versión {VERSION}</span>
      </footer>

      <footer className="hidden md:block bg-tinta px-4 py-4 text-center text-xs text-white/75">
        <p><span className="font-bold text-white">Floxer</span> · Gestión de stock y caja</p>
        <p className="mt-1">© {anio} · Versión {VERSION}</p>
      </footer>
    </>
  );
}
