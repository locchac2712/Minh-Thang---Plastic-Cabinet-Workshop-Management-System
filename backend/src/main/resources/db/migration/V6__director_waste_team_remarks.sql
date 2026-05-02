-- Nhận xét / hành động director theo kỳ và PIC (team_user_id = production_tasks.assigned_to)
CREATE TABLE director_waste_team_remarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_from DATE NOT NULL,
    period_to DATE NOT NULL,
    team_user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    remark TEXT,
    updated_by UUID REFERENCES users (id) ON DELETE SET NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_director_waste_remark_period_team UNIQUE (period_from, period_to, team_user_id)
);

CREATE INDEX idx_director_waste_remarks_team ON director_waste_team_remarks (team_user_id);

-- Hỗ trợ báo cáo hao phí theo kỳ
CREATE INDEX idx_inventory_logs_waste_created ON inventory_logs (transaction_type, created_at);
