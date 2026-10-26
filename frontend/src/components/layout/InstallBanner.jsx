import { useEffect, useState } from 'react';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Primitives';

const DISMISS_KEY = 'flox_install_dismissed';

const readDismissed = () => {
  try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
};

// "Agregar a pantalla de inicio":
// - Android/Chrome: captura `beforeinstallprompt` y ofrece un botón que dispara el diálogo nativo.
// - iOS/Safari: no existe esa API, así que se muestra la instrucción manual (Compartir → Agregar).
// Se oculta si la app ya corre instalada o si la persona lo descartó.
export function InstallBanner() {
  const [promptEvent, setPromptEvent] = useState(null);
  const [dismissed, setDismissed] = useState(readDismissed);

  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setPromptEvent(e); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (standalone || dismissed || (!promptEvent && !isIOS)) return null;

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* sin storage: solo se oculta en esta sesión */ }
  };

  const install = async () => {
    promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-flox-100 bg-flox-50 pl-4 pr-1 py-2 mb-5 animate-pop-in">
      <div className="flex-1 text-sm text-flox-700">
        {promptEvent ? (
          <span className="font-semibold">Instalá Floxer en tu celular para abrirla como una app.</span>
        ) : (
          <span>
            Para instalar: tocá <Icon.share className="inline w-4 h-4 -mt-0.5" aria-label="Compartir" /> y elegí
            <strong> «Agregar a pantalla de inicio»</strong>.
          </span>
        )}
      </div>
      {promptEvent && <Button onClick={install} className="h-10 min-h-[40px] px-4">Instalar</Button>}
      <button type="button" onClick={dismiss} aria-label="Descartar" className="w-12 h-12 flex items-center justify-center text-flox-700">
        <Icon.x className="w-4 h-4" />
      </button>
    </div>
  );
}
