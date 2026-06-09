ALTER TABLE orders ADD COLUMN quotation_valid_until DATE;

COMMENT ON COLUMN orders.quotation_valid_until IS 'Hạn hiệu lực báo giá; NULL = không giới hạn';
