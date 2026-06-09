ALTER TABLE orders ADD COLUMN source_order_id UUID REFERENCES orders(id);

CREATE INDEX idx_orders_source_order_id ON orders(source_order_id);

COMMENT ON COLUMN orders.source_order_id IS 'Don tao tu copy bao gia/ don goc; NULL = tao thu cong';
