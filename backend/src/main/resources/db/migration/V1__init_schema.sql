-- V1 Flyway: giữ đồng bộ với backend/database/init_schema.sql
-- Database: PostgreSQL 13+

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- =============================================
-- 1. USERS
-- =============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    avatar_url TEXT,
    role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'DIRECTOR', 'SELLER', 'PRODUCTION', 'ACCOUNTANT')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 2. AGENCIES
-- =============================================
CREATE TABLE agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    assigned_seller_id UUID REFERENCES users(id),
    level VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    tax_code VARCHAR(50),
    legal_company_name VARCHAR(255),
    total_debt DECIMAL(19, 4) DEFAULT 0.0,
    max_debt_limit DECIMAL(19, 4) DEFAULT 50000000.0,
    is_active BOOLEAN DEFAULT TRUE,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 3. CATEGORIES
-- =============================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 4. SUPPLIERS
-- =============================================
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    tax_code VARCHAR(50),
    total_debt DECIMAL(19, 4) DEFAULT 0.0,
    is_active BOOLEAN DEFAULT TRUE,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 5. PRODUCTS
-- =============================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES categories(id),
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    image_urls JSONB,
    cost_price DECIMAL(19, 4) DEFAULT 0.0,
    suggested_price DECIMAL(19, 4) DEFAULT 0.0,
    stock_quantity INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_custom BOOLEAN NOT NULL DEFAULT FALSE,
    agency_id UUID REFERENCES agencies(id),
    created_by UUID REFERENCES users(id),
    resource_url TEXT,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 6. MATERIALS
-- =============================================
CREATE TABLE materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    image_url TEXT,
    unit VARCHAR(50) NOT NULL,
    unit_cost DECIMAL(19, 4) DEFAULT 0.0,
    stock_quantity NUMERIC(15, 4) DEFAULT 0.0,
    min_stock_level NUMERIC(15, 4) DEFAULT 0.0,
    is_active BOOLEAN DEFAULT TRUE,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 7. BOM_ITEMS
-- =============================================
CREATE TABLE bom_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id),
    material_id UUID NOT NULL REFERENCES materials(id),
    quantity NUMERIC(15, 4) NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 8. ORDERS
-- =============================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id),
    created_by UUID NOT NULL REFERENCES users(id),
    approver_id UUID REFERENCES users(id),
    total_amount DECIMAL(19, 4) DEFAULT 0.0,
    discount_amount DECIMAL(19, 4) DEFAULT 0.0,
    shipping_fee DECIMAL(19, 4) DEFAULT 0.0,
    total_payable DECIMAL(19, 4) DEFAULT 0.0,
    paid_amount DECIMAL(19, 4) DEFAULT 0.0,
    expected_delivery_date DATE,
    shipping_address TEXT,
    status VARCHAR(50) NOT NULL CHECK (status IN ('Draft', 'Pending', 'Approved', 'Producing', 'Done', 'Rejected', 'Canceled')),
    note TEXT,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 9. ORDER_ITEMS
-- =============================================
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INT NOT NULL,
    unit_price DECIMAL(19, 4) NOT NULL,
    unit_cost_at_time DECIMAL(19, 4) NOT NULL,
    subtotal DECIMAL(19, 4) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 10. PAYMENTS
-- =============================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id),
    agency_id UUID NOT NULL REFERENCES agencies(id),
    amount DECIMAL(19, 4) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    proof_image TEXT,
    note TEXT,
    status VARCHAR(50) NOT NULL CHECK (status IN ('Pending', 'Completed', 'Failed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 11. INVOICES
-- =============================================
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    invoice_number VARCHAR(100) UNIQUE,
    sub_total DECIMAL(19, 4) NOT NULL,
    vat_rate DECIMAL(5, 2) NOT NULL,
    vat_amount DECIMAL(19, 4) NOT NULL,
    total_amount DECIMAL(19, 4) NOT NULL,
    invoice_file_url TEXT,
    status VARCHAR(50) NOT NULL CHECK (status IN ('Draft', 'Issued', 'Canceled')),
    note TEXT,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 12. PRODUCTION_TASKS
-- =============================================
CREATE TABLE production_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id),
    product_id UUID REFERENCES products(id),
    quantity INT NOT NULL DEFAULT 1,
    assigned_to UUID REFERENCES users(id),
    status VARCHAR(50) NOT NULL CHECK (status IN ('Waiting', 'Doing', 'Done')),
    start_date DATE,
    expected_end_date DATE,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 13. ACTIVITY_LOGS
-- =============================================
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES production_tasks(id),
    user_id UUID NOT NULL REFERENCES users(id),
    image_url TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 14. PURCHASE_ORDERS
-- =============================================
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    total_amount DECIMAL(19, 4) DEFAULT 0.0,
    paid_amount DECIMAL(19, 4) DEFAULT 0.0,
    payment_status VARCHAR(50) DEFAULT 'Unpaid' CHECK (payment_status IN ('Unpaid', 'Partial', 'Paid')),
    status VARCHAR(50) NOT NULL CHECK (status IN ('Pending', 'Received', 'Canceled')),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES materials(id),
    quantity NUMERIC(15, 4) NOT NULL,
    unit_price DECIMAL(19, 4) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_poi_quantity_positive CHECK (quantity > 0),
    CONSTRAINT chk_poi_unit_price_nonneg CHECK (unit_price >= 0)
);

CREATE INDEX idx_purchase_order_items_po ON purchase_order_items (purchase_order_id);
CREATE INDEX idx_purchase_order_items_material ON purchase_order_items (material_id);

-- =============================================
-- 15. INVENTORY_LOGS
-- =============================================
CREATE TABLE inventory_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id UUID NOT NULL REFERENCES materials(id),
    task_id UUID REFERENCES production_tasks(id),
    purchase_id UUID REFERENCES purchase_orders(id),
    created_by UUID NOT NULL REFERENCES users(id),
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('IMPORT', 'EXPORT', 'WASTE')),
    quantity_change NUMERIC(15, 4) NOT NULL,
    unit_price_at_time DECIMAL(19, 4),
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 16. PRODUCT_INVENTORY_LOGS
-- =============================================
CREATE TABLE product_inventory_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id),
    order_id UUID REFERENCES orders(id),
    task_id UUID REFERENCES production_tasks(id),
    created_by UUID NOT NULL REFERENCES users(id),
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('IMPORT', 'EXPORT', 'WASTE')),
    quantity_change INT NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START WITH 1 INCREMENT BY 1;

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_agencies_seller ON agencies(assigned_seller_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_agency ON products(agency_id);
CREATE INDEX idx_orders_agency ON orders(agency_id);
CREATE INDEX idx_orders_created_by ON orders(created_by);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_agency ON payments(agency_id);
CREATE INDEX idx_invoices_order ON invoices(order_id);
CREATE INDEX idx_production_tasks_order ON production_tasks(order_id);
CREATE INDEX idx_production_tasks_assigned ON production_tasks(assigned_to);
CREATE INDEX idx_activity_logs_task ON activity_logs(task_id);
CREATE INDEX idx_inventory_logs_material ON inventory_logs(material_id);
CREATE INDEX idx_product_inventory_logs_product ON product_inventory_logs(product_id);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
