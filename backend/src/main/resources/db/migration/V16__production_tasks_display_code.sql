-- Human-readable display codes: LSX- (lệnh sản xuất)
ALTER TABLE production_tasks ADD COLUMN IF NOT EXISTS display_code VARCHAR(32);

CREATE SEQUENCE IF NOT EXISTS production_task_number_seq START WITH 1 INCREMENT BY 1;

WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY EXTRACT(YEAR FROM created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')
               ORDER BY created_at, id
           ) AS rn,
           EXTRACT(YEAR FROM created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::int AS yr
    FROM production_tasks
    WHERE display_code IS NULL
)
UPDATE production_tasks pt
SET display_code = 'LSX-' || r.yr || '-' || LPAD(r.rn::text, 5, '0')
FROM ranked r
WHERE pt.id = r.id
  AND pt.display_code IS NULL;

ALTER TABLE production_tasks ALTER COLUMN display_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_production_tasks_display_code ON production_tasks(display_code);

SELECT setval(
    'production_task_number_seq',
    GREATEST(
        1,
        COALESCE(
            (SELECT MAX(CAST(SPLIT_PART(display_code, '-', 3) AS bigint))
             FROM production_tasks
             WHERE display_code LIKE 'LSX-%'),
            0
        ) + 1
    ),
    false
);
