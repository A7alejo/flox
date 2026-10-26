-- =====================================================================
-- FLOX · Migración 005: código de barras de los productos
-- =====================================================================
-- - productos.codigo_barras: el número impreso en el envase (EAN-13 de 13
--   dígitos en los productos Flox). Opcional: los productos viejos quedan
--   sin código hasta que se lo carguen.
-- - NO es único a propósito: un mismo código puede estar en más de un
--   producto (ej. si alguna línea usa el mismo código para varias
--   fragancias); al escanear, la app deja elegir entre ellos.
-- - Índice para que buscar por código sea instantáneo.
-- Seguro de correr con la app andando: la columna es nueva y nullable.
-- Para deshacer: ALTER TABLE productos DROP COLUMN codigo_barras;
-- =====================================================================

BEGIN;

ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS codigo_barras VARCHAR(32);

ALTER TABLE productos
  DROP CONSTRAINT IF EXISTS chk_codigo_barras_formato;
ALTER TABLE productos
  ADD CONSTRAINT chk_codigo_barras_formato
  CHECK (codigo_barras IS NULL OR codigo_barras ~ '^[0-9A-Za-z-]{4,32}$');

CREATE INDEX IF NOT EXISTS idx_productos_codigo_barras ON productos (codigo_barras);

COMMENT ON COLUMN productos.codigo_barras IS
  'Código de barras del envase (EAN-13 u otro). Opcional y no único.';

COMMIT;
