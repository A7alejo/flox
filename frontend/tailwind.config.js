/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta "etiqueta Flox": agua (turquesa de la etiqueta, acciones), tinta
        // (azul marino del logo), ola (turquesa brillante, solo decorativo) y
        // grises con un toque de azul en lugar de los neutros de Tailwind.
        flox: { 50: '#E3F4F5', 100: '#BFE6EA', 600: '#0B7C89', 700: '#08626D' },
        tinta: '#16285A',
        ola: '#33C2C9',
        lavanda: '#6B4FBB',
        slate: {
          50: '#F5F7FA',
          100: '#EDF1F6',
          200: '#DCE3EC',
          300: '#C3CEDB',
          400: '#8E9BB0',
          500: '#5E6C84',
          600: '#46536B',
          700: '#343F55',
          800: '#232C40',
          900: '#16203A',
        },
      },
      // Animaciones cortas (150–250 ms). Las de entrada usan "backwards": al terminar
      // no dejan un transform aplicado (rompería los position: fixed de adentro).
      keyframes: {
        'fade-in': { from: { opacity: '0' } },
        'fade-out': { to: { opacity: '0' } },
        'page-in': { from: { opacity: '0', transform: 'translateY(8px)' } },
        'pop-in': { from: { opacity: '0', transform: 'translateY(6px) scale(0.97)' } },
        'pop-out': { to: { opacity: '0', transform: 'translateY(6px) scale(0.97)' } },
        'sheet-in': { from: { transform: 'translateY(100%)' } },
        'sheet-out': { to: { transform: 'translateY(100%)' } },
        bump: { '50%': { transform: 'scale(1.25)' } },
        'grow-x': { from: { transform: 'scaleX(0)' } },
        'grow-y': { from: { transform: 'scaleY(0)' } },
        dibujar: { from: { strokeDasharray: '0 999', opacity: '0' } },
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out backwards',
        'fade-out': 'fade-out 160ms ease-in forwards',
        'page-in': 'page-in 220ms cubic-bezier(0.2, 0.8, 0.2, 1) backwards',
        'pop-in': 'pop-in 180ms cubic-bezier(0.2, 0.8, 0.2, 1) backwards',
        'pop-out': 'pop-out 150ms ease-in forwards',
        'sheet-in': 'sheet-in 250ms cubic-bezier(0.2, 0.8, 0.2, 1) backwards',
        'sheet-out': 'sheet-out 170ms ease-in forwards',
        bump: 'bump 180ms ease-out',
        'grow-x': 'grow-x 250ms cubic-bezier(0.2, 0.8, 0.2, 1) backwards',
        'grow-y': 'grow-y 250ms cubic-bezier(0.2, 0.8, 0.2, 1) backwards',
        dibujar: 'dibujar 250ms ease-out backwards',
      },
      fontFamily: {
        // Baloo 2: redondeada y gruesa como el logo de Flox (títulos y números).
        // Atkinson Hyperlegible: pensada para leerse fácil (textos).
        display: ['"Baloo 2"', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        sans: ['"Atkinson Hyperlegible"', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
