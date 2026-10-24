// Footer de la app.
// - Celular: franja oscura compacta con logo chico, centrada.
// - Escritorio: discreto, mismo tamaño que el de Hogar Gestión (texto chico
//   centrado en dos líneas), con los colores de Flox.
const VERSION = '1.0';

export function Footer() {
  const anio = new Date().getFullYear();

  return (
    <>
      {/* mb: deja el footer visible por encima de la barra de navegación fija */}
      <footer className="md:hidden bg-[#0F3D3A] text-[#C9E2DD] text-xs flex flex-col items-center justify-center gap-1.5 text-center px-4 py-4 mb-[calc(4rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-[#0F766E] text-white font-display font-bold text-[11px] flex items-center justify-center" aria-hidden="true">
            F
          </div>
          <span className="font-display font-bold text-sm text-[#E6F2EF]">Floxer</span>
        </div>
        <span>© {anio} · Versión {VERSION}</span>
      </footer>

      <footer className="hidden md:block bg-[#0F3D3A] px-4 py-4 text-center text-xs text-[#C9E2DD]">
        <p><span className="font-semibold text-[#E6F2EF]">Floxer</span> · Gestión de stock y caja</p>
        <p className="mt-1">© {anio} · Versión {VERSION}</p>
      </footer>
    </>
  );
}
