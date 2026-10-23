-- =====================================================================
-- FLOX · Migración 002: ventas con varios productos y estado pendiente
-- =====================================================================
-- Ejecutar UNA sola vez, después de 001_roles_usuarios.sql.
-- - ventas: cabecera de cada venta. estado 'pendiente' (todavía no la
--   pagaron) o 'pagada'. El ingreso en caja se crea recién al cobrarla.
-- - venta_detalle: productos de cada venta, con el precio del momento.
-- - movimientos_caja.venta_id: de qué venta salió cada ingreso.
-- No modifica ni borra datos existentes: las ventas anteriores (un
-- movimiento con producto_id / cantidad_vendida) siguen siendo válidas.
-- =====================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS ventas (
  id                SERIAL PRIMARY KEY,
  estado            VARCHAR(10) NOT NULL DEFAULT 'pagada'
                       CONSTRAINT chk_estado_venta CHECK (estado IN ('pendiente', 'pagada')),
  cliente_nombre    VARCHAR(150),
  total             NUMERIC(12,2) NOT NULL CONSTRAINT chk_total_venta_positivo CHECK (total > 0),
  medio_pago        VARCHAR(20)
                       CONSTRAINT chk_medio_pago_venta CHECK (
                         medio_pago IS NULL OR medio_pago IN ('efectivo', 'personal_pay', 'transferencia')
                       ),
  fecha_creacion    TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_pago        TIMESTAMPTZ,

  -- Una venta pagada siempre tiene medio de cobro y fecha de pago.
  CONSTRAINT chk_venta_pagada_completa CHECK (
    estado <> 'pagada' OR (medio_pago IS NOT NULL AND fecha_pago IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_ventas_estado ON ventas (estado);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas (fecha_creacion DESC);

CREATE TABLE IF NOT EXISTS venta_detalle (
  id               SERIAL PRIMARY KEY,
  venta_id         INTEGER NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id      INTEGER NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  cantidad         INTEGER NOT NULL CONSTRAINT chk_cantidad_venta_positiva CHECK (cantidad > 0),
  -- Precio "congelado" al momento de la venta (aunque después cambie el producto)
  precio_unitario  NUMERIC(12,2) NOT NULL CONSTRAINT chk_precio_unitario CHECK (precio_unitario >= 0)
);

CREATE INDEX IF NOT EXISTS idx_venta_detalle_venta ON venta_detalle (venta_id);
CREATE INDEX IF NOT EXISTS idx_venta_detalle_producto ON venta_detalle (producto_id);

ALTER TABLE movimientos_caja
  ADD COLUMN IF NOT EXISTS venta_id INTEGER REFERENCES ventas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_movimientos_venta ON movimientos_caja (venta_id);

COMMENT ON TABLE ventas IS
  'Ventas (varios productos). pendiente = no la pagaron todavía (no suma a caja); pagada = generó su ingreso en movimientos_caja.';
COMMENT ON TABLE venta_detalle IS
  'Productos de cada venta con la cantidad y el precio unitario del momento.';

COMMIT;
