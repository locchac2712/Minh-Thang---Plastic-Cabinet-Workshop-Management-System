-- V2: Seed default Admin user
-- Password: admin123 (plain text - TODO: đổi BCrypt trước khi deploy production)
INSERT INTO users (id, username, email, password, full_name, role, is_active)
VALUES (
    gen_random_uuid(),
    'admin',
    'admin@tuplastic.com',
    'admin123',
    'System Administrator',
    'ADMIN',
    TRUE
);
