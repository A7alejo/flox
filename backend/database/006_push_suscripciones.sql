-- =====================================================================
-- FLOX · Migración 006: suscripciones para notificaciones push
-- =====================================================================
-- Ejecutar UNA sola vez, después de 005_codigo_barras.sql.
-- - push_suscripciones: un registro por celular/navegador que aceptó recibir
--   avisos. Guarda la dirección que entrega el navegador (endpoint) y las dos
--   claves para cifrar el mensaje (p256dh, auth). No guarda contraseñas.
-- - avisa_*: qué avisos quiere recibir ese celular (ventas, gastos, productos).
-- - Si se borra el usuario, se borran sus suscripciones.
-- No modifica ni borra datos existentes.
-- Para deshacer: DROP TABLE push_suscripciones;
-- =====================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS push_suscripciones (
  id               SERIAL PRIMARY KEY,
  usuario_id       INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  endpoint         TEXT NOT NULL UNIQUE,
  p256dh           TEXT NOT NULL,
  auth             TEXT NOT NULL,
  user_agent       VARCHAR(300),
  avisa_ventas     BOOLEAN NOT NULL DEFAULT true,
  avisa_gastos     BOOLEAN NOT NULL DEFAULT true,
  avisa_productos  BOOLEAN NOT NULL DEFAULT true,
  fecha_creacion   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Igual que el resto de las tablas: RLS activo y sin políticas, así la API
-- pública de Supabase (clave anon) no puede leerla ni escribirla. El backend
-- se conecta como postgres, que no pasa por RLS.
ALTER TABLE push_suscripciones ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_push_suscripciones_usuario ON push_suscripciones (usuario_id);

COMMIT;
