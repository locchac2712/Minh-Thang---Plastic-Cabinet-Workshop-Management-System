-- Giao lô MTO: địa chỉ giao theo từng lô + ảnh bằng chứng

ALTER TABLE production_tasks
    ADD COLUMN IF NOT EXISTS delivery_address TEXT,
    ADD COLUMN IF NOT EXISTS delivery_proof_image_url TEXT;
