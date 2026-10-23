// Catálogo fijo de Flox (listas que pasaron los dueños): productos con su
// categoría y presentaciones. El formulario de producto elige de acá en vez
// de escribir a mano, y la categoría se completa sola según el producto.

export const CATEGORIAS_PRODUCTOS = [
  { categoria: 'Cuidado de la Ropa', productos: ['Jabón Líquido Flox', 'Suavizante para Ropa Flox'] },
  { categoria: 'Lavado de Vajilla', productos: ['Detergente Flox', 'Detergente Doypack Flox', 'Detergente Ultra Flox'] },
  {
    categoria: 'Limpieza y Desinfección de Superficies',
    productos: ['Desengrasante Flox', 'Desengrasante en Gatillo Flox', 'Cloro Flox', 'Limpiador de Vidrios Flox'],
  },
  { categoria: 'Aromatización', productos: ['Aromatizante Flox'] },
];

export const PRESENTACIONES = [
  { grupo: 'Litros', opciones: ['5 L', '3 L'] },
  { grupo: 'Mililitros (mL)', opciones: ['900 mL', '800 mL', '600 mL', '450 mL', '300 mL'] },
];

const TODAS_PRESENTACIONES = PRESENTACIONES.flatMap((g) => g.opciones);

export function categoriaDe(producto) {
  return CATEGORIAS_PRODUCTOS.find((c) => c.productos.includes(producto))?.categoria ?? null;
}

// Nombre que se guarda: "Jabón Líquido Flox 5 L"
export function nombreCompleto(producto, presentacion) {
  return `${producto} ${presentacion}`;
}

// Para comparar nombres: sin tildes, minúsculas, sin la palabra "flox" y sin espacios extra.
const normalizar = (s = '') =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\bflox\b/g, ' ').replace(/\s+/g, ' ').trim();

// Bases del catálogo de la más larga a la más corta: así "Detergente Ultra"
// gana sobre "Detergente" cuando las dos coinciden.
const BASES = CATEGORIAS_PRODUCTOS.flatMap((c) => c.productos.map((p) => ({ base: normalizar(p), categoria: c.categoria })))
  .sort((a, b) => b.base.length - a.base.length);

// Categoría a mostrar en la lista: la del catálogo si el nombre empieza con un
// producto del catálogo (sirve para los cargados antes, ej. "Jabon Liquido" o
// "Aromatizante de ropa flox 5 LTS ."); si no coincide, la que tenga guardada.
export function categoriaParaMostrar({ nombre, categoria }) {
  const n = normalizar(nombre);
  const match = BASES.find(({ base }) => n === base || n.startsWith(base + ' '));
  return match?.categoria ?? categoria ?? null;
}

// Inverso de nombreCompleto, para editar. Si el nombre no sigue el catálogo
// (productos cargados antes de esta lista) devuelve vacío y se elige de nuevo.
export function separarNombre(nombre = '') {
  const presentacion = TODAS_PRESENTACIONES.find((p) => nombre.endsWith(' ' + p));
  const producto = presentacion ? nombre.slice(0, -(presentacion.length + 1)) : null;
  if (!presentacion || !categoriaDe(producto)) return { producto: '', presentacion: '' };
  return { producto, presentacion };
}
