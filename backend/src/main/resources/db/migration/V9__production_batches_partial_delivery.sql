-- Lô SX động + giao từng đợt: delivered_quantity trên order_items, order_item_id + delivered_at trên production_tasks

ALTER TABLE order_items
    ADD COLUMN IF NOT EXISTS delivered_quantity INT NOT NULL DEFAULT 0;

ALTER TABLE production_tasks
    ADD COLUMN IF NOT EXISTS order_item_id UUID REFERENCES order_items(id),
    ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;

-- Backfill order_item_id từ order_id + product_id (dòng đầu nếu trùng SP)
UPDATE production_tasks pt
SET order_item_id = (
    SELECT oi.id
    FROM order_items oi
    WHERE oi.order_id = pt.order_id
      AND oi.product_id = pt.product_id
    ORDER BY oi.created_at ASC
    LIMIT 1
)
WHERE pt.order_item_id IS NULL
  AND pt.order_id IS NOT NULL
  AND pt.product_id IS NOT NULL;

-- Đơn Done + task Done: coi như đã giao hết (luồng mark-done cũ)
UPDATE production_tasks pt
SET delivered_at = pt.completed_at
FROM orders o
WHERE pt.order_id = o.id
  AND o.status = 'Done'
  AND pt.status = 'Done'
  AND pt.delivered_at IS NULL
  AND pt.completed_at IS NOT NULL;

UPDATE order_items oi
SET delivered_quantity = oi.quantity
FROM orders o
WHERE oi.order_id = o.id
  AND o.status = 'Done'
  AND oi.delivered_quantity = 0;

CREATE INDEX IF NOT EXISTS idx_production_tasks_order_item ON production_tasks(order_item_id);
CREATE INDEX IF NOT EXISTS idx_production_tasks_delivered_at ON production_tasks(delivered_at);
