import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';

// Escáner de código de barras con la cámara del celular (pantalla completa).
// - Android/Chrome: usa el lector nativo del navegador (BarcodeDetector), rápido.
// - iPhone y computadoras: usa @zxing/browser, que se descarga recién al abrir el escáner.
// - Si la cámara no anda (permiso negado, código gastado), se escribe el número a mano.
// `onDetect(codigo)` se llama por cada lectura (el mismo código no se repite
// hasta pasados 2 s) y puede devolver un texto que se muestra como respuesta.
// `continuo`: en Registrar venta queda abierto para seguir escaneando; en los
// demás lugares el padre lo cierra después de la primera lectura.
const FORMATOS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf'];
const REPETIR_MS = 2000;

function mensajeDeError(err) {
  if (!window.isSecureContext) return 'La cámara solo funciona en la app publicada (https) o en localhost.';
  if (err?.name === 'NotAllowedError') return 'No hay permiso para usar la cámara. Habilitalo en el navegador y volvé a intentar.';
  if (err?.name === 'NotFoundError' || err?.name === 'OverconstrainedError') return 'No se encontró una cámara en este dispositivo.';
  if (err?.name === 'NotReadableError') return 'La cámara está siendo usada por otra app. Cerrala y volvé a intentar.';
  return 'No se pudo abrir la cámara. Podés escribir el código a mano.';
}

export function EscanerCodigo({ titulo = 'Escanear código', continuo = false, onDetect, onClose }) {
  const video = useRef(null);
  const ultimo = useRef({ codigo: null, en: 0 });
  const onDetectRef = useRef(onDetect);
  onDetectRef.current = onDetect;
  const [error, setError] = useState(null);
  const [respuesta, setRespuesta] = useState(null);
  const [manual, setManual] = useState('');

  const leer = (crudo) => {
    const codigo = String(crudo).trim();
    if (!codigo) return;
    const ahora = Date.now();
    if (codigo === ultimo.current.codigo && ahora - ultimo.current.en < REPETIR_MS) return;
    ultimo.current = { codigo, en: ahora };
    navigator.vibrate?.(80);
    const texto = onDetectRef.current(codigo);
    if (texto) setRespuesta(texto);
  };

  useEffect(() => {
    let cancelado = false;
    let detener = null;

    async function iniciar() {
      const restricciones = {
        audio: false,
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      };
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('sin cámara');

        // Lector nativo (Android/Chrome)
        const soportados = 'BarcodeDetector' in window ? await window.BarcodeDetector.getSupportedFormats() : [];
        const formatos = FORMATOS.filter((f) => soportados.includes(f));
        if (formatos.length > 0) {
          const stream = await navigator.mediaDevices.getUserMedia(restricciones);
          if (cancelado) { stream.getTracks().forEach((t) => t.stop()); return; }
          video.current.srcObject = stream;
          await video.current.play();
          const detector = new window.BarcodeDetector({ formats: formatos });
          let timer;
          const buscar = async () => {
            if (cancelado) return;
            try {
              const [hallado] = await detector.detect(video.current);
              if (hallado) leer(hallado.rawValue);
            } catch { /* cuadro sin imagen todavía */ }
            timer = setTimeout(buscar, 150);
          };
          buscar();
          detener = () => { clearTimeout(timer); stream.getTracks().forEach((t) => t.stop()); };
          return;
        }

        // Respaldo: ZXing (iPhone, computadoras)
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        const lector = new BrowserMultiFormatReader();
        const controles = await lector.decodeFromConstraints(restricciones, video.current, (resultado) => {
          if (resultado) leer(resultado.getText());
        });
        if (cancelado) { controles.stop(); return; }
        detener = () => controles.stop();
      } catch (err) {
        if (!cancelado) setError(mensajeDeError(err));
      }
    }

    iniciar();
    const tecla = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', tecla);
    return () => {
      cancelado = true;
      detener?.();
      document.removeEventListener('keydown', tecla);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const usarManual = (e) => {
    e.preventDefault();
    if (!manual.trim()) return;
    ultimo.current = { codigo: null, en: 0 }; // a mano siempre cuenta, aunque se repita
    leer(manual);
    setManual('');
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={titulo} className="fixed inset-0 z-[60] bg-black text-white flex flex-col">
      <div className="flex items-center justify-between gap-3 px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-3">
        <h2 className="font-display font-bold text-lg">{titulo}</h2>
        <button
          type="button"
          onClick={onClose}
          className="min-h-[48px] px-4 rounded-xl bg-white/15 font-semibold"
        >
          {continuo ? 'Listo' : 'Cerrar'}
        </button>
      </div>

      <div className="relative flex-1 min-h-0 overflow-hidden">
        <video ref={video} className="absolute inset-0 w-full h-full object-cover" muted playsInline autoPlay />
        {!error && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
            <div className="w-[78%] max-w-sm h-32 rounded-2xl border-[3px] border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
            <p className="text-base max-w-xs">{error}</p>
          </div>
        )}
      </div>

      <div className="px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+16px)] flex flex-col gap-3 bg-black">
        <p className="text-sm text-center min-h-[20px]" aria-live="polite">
          {respuesta || (error ? '' : 'Apuntá al código de barras del envase')}
        </p>
        <form onSubmit={usarManual} className="flex gap-2">
          <label htmlFor="codigo-manual" className="sr-only">Escribir el código a mano</label>
          <input
            id="codigo-manual"
            inputMode="numeric"
            autoComplete="off"
            placeholder="O escribí el número"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            className="flex-1 min-w-0 h-12 rounded-xl bg-white/10 border border-white/25 px-3 text-base text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white"
          />
          <button type="submit" className="h-12 px-4 rounded-xl bg-white text-black font-semibold flex items-center gap-1.5">
            <Icon.check className="w-4 h-4" aria-hidden="true" />
            Usar
          </button>
        </form>
      </div>
    </div>
  );
}
