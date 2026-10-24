-- =====================================================================
-- FLOX · Migración 003: movimientos de stock (cajones por mes)
-- =====================================================================
-- Ejecutar UNA sola vez, después de 002_ventas.sql.
-- - movimientos_stock: cada cambio de stock de un producto (+ o −) con
--   su tipo y fecha. Con esto se arma el resumen de cada mes: cuánto
--   sobró del mes anterior, cuánto ingresó, cuánto se vendió y cuánto quedó.
-- - Un trigger en productos llena la tabla solo: no hay forma de cambiar
--   stock_actual sin que quede registrado (ventas, ediciones, altas).
-- - Arranca con un movimiento 'inicial' por producto con el stock de hoy.
-- No modifica ni borra datos existentes.
-- =====================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS movimientos_stock (
  id           SERIAL PRIMARY KEY,
  producto_id  INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  -- Diferencia de stock: positiva si entró mercadería, negativa si salió.
  cantidad     INTEGER NOT NULL CONSTRAINT chk_mov_stock_no_cero CHECK (cantidad <> 0),
  -- inicial: stock que había al instalar esta migración
  -- ingreso: mercadería nueva (alta de producto o edición que suma)
  -- venta:   descuento por una venta
  -- ajuste:  corrección manual que resta
  tipo         VARCHAR(10) NOT NULL
                 CONSTRAINT chk_mov_stock_tipo CHECK (tipo IN ('inicial', 'ingreso', 'venta', 'ajuste')),
  fecha        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Igual que productos, envíos y caja: RLS activo y sin políticas, así la API
-- pública de Supabase (clave anon) no puede leerla ni escribirla. El backend
-- se conecta como postgres, que no pasa por RLS.
ALTER TABLE movimientos_stock ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_mov_stock_fecha ON movimientos_stock (fecha);
CREATE INDEX IF NOT EXISTS idx_mov_stock_producto ON movimientos_stock (producto_id, fecha);

-- El tipo lo decide quien cambia el stock: la venta hace
-- set_config('flox.motivo_stock', 'venta', true) dentro de su transacción.
-- Sin motivo: si suma es 'ingreso', si resta es 'ajuste'.
CREATE OR REPLACE FUNCTION registrar_movimiento_stock()
RETURNS TRIGGER AS $$
DECLARE
  diferencia INTEGER;
  motivo     TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    diferencia := NEW.stock_actual;
  ELSE
    diferencia := NEW.stock_actual - OLD.stock_actual;
  END IF;

  IF diferencia = 0 THEN
    RETURN NEW;
  END IF;

  motivo := NULLIF(current_setting('flox.motivo_stock', true), '');
  IF motivo IS NULL OR motivo NOT IN ('venta', 'ingreso', 'ajuste') THEN
    motivo := CASE WHEN diferencia > 0 THEN 'ingreso' ELSE 'ajuste' END;
  END IF;

  INSERT INTO movimientos_stock (producto_id, cantidad, tipo)
  VALUES (NEW.id, diferencia, motivo);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_productos_movimiento_stock ON productos;
CREATE TRIGGER trg_productos_movimiento_stock
  AFTER INSERT OR UPDATE OF stock_actual ON productos
  FOR EACH ROW
  EXECUTE FUNCTION registrar_movimiento_stock();

-- Punto de partida: lo que hay hoy en cada producto (activo o dado de baja).
INSERT INTO movimientos_stock (producto_id, cantidad, tipo)
SELECT p.id, p.stock_actual, 'inicial'
  FROM productos p
 WHERE p.stock_actual <> 0
   AND NOT EXISTS (SELECT 1 FROM movimientos_stock m WHERE m.producto_id = p.id);

COMMIT;
