-- ============================================================
-- EXTENSIONES
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE usuarios (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    rol         VARCHAR(20)  NOT NULL CHECK (rol IN ('admin', 'bodeguero')),
    email       VARCHAR(150),
    activo      BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en   TIMESTAMP    NOT NULL DEFAULT NOW()
);

INSERT INTO usuarios (nombre, username, password, rol)
VALUES ('Administrador', 'admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Tokens temporales para recuperación de contraseña (expiran en 15 minutos)
CREATE TABLE password_reset_tokens (
    id          SERIAL PRIMARY KEY,
    usuario_id  INTEGER      NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token       VARCHAR(6)   NOT NULL,
    expira_en   TIMESTAMP    NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes'),
    usado       BOOLEAN      NOT NULL DEFAULT FALSE,
    creado_en   TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE proveedores (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(150) NOT NULL,
    ruc         VARCHAR(20),
    telefono    VARCHAR(20),
    email       VARCHAR(100),
    direccion   TEXT,
    activo      BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en   TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE productos (
    id              SERIAL PRIMARY KEY,
    codigo          VARCHAR(50)    NOT NULL UNIQUE,
    descripcion     VARCHAR(255)   NOT NULL,
    inventariable   BOOLEAN        NOT NULL DEFAULT TRUE,
    stock           NUMERIC(12,2)  NOT NULL DEFAULT 0,
    stock_minimo    NUMERIC(12,2)  NOT NULL DEFAULT 0,
    iva             NUMERIC(5,2)   NOT NULL DEFAULT 0,
    pvp1            NUMERIC(12,2)  NOT NULL DEFAULT 0,
    pvp2            NUMERIC(12,2)  NOT NULL DEFAULT 0,
    activo          BOOLEAN        NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMP      NOT NULL DEFAULT NOW(),
    actualizado_en  TIMESTAMP      NOT NULL DEFAULT NOW()
);

CREATE TABLE documentos (
    id              SERIAL PRIMARY KEY,
    numero          VARCHAR(20)    NOT NULL UNIQUE,
    tipo            VARCHAR(10)    NOT NULL CHECK (tipo IN ('proforma', 'recibo')),
    cliente         VARCHAR(150)   NOT NULL DEFAULT 'Consumidor Final',
    fecha           DATE           NOT NULL DEFAULT CURRENT_DATE,
    subtotal        NUMERIC(12,2)  NOT NULL DEFAULT 0,
    total_iva       NUMERIC(12,2)  NOT NULL DEFAULT 0,
    total           NUMERIC(12,2)  NOT NULL DEFAULT 0,
    notas           TEXT,
    usuario_id      INTEGER        REFERENCES usuarios(id),
    convertido_de   INTEGER        REFERENCES documentos(id),
    creado_en       TIMESTAMP      NOT NULL DEFAULT NOW(),
    actualizado_en  TIMESTAMP      NOT NULL DEFAULT NOW()
);

CREATE TABLE documentos_detalle (
    id              SERIAL PRIMARY KEY,
    documento_id    INTEGER        NOT NULL REFERENCES documentos(id) ON DELETE CASCADE,
    producto_id     INTEGER        REFERENCES productos(id),
    descripcion     VARCHAR(255)   NOT NULL,
    cantidad        NUMERIC(12,2)  NOT NULL,
    precio          NUMERIC(12,2)  NOT NULL,
    iva             NUMERIC(5,2)   NOT NULL DEFAULT 0,
    subtotal        NUMERIC(12,2)  NOT NULL
);

CREATE SEQUENCE seq_proforma START 1;
CREATE SEQUENCE seq_recibo   START 1;

CREATE TABLE compras (
    id               SERIAL PRIMARY KEY,
    numero           VARCHAR(20)    NOT NULL UNIQUE,
    proveedor_id     INTEGER        REFERENCES proveedores(id),
    proveedor_nombre VARCHAR(150),
    fecha            DATE           NOT NULL DEFAULT CURRENT_DATE,
    factura_ref      VARCHAR(50),
    ruc_proveedor    VARCHAR(20),
    subtotal         NUMERIC(12,2)  NOT NULL DEFAULT 0,
    total_iva        NUMERIC(12,2)  NOT NULL DEFAULT 0,
    total            NUMERIC(12,2)  NOT NULL DEFAULT 0,
    notas            TEXT,
    usuario_id       INTEGER        REFERENCES usuarios(id),
    creado_en        TIMESTAMP      NOT NULL DEFAULT NOW()
);

CREATE TABLE compras_detalle (
    id          SERIAL PRIMARY KEY,
    compra_id   INTEGER        NOT NULL REFERENCES compras(id) ON DELETE CASCADE,
    producto_id INTEGER        REFERENCES productos(id),
    descripcion VARCHAR(255)   NOT NULL,
    cantidad    NUMERIC(12,2)  NOT NULL,
    costo       NUMERIC(12,2)  NOT NULL,
    iva         NUMERIC(5,2)   NOT NULL DEFAULT 0,
    subtotal    NUMERIC(12,2)  NOT NULL
);

CREATE SEQUENCE seq_compra START 1;

CREATE TABLE facturas_efacilito (
    id              SERIAL PRIMARY KEY,
    nro_factura     VARCHAR(50)    NOT NULL UNIQUE,
    fecha           DATE           NOT NULL,
    cedula_ruc      VARCHAR(50),
    cliente         VARCHAR(200),
    estado          VARCHAR(50)    NOT NULL DEFAULT 'AUTORIZADO',
    total           NUMERIC(12,2)  NOT NULL DEFAULT 0,
    archivo_origen  VARCHAR(255),
    usuario_id      INTEGER        REFERENCES usuarios(id),
    importado_en    TIMESTAMP      NOT NULL DEFAULT NOW()
);

CREATE TABLE facturas_efacilito_detalle (
    id              SERIAL PRIMARY KEY,
    factura_id      INTEGER        NOT NULL REFERENCES facturas_efacilito(id) ON DELETE CASCADE,
    codigo          VARCHAR(50),
    producto_id     INTEGER        REFERENCES productos(id),
    descripcion     VARCHAR(255)   NOT NULL,
    precio          NUMERIC(12,2)  NOT NULL DEFAULT 0,
    cantidad        NUMERIC(12,2)  NOT NULL DEFAULT 0,
    descuento       NUMERIC(12,2)  NOT NULL DEFAULT 0,
    pct_iva         NUMERIC(5,2)   NOT NULL DEFAULT 0,
    importe         NUMERIC(12,2)  NOT NULL DEFAULT 0
);

CREATE TABLE movimiento_stock (
    id              SERIAL PRIMARY KEY,
    producto_id     INTEGER        NOT NULL REFERENCES productos(id),
    tipo            VARCHAR(50)    NOT NULL CHECK (tipo IN (
                        'entrada_compra',
                        'salida_recibo',
                        'salida_factura_efacilito',
                        'ajuste_manual'
                    )),
    cantidad        NUMERIC(12,2)  NOT NULL,
    stock_anterior  NUMERIC(12,2)  NOT NULL,
    stock_nuevo     NUMERIC(12,2)  NOT NULL,
    referencia_id   INTEGER,
    referencia_tipo VARCHAR(30),
    usuario_id      INTEGER        REFERENCES usuarios(id),
    creado_en       TIMESTAMP      NOT NULL DEFAULT NOW()
);

CREATE TABLE clientes (
    id              SERIAL PRIMARY KEY,
    identificacion  VARCHAR(20)   NOT NULL UNIQUE,
    tipo            VARCHAR(10)   NOT NULL CHECK (tipo IN ('CEDULA', 'RUC', 'PASAPORTE', 'OTRO')),
    nombre          VARCHAR(200)  NOT NULL,
    direccion       VARCHAR(255),
    telefono        VARCHAR(20),
    email           VARCHAR(150),
    activo          BOOLEAN       NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMP     NOT NULL DEFAULT NOW(),
    actualizado_en  TIMESTAMP     NOT NULL DEFAULT NOW()
);

ALTER TABLE documentos ADD COLUMN IF NOT EXISTS cliente_id INTEGER REFERENCES clientes(id);

CREATE TRIGGER trg_clientes_updated
    BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

-- ============================================================
-- AUDITORÍA
-- ============================================================

CREATE TABLE logs_actividad (
    id              SERIAL PRIMARY KEY,
    usuario_id      INTEGER       REFERENCES usuarios(id) ON DELETE SET NULL,
    usuario_nombre  VARCHAR(100),                        -- nombre snapshot por si se elimina el usuario
    accion          VARCHAR(100)  NOT NULL,              -- ej: 'crear_recibo', 'eliminar_producto'
    modulo          VARCHAR(50)   NOT NULL,              -- ej: 'documentos', 'productos', 'compras'
    descripcion     TEXT,                                -- detalle legible, ej: 'Creó recibo R-0015 por $45.00'
    referencia_id   INTEGER,                             -- id del registro afectado (opcional)
    ip              VARCHAR(45),                         -- IPv4 o IPv6
    creado_en       TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_logs_usuario  ON logs_actividad(usuario_id);
CREATE INDEX idx_logs_modulo   ON logs_actividad(modulo);
CREATE INDEX idx_logs_creado   ON logs_actividad(creado_en DESC);

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX idx_productos_codigo      ON productos(codigo);
CREATE INDEX idx_clientes_identificacion ON clientes(identificacion);
CREATE INDEX idx_clientes_nombre         ON clientes(nombre);
CREATE INDEX idx_documentos_tipo       ON documentos(tipo);
CREATE INDEX idx_documentos_fecha      ON documentos(fecha);
CREATE INDEX idx_movimiento_producto   ON movimiento_stock(producto_id);
CREATE INDEX idx_compras_fecha         ON compras(fecha);
CREATE INDEX idx_compras_ruc_proveedor ON compras(ruc_proveedor);
CREATE INDEX idx_reset_tokens_usuario  ON password_reset_tokens(usuario_id);

-- ============================================================
-- FUNCIONES Y TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_productos_updated
    BEFORE UPDATE ON productos
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trg_documentos_updated
    BEFORE UPDATE ON documentos
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();