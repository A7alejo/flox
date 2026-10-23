-- =====================================================================
-- FLOX · Migración 001: roles de usuario (Panel de Admin)
-- =====================================================================
-- Ejecutar UNA sola vez sobre una base creada con schema.sql.
-- - Agrega usuarios.rol: 'admin' (gestiona usuarios) u 'operador'.
-- - Los usuarios existentes quedan como 'operador', salvo el id 1
--   (Alejo), que pasa a 'admin'.
-- =====================================================================

BEGIN;

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS rol VARCHAR(20) NOT NULL DEFAULT 'operador';

ALTER TABLE usuarios
  DROP CONSTRAINT IF EXISTS chk_rol_usuario;
ALTER TABLE usuarios
  ADD CONSTRAINT chk_rol_usuario CHECK (rol IN ('admin', 'operador'));

UPDATE usuarios SET rol = 'admin' WHERE id = 1;

COMMENT ON COLUMN usuarios.rol IS
  'admin = accede al Panel de Admin (gestión de usuarios) | operador = uso diario';

COMMIT;
