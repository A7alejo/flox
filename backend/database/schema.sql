-- =====================================================================
-- FLOX · Esquema de Base de Datos (PostgreSQL)
-- Gestión de Stock, Caja/Finanzas y Envíos
-- =====================================================================
-- Diseñado para Supabase (Postgres). Ejecutar completo una sola vez.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Extensiones
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- por si en el futuro se usan UUIDs
CREATE EXTENSION IF NOT EXISTS pg_trgm;     -- debe existir ANTES de idx_productos_nombre (gin_trgm_ops)

-- ---------------------------------------------------------------------
-- Función genérica para mantener "fecha_actualizacion" al día
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_actualizacion = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- 1) PRODUCTOS
-- =====================================================================
CREATE TABLE productos (
  id                  SERIAL PRIMARY KEY,
  nombre              VARCHAR(150) NOT NULL,
  categoria           VARCHAR(100),
  stock_actual        INTEGER NOT NULL DEFAULT 0
                        CONSTRAINT chk_stock_no_negativo CHECK (stock_actual >= 0),
  stock_minimo        INTEGER NOT NULL DEFAULT 5
                        CONSTRAINT chk_stock_minimo_no_negativo CHECK (stock_minimo >= 0),
  costo_base          NUMERIC(12,2) NOT NULL
                        CONSTRAINT chk_costo_base_positivo CHECK (costo_base >= 0),
  porcentaje_margen   NUMERIC(6,2) NOT NULL DEFAULT 0
                        CONSTRAINT chk_margen_no_negativo CHECK (porcentaje_margen >= 0),
  -- Precio de venta calculado automáticamente por Postgres: siempre
  -- consistente con costo_base y porcentaje_margen, no se puede
  -- desincronizar porque no se puede escribir directamente.
  precio_venta        NUMERIC(12,2) GENERATED ALWAYS AS (
                          ROUND(costo_base * (1 + porcentaje_margen / 100.0), 2)
                        ) STORED,
  activo              BOOLEAN NOT NULL DEFAULT TRUE, -- baja lógica (soft delete)
  fecha_creacion       TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_actualizacion  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_productos_nombre ON productos USING gin (nombre gin_trgm_ops);
CREATE INDEX idx_productos_categoria ON productos (categoria);
CREATE INDEX idx_productos_activo ON productos (activo);

CREATE TRIGGER trg_productos_fecha_actualizacion
  BEFORE UPDATE ON productos
  FOR EACH ROW
  EXECUTE FUNCTION set_fecha_actualizacion();

-- Nota: idx_productos_nombre usa pg_trgm para búsquedas parciales rápidas
-- (ILIKE '%texto%'). Si pg_trgm no está disponible en el plan, reemplazar
-- por: CREATE INDEX idx_productos_nombre ON productos (lower(nombre));

-- =====================================================================
-- 2) ENVÍOS / PEDIDOS
-- =====================================================================
CREATE TABLE envios (
  id                   SERIAL PRIMARY KEY,
  cliente_nombre       VARCHAR(150) NOT NULL,
  direccion            TEXT,
  estado               VARCHAR(20) NOT NULL DEFAULT 'en_preparacion'
                          CONSTRAINT chk_estado_envio CHECK (
                            estado IN ('en_preparacion', 'listo_despacho', 'entregado')
                          ),
  notas                TEXT,
  fecha_creacion       TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_actualizacion  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_envios_estado ON envios (estado);
CREATE INDEX idx_envios_fecha ON envios (fecha_creacion);

CREATE TRIGGER trg_envios_fecha_actualizacion
  BEFORE UPDATE ON envios
  FOR EACH ROW
  EXECUTE FUNCTION set_fecha_actualizacion();

-- Detalle de productos despachados en cada envío (relación N:M)
CREATE TABLE envio_detalle (
  id            SERIAL PRIMARY KEY,
  envio_id      INTEGER NOT NULL REFERENCES envios(id) ON DELETE CASCADE,
  producto_id   INTEGER NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  cantidad      INTEGER NOT NULL CONSTRAINT chk_cantidad_envio_positiva CHECK (cantidad > 0)
);

CREATE INDEX idx_envio_detalle_envio ON envio_detalle (envio_id);
CREATE INDEX idx_envio_detalle_producto ON envio_detalle (producto_id);

-- =====================================================================
-- 3) CAJA / MOVIMIENTOS FINANCIEROS
-- =====================================================================
CREATE TABLE movimientos_caja (
  id                 SERIAL PRIMARY KEY,
  tipo               VARCHAR(10) NOT NULL
                        CONSTRAINT chk_tipo_movimiento CHECK (tipo IN ('ingreso', 'egreso')),
  concepto           VARCHAR(255) NOT NULL,
  monto              NUMERIC(12,2) NOT NULL CONSTRAINT chk_monto_positivo CHECK (monto > 0),
  medio_pago         VARCHAR(20)
                        CONSTRAINT chk_medio_pago CHECK (
                          medio_pago IS NULL OR medio_pago IN ('efectivo', 'personal_pay', 'transferencia')
                        ),
  -- Relación opcional con el producto vendido (ventas rápidas)
  producto_id        INTEGER REFERENCES productos(id) ON DELETE SET NULL,
  cantidad_vendida   INTEGER CONSTRAINT chk_cantidad_vendida_positiva CHECK (
                        cantidad_vendida IS NULL OR cantidad_vendida > 0
                      ),
  -- Relación opcional con un envío (ej: gasto de flete asociado a un pedido)
  envio_id           INTEGER REFERENCES envios(id) ON DELETE SET NULL,
  fecha              TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Todo ingreso debe declarar medio de cobro; en egresos es opcional.
  CONSTRAINT chk_ingreso_requiere_medio_pago CHECK (
    tipo <> 'ingreso' OR medio_pago IS NOT NULL
  )
);

