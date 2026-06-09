-- In-app notifications inbox (polling API, no websocket)

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    target_url VARCHAR(500),
    event_key VARCHAR(255),
    meta_json TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX uq_notifications_event_key
    ON notifications(event_key)
    WHERE event_key IS NOT NULL;

CREATE TABLE user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_notifications_notification_user UNIQUE (notification_id, user_id)
);

CREATE INDEX idx_user_notifications_user_created_at
    ON user_notifications(user_id, created_at DESC);

CREATE INDEX idx_user_notifications_user_is_read_created_at
    ON user_notifications(user_id, is_read, created_at DESC);
