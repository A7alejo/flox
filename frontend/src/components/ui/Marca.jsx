import { useId } from 'react';

// Logo de Floxer: el recuadro del logo Flox con la F y, abajo, la ola turquesa
// de las etiquetas. `claro`: recuadro blanco con F azul, para usar sobre la franja azul.
export function Marca({ className = 'w-9 h-9', claro = false }) {
  const recorte = useId();
  return (
    <svg viewBox="0 0 40 40" className={'shrink-0 ' + className} aria-hidden="true">
      <clipPath id={recorte}>
        <rect width="40" height="40" rx="11" />
      </clipPath>
      <g clipPath={`url(#${recorte})`}>
        <rect width="40" height="40" fill={claro ? '#FFFFFF' : '#16285A'} />
        <path d="M0 31.5C7 27.5 13 27.5 20 31.5S33 35.5 40 31.5V40H0Z" fill="#33C2C9" />
        <path d="M13 8.5h14.5v4.6h-9.2v3.6h7.6v4.4h-7.6v6.4H13z" fill={claro ? '#16285A' : '#FFFFFF'} />
      </g>
    </svg>
  );
}

// Borde inferior de la franja azul: la ola de la etiqueta. Arriba es del color
// de la franja (fill-tinta, que el modo oscuro oscurece) y debajo queda el fondo.
export function Ola({ className = 'h-2.5' }) {
  return (
    <svg viewBox="0 0 1200 20" preserveAspectRatio="none" className={'block w-full ' + className} aria-hidden="true">
      <path d="M0 0H1200V8C1000 20 800 20 600 10S200 0 0 10Z" className="fill-tinta" />
      <path d="M0 10C200 0 400 0 600 10S1000 20 1200 8" fill="none" stroke="#33C2C9" strokeWidth="3" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
