-- Human-readable display codes: BG- (quotation template) / DH- (fulfillment order)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS display_code VARCHAR(32);

CREATE SEQUENCE IF NOT EXISTS quotation_number_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1 INCREMENT BY 1;

WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY EXTRACT(YEAR FROM created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')
               ORDER BY created_at, id
           ) AS rn,
           EXTRACT(YEAR FROM created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::int AS yr
    FROM orders
    WHERE source_order_id IS NULL
)
UPDATE orders o
SET display_code = 'BG-' || r.yr || '-' || LPAD(r.rn::text, 5, '0')
FROM ranked r
WHERE o.id = r.id
  AND o.display_code IS NULL;

WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY EXTRACT(YEAR FROM created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')
               ORDER BY created_at, id
           ) AS rn,
           EXTRACT(YEAR FROM created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::int AS yr
    FROM orders
    WHERE source_order_id IS NOT NULL
)
UPDATE orders o
SET display_code = 'DH-' || r.yr || '-' || LPAD(r.rn::text, 5, '0')
FROM ranked r
WHERE o.id = r.id
  AND o.display_code IS NULL;

ALTER TABLE orders ALTER COLUMN display_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_display_code ON orders(display_code);

SELECT setval(
    'quotation_number_seq',
    GREATEST(
        1,
        COALESCE(
            (SELECT MAX(CAST(SPLIT_PART(display_code, '-', 3) AS bigint))
             FROM orders
             WHERE display_code LIKE 'BG-%'),
            0
        ) + 1
    ),
    false
);

SELECT setval(
    'order_number_seq',
    GREATEST(
        1,
        COALESCE(
            (SELECT MAX(CAST(SPLIT_PART(display_code, '-', 3) AS bigint))
             FROM orders
             WHERE display_code LIKE 'DH-%'),
            0
        ) + 1
    ),
    false
);
