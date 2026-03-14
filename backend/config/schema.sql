-- CoreInventory Database Schema
-- Run: mysql -u root -p coreinventory < backend/config/schema.sql

CREATE DATABASE IF NOT EXISTS coreinventory;
USE coreinventory;

-- ─────────────────────────────────────────────
-- 1. USERS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            INT           AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100)  NOT NULL,
    username      VARCHAR(60)   NOT NULL UNIQUE,
    email         VARCHAR(120)  NOT NULL UNIQUE,
    password_hash VARCHAR(255)  NOT NULL,
    role          ENUM('Manager', 'Staff') NOT NULL DEFAULT 'Staff',
    otp_code      VARCHAR(6)    NULL,
    otp_expires   DATETIME      NULL,
    created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────
-- 2. CATEGORIES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
    id         INT          AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL UNIQUE,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────
-- 3. PRODUCTS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
    id           INT             AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(150)    NOT NULL,
    sku          VARCHAR(60)     NOT NULL UNIQUE,
    category_id  INT             NULL,
    unit_of_measure VARCHAR(30)  NOT NULL DEFAULT 'Unit',
    reorder_level INT            NOT NULL DEFAULT 10,
    created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────
-- 4. WAREHOUSES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS warehouses (
    id         INT          AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL UNIQUE,
    address    TEXT         NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────
-- 5. LOCATIONS  (sub-locations within a warehouse)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS locations (
    id           INT          AUTO_INCREMENT PRIMARY KEY,
    warehouse_id INT          NOT NULL,
    name         VARCHAR(100) NOT NULL,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────
-- 6. STOCK BALANCE  (current qty per product per location)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stock_balance (
    id          INT     AUTO_INCREMENT PRIMARY KEY,
    product_id  INT     NOT NULL,
    location_id INT     NOT NULL,
    quantity    DECIMAL(12,2) NOT NULL DEFAULT 0,
    UNIQUE KEY uq_product_location (product_id, location_id),
    FOREIGN KEY (product_id)  REFERENCES products(id)  ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────
-- 7. RECEIPTS  (incoming goods)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS receipts (
    id             INT          AUTO_INCREMENT PRIMARY KEY,
    reference      VARCHAR(60)  NOT NULL UNIQUE,
    supplier_name  VARCHAR(150) NULL,
    location_id    INT          NOT NULL,
    status         ENUM('draft','waiting','ready','done','cancelled') NOT NULL DEFAULT 'draft',
    created_by     INT          NULL,
    validated_at   DATETIME     NULL,
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES locations(id),
    FOREIGN KEY (created_by)  REFERENCES users(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────
-- 8. RECEIPT ITEMS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS receipt_items (
    id          INT           AUTO_INCREMENT PRIMARY KEY,
    receipt_id  INT           NOT NULL,
    product_id  INT           NOT NULL,
    qty_ordered DECIMAL(12,2) NOT NULL DEFAULT 0,
    qty_done    DECIMAL(12,2) NOT NULL DEFAULT 0,
    FOREIGN KEY (receipt_id) REFERENCES receipts(id)  ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- ─────────────────────────────────────────────
-- 9. DELIVERIES  (outgoing goods)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS deliveries (
    id            INT          AUTO_INCREMENT PRIMARY KEY,
    reference     VARCHAR(60)  NOT NULL UNIQUE,
    customer_name VARCHAR(150) NULL,
    location_id   INT          NOT NULL,
    status        ENUM('draft','waiting','ready','done','cancelled') NOT NULL DEFAULT 'draft',
    created_by    INT          NULL,
    validated_at  DATETIME     NULL,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES locations(id),
    FOREIGN KEY (created_by)  REFERENCES users(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────
-- 10. DELIVERY ITEMS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS delivery_items (
    id           INT           AUTO_INCREMENT PRIMARY KEY,
    delivery_id  INT           NOT NULL,
    product_id   INT           NOT NULL,
    qty_ordered  DECIMAL(12,2) NOT NULL DEFAULT 0,
    qty_done     DECIMAL(12,2) NOT NULL DEFAULT 0,
    FOREIGN KEY (delivery_id) REFERENCES deliveries(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id)  REFERENCES products(id)
);

-- ─────────────────────────────────────────────
-- 11. TRANSFERS  (internal movement)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transfers (
    id              INT         AUTO_INCREMENT PRIMARY KEY,
    reference       VARCHAR(60) NOT NULL UNIQUE,
    from_location_id INT        NOT NULL,
    to_location_id   INT        NOT NULL,
    status           ENUM('draft','waiting','ready','done','cancelled') NOT NULL DEFAULT 'draft',
    created_by       INT        NULL,
    validated_at     DATETIME   NULL,
    created_at       DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_location_id) REFERENCES locations(id),
    FOREIGN KEY (to_location_id)   REFERENCES locations(id),
    FOREIGN KEY (created_by)       REFERENCES users(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────
-- 12. TRANSFER ITEMS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transfer_items (
    id          INT           AUTO_INCREMENT PRIMARY KEY,
    transfer_id INT           NOT NULL,
    product_id  INT           NOT NULL,
    quantity    DECIMAL(12,2) NOT NULL DEFAULT 0,
    FOREIGN KEY (transfer_id) REFERENCES transfers(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id)  REFERENCES products(id)
);

-- ─────────────────────────────────────────────
-- 13. STOCK ADJUSTMENTS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stock_adjustments (
    id             INT           AUTO_INCREMENT PRIMARY KEY,
    product_id     INT           NOT NULL,
    location_id    INT           NOT NULL,
    system_qty     DECIMAL(12,2) NOT NULL,
    physical_qty   DECIMAL(12,2) NOT NULL,
    difference     DECIMAL(12,2) GENERATED ALWAYS AS (physical_qty - system_qty) STORED,
    reason         VARCHAR(255)  NULL,
    created_by     INT           NULL,
    created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id)  REFERENCES products(id),
    FOREIGN KEY (location_id) REFERENCES locations(id),
    FOREIGN KEY (created_by)  REFERENCES users(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────
-- 14. STOCK LEDGER  (immutable audit trail)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stock_ledger (
    id              INT           AUTO_INCREMENT PRIMARY KEY,
    product_id      INT           NOT NULL,
    location_id     INT           NOT NULL,
    movement_type   ENUM('receipt','delivery','transfer_in','transfer_out','adjustment') NOT NULL,
    reference_type  VARCHAR(30)   NOT NULL,  -- 'receipt', 'delivery', 'transfer', 'adjustment'
    reference_id    INT           NOT NULL,  -- ID of the parent document
    qty_change      DECIMAL(12,2) NOT NULL,  -- positive = increase, negative = decrease
    qty_after       DECIMAL(12,2) NOT NULL,  -- balance after this movement
    note            VARCHAR(255)  NULL,
    created_by      INT           NULL,
    created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id)  REFERENCES products(id),
    FOREIGN KEY (location_id) REFERENCES locations(id),
    FOREIGN KEY (created_by)  REFERENCES users(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────
-- SEED DATA — default warehouse, location, category, admin user
-- ─────────────────────────────────────────────

INSERT IGNORE INTO warehouses (id, name, address) VALUES
    (1, 'Main Warehouse', 'Head Office');

INSERT IGNORE INTO locations (id, warehouse_id, name) VALUES
    (1, 1, 'Main Storage'),
    (2, 1, 'Production Floor'),
    (3, 1, 'Rack A'),
    (4, 1, 'Rack B');

INSERT IGNORE INTO categories (id, name) VALUES
    (1, 'Raw Material'),
    (2, 'Furniture'),
    (3, 'Electronics'),
    (4, 'Consumables');

-- Default admin user (password: admin123)
-- bcrypt hash for 'admin123' with salt rounds = 10
INSERT IGNORE INTO users (id, name, username, email, password_hash, role) VALUES
    (1, 'Admin User', 'admin', 'admin@coreinventory.com',
     '$2b$10$CHaX/wE.F8yGmYWIjLNRQe0tlof620e.0gNXVquju9CQ4EELusvLy',
     'Manager');
