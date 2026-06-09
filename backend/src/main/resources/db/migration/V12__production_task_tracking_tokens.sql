-- Link public theo dõi lô SX (seller chia sẻ cho khách / đại lý)

CREATE TABLE production_task_tracking_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES production_tasks(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_task_tracking_token_hash ON production_task_tracking_tokens(token_hash);
CREATE INDEX idx_task_tracking_task_id ON production_task_tracking_tokens(task_id);
