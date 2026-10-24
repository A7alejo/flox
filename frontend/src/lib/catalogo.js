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
  { grupo: 'Mililitros (mL)', opciones: ['900 mL', '800 mL', '600 mL', '500 mL', '450 mL', '300 mL'] },
];

const TODAS_PRESENTACIONES = PRESENTACIONES.flatMap((g) => g.opciones);

// Productos que además se eligen por fragancia (el formulario muestra un
// tercer desplegable solo para estos).
export const FRAGANCIAS = {
  'Aromatizante Flox': ['Lavanda', 'Marina', 'Citronela', 'Limón', 'Bebé', 'Pino'],
};
export const fraganciasDe = (producto) => FRAGANCIAS[producto] ?? null;

export function categoriaDe(producto) {
  return CATEGORIAS_PRODUCTOS.find((c) => c.productos.includes(producto))?.categoria ?? null;
}

// Nombre que se guarda: "Jabón Líquido Flox 5 L", o con fragancia
// "Aromatizante Flox Lavanda 900 mL".
export function nombreCompleto(producto, presentacion, fragancia) {
  return [producto, fragancia, presentacion].filter(Boolean).join(' ');
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

// ---------------------------------------------------------------------
// Imágenes de producto (frontend/public/productos/)
// Una foto por producto y tamaño: <slug>-<tamaño>.png (ej. suavizante-900ml.png,
// cloro-5l.png); con fragancia, <slug>-<fragancia>-<tamaño>.png (ej.
// aromatizante-lavanda-900ml.png). Si no existe, la app muestra el ícono de siempre.
// ---------------------------------------------------------------------
const SLUGS = {
  'Jabón Líquido Flox': 'jabon-liquido',
  'Suavizante para Ropa Flox': 'suavizante',
  'Detergente Flox': 'detergente',
  'Detergente Doypack Flox': 'detergente-doypack',
  'Detergente Ultra Flox': 'detergente-ultra',
  'Desengrasante Flox': 'desengrasante',
  'Desengrasante en Gatillo Flox': 'desengrasante-gatillo',
  'Cloro Flox': 'cloro',
  'Limpiador de Vidrios Flox': 'limpiador-vidrios',
  'Aromatizante Flox': 'aromatizante',
};

const slugTamano = (presentacion) => presentacion.replace(/\s+/g, '').toLowerCase(); // "900 mL" -> "900ml"
const slugFragancia = (fragancia) => normalizar(fragancia).replace(/\s+/g, '-'); // "Bebé" -> "bebe"

// Ruta de la foto del producto en ese tamaño (y fragancia, si tiene). Productos
// que no siguen el catálogo (cargados antes) no tienen foto: se ve el ícono.
export function imagenesDeProducto(nombre = '') {
  const { producto, presentacion, fragancia } = separarNombre(nombre);
  if (!producto) return [];
  const partes = [SLUGS[producto], fragancia && slugFragancia(fragancia), slugTamano(presentacion)].filter(Boolean);
  return [`/productos/${partes.join('-')}.png`];
}

// Inverso de nombreCompleto, para editar: "Aromatizante Flox Lavanda 900 mL" →
// producto, fragancia y presentación. Si el nombre no sigue el catálogo
// (productos cargados antes de esta lista) devuelve vacío y se elige de nuevo.
export function separarNombre(nombre = '') {
  const vacio = { producto: '', presentacion: '', fragancia: '' };
  const presentacion = TODAS_PRESENTACIONES.find((p) => nombre.endsWith(' ' + p));
  if (!presentacion) return vacio;
  let producto = nombre.slice(0, -(presentacion.length + 1));
  let fragancia = '';
  if (!categoriaDe(producto)) {
    // ¿Es "<producto con fragancias> <fragancia>"?
    for (const [prod, frags] of Object.entries(FRAGANCIAS)) {
      const f = frags.find((fr) => producto === `${prod} ${fr}`);
      if (f) { producto = prod; fragancia = f; break; }
    }
  }
  if (!categoriaDe(producto)) return vacio;
  return { producto, presentacion, fragancia };
}