CREATE INDEX idx_movimientos_fecha ON movimientos_caja (fecha DESC);
CREATE INDEX idx_movimientos_tipo ON movimientos_caja (tipo);
CREATE INDEX idx_movimientos_medio_pago ON movimientos_caja (medio_pago);
CREATE INDEX idx_movimientos_producto ON movimientos_caja (producto_id);

-- =====================================================================
-- 4) USUARIOS (autenticación)
-- =====================================================================
-- Solo 2 usuarios de confianza (los emprendedores). No hay registro
-- público: los usuarios se crean con el script scripts/crear-usuario.js.
-- password_hash guarda un hash bcrypt, NUNCA la contraseña en texto plano.
CREATE TABLE usuarios (
  id                   SERIAL PRIMARY KEY,
  nombre               VARCHAR(100) NOT NULL,
  email                VARCHAR(150) NOT NULL UNIQUE,
  password_hash        TEXT NOT NULL,
  -- Agregado en 001_roles_usuarios.sql (bases existentes: correr esa migración)
  rol                  VARCHAR(20) NOT NULL DEFAULT 'operador'
                          CONSTRAINT chk_rol_usuario CHECK (rol IN ('admin', 'operador')),
  activo              BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_creacion       TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_actualizacion  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_usuarios_email ON usuarios (lower(email));

CREATE TRIGGER trg_usuarios_fecha_actualizacion
  BEFORE UPDATE ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION set_fecha_actualizacion();

COMMENT ON COLUMN usuarios.password_hash IS
  'Hash bcrypt (12 rounds). Jamás se guarda ni se loguea la contraseña en texto plano.';

-- =====================================================================
-- Datos de referencia / comentarios finales
-- =====================================================================
COMMENT ON COLUMN productos.precio_venta IS
  'Calculado automáticamente: costo_base * (1 + porcentaje_margen/100). No editable directamente.';
COMMENT ON COLUMN movimientos_caja.tipo IS
  'ingreso = venta de productos | egreso = gasto/compra';
COMMENT ON TABLE envio_detalle IS
  'Detalle de qué productos y en qué cantidad componen cada envío.';
