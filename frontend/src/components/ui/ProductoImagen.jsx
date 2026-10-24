import { useEffect, useState } from 'react';
import { Icon } from './Icon';
import { imagenesDeProducto } from '../../lib/catalogo';

// Foto del producto según su nombre (catálogo + tamaño). Si no existe —o
// mientras carga— se ve el ícono de caja de siempre. `className` define el tamaño.
export function ProductoImagen({ nombre, className = 'w-11 h-11' }) {
  const rutas = imagenesDeProducto(nombre);
  const [intento, setIntento] = useState(0);
  const [cargada, setCargada] = useState(false);

  // Si cambia el producto (ej. en el formulario), volver a empezar por la primera ruta.
  const clave = rutas.join('|');
  useEffect(() => {
    setIntento(0);
    setCargada(false);
  }, [clave]);

  const ruta = rutas[intento];
  return (
    <div
      className={
        'relative rounded-lg flex items-center justify-center shrink-0 overflow-hidden ' +
        (cargada ? 'bg-white border border-slate-100 ' : 'bg-flox-100 text-flox-600 ') +
        className
      }
    >
      {!cargada && <Icon.box className="w-5 h-5" aria-hidden="true" />}
      {ruta && (
        <img
          key={ruta}
          src={ruta}
          alt=""
          className={'absolute inset-0 w-full h-full object-contain p-0.5 ' + (cargada ? '' : 'invisible')}
          onLoad={() => setCargada(true)}
          // No existe (o el servidor devolvió otra cosa): probar la siguiente ruta.
          onError={() => setIntento((i) => i + 1)}
        />
      )}
    </div>
  );
}
