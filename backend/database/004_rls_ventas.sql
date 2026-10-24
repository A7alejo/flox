-- =====================================================================
-- FLOX · Migración 004: RLS en ventas y venta_detalle
-- =====================================================================
-- Igual que el resto de las tablas: RLS activo y sin políticas, así la API
-- pública de Supabase (clave anon) no puede leerlas ni modificarlas.
-- El backend se conecta como postgres, que no pasa por RLS: la app sigue
-- funcionando igual. Para deshacer: ALTER TABLE ... DISABLE ROW LEVEL SECURITY.
-- =====================================================================

BEGIN;

ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE venta_detalle ENABLE ROW LEVEL SECURITY;

COMMIT;
