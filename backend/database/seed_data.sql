-- =============================================
-- SEED DATA - Dữ liệu mẫu cho Hệ Thống Quản Lý Xưởng Tủ Nhựa Minh Thắng
-- Chạy sau init_schema.sql
-- Password mặc định tất cả tài khoản: 123456
-- Mật khẩu đã được mã hóa bằng thuật toán mà hệ thống đang dùng (nếu có, ở đây đang dùng raw text hoặc sẽ do backend xử lý)
-- Do init_schema.sql insert plaintext admin123, giả định backend dùng NoOp hoặc bcrypt.
-- =============================================

-- Xóa dữ liệu cũ nếu chạy lại
DELETE FROM users WHERE username = 'admin';

-- =============================================
-- 1. USERS (Tài khoản người dùng)
-- =============================================
INSERT INTO users (id, username, email, password, full_name, role, is_active) VALUES
('a0000000-0000-0000-0000-000000000001', 'admin', 'admin@minhthang.com', '123456', 'Quản Trị Hệ Thống', 'ADMIN', TRUE),
('a0000000-0000-0000-0000-000000000002', 'giamdoc', 'giamdoc@minhthang.com', '123456', 'Trần Minh Thắng', 'DIRECTOR', TRUE),
('a0000000-0000-0000-0000-000000000003', 'banhang01', 'banhang01@minhthang.com', '123456', 'Nguyễn Thị Hoa', 'SELLER', TRUE),
('a0000000-0000-0000-0000-000000000004', 'banhang02', 'banhang02@minhthang.com', '123456', 'Lê Văn Tú', 'SELLER', TRUE),
('a0000000-0000-0000-0000-000000000005', 'thoxuong01', 'thoxuong01@minhthang.com', '123456', 'Phạm Công Hậu', 'PRODUCTION', TRUE),
('a0000000-0000-0000-0000-000000000006', 'thoxuong02', 'thoxuong02@minhthang.com', '123456', 'Võ Trọng Nghĩa', 'PRODUCTION', TRUE),
('a0000000-0000-0000-0000-000000000007', 'ketoan', 'ketoan@minhthang.com', '123456', 'Đặng Ngọc Lan', 'ACCOUNTANT', TRUE);

-- =============================================
-- 2. AGENCIES (Đại lý phân phối)
-- =============================================
INSERT INTO agencies (id, name, assigned_seller_id, level, phone, address, tax_code, legal_company_name, total_debt, max_debt_limit, is_active) VALUES
('11000000-0000-0000-0000-000000000001', 'Nội Thất Nhựa An Phước', 'a0000000-0000-0000-0000-000000000003', 'VIP', '0912345678', '123 Nguyễn Văn Cừ, Quận 5, TP. HCM', '0301234567', 'Công Ty TNHH An Phước', 12000000.0, 150000000.0, TRUE),
('11000000-0000-0000-0000-000000000002', 'Cửa Hàng Đồ Nhựa Bình Minh', 'a0000000-0000-0000-0000-000000000003', 'Thường', '0987654321', '45 Lê Hồng Phong, Vũng Tàu', '3501234567', 'Cửa Hàng Bình Minh', 0.0, 50000000.0, TRUE),
('11000000-0000-0000-0000-000000000003', 'Siêu Thị Nội Thất Trẻ Em', 'a0000000-0000-0000-0000-000000000004', 'Khách Buôn', '0901112233', '88 Quang Trung, Gò Vấp, TP. HCM', '0309876543', 'Công Ty Nội Thất Trẻ Em', 0.0, 80000000.0, TRUE);

-- =============================================
-- 3. CATEGORIES (Danh mục sản phẩm)
-- =============================================
INSERT INTO categories (id, name, description, is_active) VALUES
('b0000000-0000-0000-0000-000000000001', 'Tủ Nhựa Đài Loan', 'Các loại tủ sử dụng nhựa Đài Loan tiêu chuẩn', TRUE),
('b0000000-0000-0000-0000-000000000002', 'Tủ Nhựa Ecoplast', 'Dòng tủ nhựa Ecoplast cao cấp, dày và siêu bền', TRUE),
('b0000000-0000-0000-0000-000000000003', 'Bàn Học Nhựa', 'Bàn học trẻ em liền giá sách, nhiều màu sắc', TRUE),
('b0000000-0000-0000-0000-000000000004', 'Kệ & Tủ Giày', 'Các loại tủ để giày dép và kệ đa năng', TRUE);

-- =============================================
-- 4. MATERIALS (Nguyên vật liệu & Phụ kiện)
-- =============================================
INSERT INTO materials (id, code, name, unit, unit_cost, stock_quantity, min_stock_level, is_active) VALUES
('c0000000-0000-0000-0000-000000000001', 'TN-DL-TRANG', 'Tấm Nhựa Đài Loan Màu Trắng', 'Tấm', 120000.0, 300.0, 50.0, TRUE),
('c0000000-0000-0000-0000-000000000002', 'TN-DL-GO', 'Tấm Nhựa Đài Loan Vân Gỗ', 'Tấm', 130000.0, 200.0, 40.0, TRUE),
('c0000000-0000-0000-0000-000000000003', 'TN-ECO-SOITRANG', 'Tấm Nhựa Ecoplast Sồi Trắng', 'Tấm', 250000.0, 150.0, 30.0, TRUE),
('c0000000-0000-0000-0000-000000000004', 'PK-BANLE', 'Bản Lề Giảm Chấn Inox 304', 'Cái', 25000.0, 500.0, 100.0, TRUE),
('c0000000-0000-0000-0000-000000000005', 'PK-RAY', 'Ray Trượt Ngăn Kéo 3 Khúc (Cặp)', 'Cặp', 35000.0, 200.0, 40.0, TRUE),
('c0000000-0000-0000-0000-000000000006', 'PK-TAYNAM', 'Tay Nắm Cửa Nhôm Chữ U', 'Cái', 12000.0, 600.0, 150.0, TRUE),
('c0000000-0000-0000-0000-000000000007', 'PK-OCVIT', 'Ốc Vít Lắp Nhựa 1.5cm (Túi 1000)', 'Túi', 45000.0, 50.0, 10.0, TRUE),
('c0000000-0000-0000-0000-000000000008', 'PK-CHAN', 'Chân Đế Nhựa Vuông 5cm', 'Cái', 8000.0, 400.0, 80.0, TRUE);

-- =============================================
-- 5. SUPPLIERS (Nhà cung cấp)
-- =============================================
INSERT INTO suppliers (id, name, phone, address, tax_code, total_debt, is_active) VALUES
('d0000000-0000-0000-0000-000000000001', 'Nhà Máy Nhựa Đại Thành', '0911222333', 'KCN Tân Tạo, Bình Tân, TP. HCM', '0301112223', 0.0, TRUE),
('d0000000-0000-0000-0000-000000000002', 'Đại Lý Phụ Kiện Mộc Gia Hưng', '0922333444', '112 Lý Thường Kiệt, Tân Bình, TP. HCM', '0302223334', 5000000.0, TRUE);

-- Material - Supplier relation
INSERT INTO material_supplier (material_id, supplier_id) VALUES
('c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001'),
('c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001'),
('c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001'),
('c0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000002'),
('c0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000002'),
('c0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000002'),
('c0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000002'),
('c0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000002');

-- =============================================
-- 6. PRODUCTS (Sản phẩm)
-- =============================================
INSERT INTO products (id, category_id, sku, name, image_urls, cost_price, suggested_price, stock_quantity, is_active, is_custom) VALUES
('e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'TQA-DL-3C2N', 'Tủ Quần Áo Đài Loan 3 Cánh 2 Ngăn', '[]', 1600000.0, 2800000.0, 15, TRUE, FALSE),
('e0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'TQA-ECO-4C', 'Tủ Quần Áo Ecoplast 4 Cánh Kịch Trần', '[]', 4500000.0, 8500000.0, 5, TRUE, FALSE),
('e0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'BH-DO-KGS', 'Bàn Học Đôi Có Kệ Giá Sách Màu Xanh', '[]', 1200000.0, 2200000.0, 10, TRUE, FALSE),
('e0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'TG-5T-VGO', 'Tủ Giày Nhựa 5 Tầng Vân Gỗ Cửa Lật', '[]', 850000.0, 1500000.0, 20, TRUE, FALSE);

-- Sản phẩm custom theo yêu cầu Đại Lý An Phước
INSERT INTO products (id, category_id, sku, name, image_urls, cost_price, suggested_price, stock_quantity, is_active, is_custom, agency_id, created_by) VALUES
('e0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000002', 'TQA-CUST-VIP', 'Tủ Âm Tường Ecoplast Biệt Thự', '[]', 0.0, 15000000.0, 0, TRUE, TRUE, '11000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003');

-- =============================================
-- 7. BOM_ITEMS (Định mức vật tư)
-- =============================================
-- Tủ Quần Áo Đài Loan 3 Cánh 2 Ngăn: 12 tấm Trắng, 6 Bản lề, 2 Cặp ray, 5 Tay nắm, 0.1 túi ốc, 6 Chân đế
INSERT INTO bom_items (id, product_id, material_id, quantity, note) VALUES
('f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 12.0, 'Khung và cánh'),
('f0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004', 6.0, '3 cánh x 2 bản lề'),
('f0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000005', 2.0, '2 ngăn kéo'),
('f0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000006', 5.0, 'Tay nắm'),
('f0000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000007', 0.1, '10% túi ốc'),
('f0000000-0000-0000-0000-000000000006', 'e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000008', 6.0, 'Chân đế');

-- Tủ Ecoplast 4 Cánh: 20 Tấm Sồi Trắng, 16 Bản Lề, 4 Cặp ray, 8 Tay nắm, 0.15 túi ốc, 8 Chân
INSERT INTO bom_items (id, product_id, material_id, quantity, note) VALUES
('f0000000-0000-0000-0000-000000000011', 'e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', 20.0, 'Vật liệu chính'),
('f0000000-0000-0000-0000-000000000012', 'e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000004', 16.0, '4 cánh dài + tủ trên'),
('f0000000-0000-0000-0000-000000000013', 'e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000005', 4.0, 'Ngăn kéo trong'),
('f0000000-0000-0000-0000-000000000014', 'e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000006', 8.0, 'Tay nắm'),
('f0000000-0000-0000-0000-000000000015', 'e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000007', 0.15, 'Ốc vít'),
('f0000000-0000-0000-0000-000000000016', 'e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000008', 8.0, 'Chân đế lớn');

-- =============================================
-- 8. ORDERS (Đơn hàng)
-- =============================================
-- Đơn hàng 1: An Phước đặt 5 Tủ Đài Loan, 2 Tủ Ecoplast (Đã duyệt, Đang sản xuất)
INSERT INTO orders (id, agency_id, created_by, approver_id, total_amount, discount_amount, shipping_fee, total_payable, paid_amount, expected_delivery_date, shipping_address, status, note) VALUES
('14000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002',
31000000.0, 1000000.0, 500000.0, 30500000.0, 10000000.0,
'2026-06-15', '123 Nguyễn Văn Cừ, Quận 5, TP. HCM', 'Producing', 'Khách VIP giao hàng cẩn thận');

INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, unit_cost_at_time, subtotal) VALUES
('14100000-0000-0000-0000-000000000001', '14000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 5, 2800000.0, 1600000.0, 14000000.0),
('14100000-0000-0000-0000-000000000002', '14000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 2, 8500000.0, 4500000.0, 17000000.0);

-- Đơn hàng 2: Bình Minh đặt Bàn học và Tủ Giày (Đã hoàn thành)
INSERT INTO orders (id, agency_id, created_by, approver_id, total_amount, discount_amount, shipping_fee, total_payable, paid_amount, expected_delivery_date, shipping_address, status, note) VALUES
('14000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002',
8200000.0, 0.0, 300000.0, 8500000.0, 8500000.0,
'2026-05-01', '45 Lê Hồng Phong, Vũng Tàu', 'Done', 'Đã giao và thu đủ tiền');

INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, unit_cost_at_time, subtotal) VALUES
('14100000-0000-0000-0000-000000000003', '14000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000003', 2, 2200000.0, 1200000.0, 4400000.0),
('14100000-0000-0000-0000-000000000004', '14000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000004', 2, 1900000.0, 850000.0, 3800000.0);

-- =============================================
-- 9. PRODUCTION_TASKS (Lệnh sản xuất)
-- =============================================
-- Lệnh sản xuất cho Đơn #1
INSERT INTO production_tasks (id, order_id, product_id, quantity, assigned_to, status, start_date, expected_end_date) VALUES
('16000000-0000-0000-0000-000000000001', '14000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 5, 'a0000000-0000-0000-0000-000000000005', 'Doing', '2026-05-10', '2026-05-20'),
('16000000-0000-0000-0000-000000000002', '14000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 2, 'a0000000-0000-0000-0000-000000000006', 'Waiting', '2026-05-12', '2026-05-25');

-- Lệnh sản xuất cho Đơn #2 (Đã hoàn thành)
INSERT INTO production_tasks (id, order_id, product_id, quantity, assigned_to, status, start_date, expected_end_date, completed_at) VALUES
('16000000-0000-0000-0000-000000000003', '14000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000003', 2, 'a0000000-0000-0000-0000-000000000005', 'Done', '2026-04-25', '2026-04-28', '2026-04-28 17:00:00');

-- =============================================
-- 10. PURCHASE_ORDERS (Đơn mua vật tư)
-- =============================================
INSERT INTO purchase_orders (id, supplier_id, total_amount, paid_amount, payment_status, status) VALUES
('12000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 15000000.0, 10000000.0, 'Partial', 'Received');

INSERT INTO purchase_order_items (id, purchase_order_id, material_id, quantity, unit_price) VALUES
('12100000-0000-0000-0000-000000000001', '12000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004', 200, 25000.0),
('12100000-0000-0000-0000-000000000002', '12000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000005', 100, 35000.0);

-- =============================================
-- 11. INVENTORY_LOGS (Lịch sử Kho NVL)
-- =============================================
INSERT INTO inventory_logs (id, material_id, purchase_id, created_by, transaction_type, quantity_change, unit_price_at_time, note) VALUES
('13000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004', '12000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000007', 'IMPORT', 200.0, 25000.0, 'Nhập bản lề từ đơn PO 001'),
('13000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000005', '12000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000007', 'IMPORT', 100.0, 35000.0, 'Nhập ray trượt từ đơn PO 001');

-- Xuất kho cho Lệnh SX #001 (5 Tủ 3 Cánh: 60 Tấm trắng, 30 Bản lề, 10 Ray, 25 Tay nắm, 0.5 Ốc, 30 Chân)
INSERT INTO inventory_logs (id, material_id, task_id, created_by, transaction_type, quantity_change, note) VALUES
('13000000-0000-0000-0000-000000000101', 'c0000000-0000-0000-0000-000000000001', '16000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005', 'EXPORT', -60.0, 'Xuất tự động cho Lệnh SX #001'),
('13000000-0000-0000-0000-000000000102', 'c0000000-0000-0000-0000-000000000004', '16000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005', 'EXPORT', -30.0, 'Xuất tự động cho Lệnh SX #001');

-- =============================================
-- 12. PAYMENTS (Thanh toán)
-- =============================================
INSERT INTO payments (id, order_id, agency_id, amount, payment_method, note, status) VALUES
('18000000-0000-0000-0000-000000000001', '14000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', 10000000.0, 'Chuyển khoản', 'Đại lý An Phước đặt cọc', 'Completed'),
('18000000-0000-0000-0000-000000000002', '14000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000002', 8500000.0, 'Tiền mặt', 'Thu tiền mặt khi giao hàng', 'Completed');

-- =============================================
-- 13. INVOICES (Hoá đơn)
-- =============================================
INSERT INTO invoices (id, order_id, invoice_number, sub_total, vat_rate, vat_amount, total_amount, status, note) VALUES
('19000000-0000-0000-0000-000000000001', '14000000-0000-0000-0000-000000000002', 'HD-MT-001', 8500000.0, 8.0, 680000.0, 9180000.0, 'Issued', 'Xuất hoá đơn Đơn Bình Minh');

-- =============================================
-- 14. DATA FOR CHARTS (Dữ liệu phục vụ Dashboard)
-- =============================================
-- Xóa NVL Trend cũ
DELETE FROM inventory_logs WHERE note LIKE 'SEED:TREND:%';
DELETE FROM materials WHERE code LIKE 'SEED-TREND-%';

-- Thêm một vài NVL giả lập trend cảnh báo
INSERT INTO materials (id, code, name, unit, unit_cost, stock_quantity, min_stock_level, is_active) VALUES
('c0000000-0000-0000-0000-000000000020', 'CHUYEN-DUNG-01', 'Keo Chuyên Dụng Tấm Nhựa', 'Lít', 95000.0, 45.0, 40.0, TRUE);

INSERT INTO inventory_logs (id, material_id, created_by, transaction_type, quantity_change, note, created_at) VALUES
('13000000-0000-0000-0000-009000000001', 'c0000000-0000-0000-0000-000000000020', 'a0000000-0000-0000-0000-000000000007', 'IMPORT', 100.0, 'SEED:TREND: nhập ban đầu', ((CURRENT_DATE - INTERVAL '10 day')::date + TIME '10:00')),
('13000000-0000-0000-0000-009000000002', 'c0000000-0000-0000-0000-000000000020', 'a0000000-0000-0000-0000-000000000007', 'EXPORT', -30.0, 'SEED:TREND: xuất', ((CURRENT_DATE - INTERVAL '8 day')::date + TIME '14:00')),
('13000000-0000-0000-0000-009000000003', 'c0000000-0000-0000-0000-000000000020', 'a0000000-0000-0000-0000-000000000007', 'EXPORT', -25.0, 'SEED:TREND: xuất lớn', ((CURRENT_DATE - INTERVAL '3 day')::date + TIME '09:00'));

-- Thêm giả lập Bar Chart (Sản phẩm theo Category)
DELETE FROM products WHERE sku LIKE 'SEED-BAR-%';
INSERT INTO products (id, category_id, sku, name, image_urls, cost_price, suggested_price, stock_quantity, is_active, is_custom, created_by, created_at)
SELECT gen_random_uuid(), 'b0000000-0000-0000-0000-000000000001'::uuid, 'SEED-BAR-DL-' || n::text, 'Tủ Đài Loan Mẫu ' || n::text, '[]'::jsonb, 1000000.0, 2000000.0, 1, TRUE, FALSE, 'a0000000-0000-0000-0000-000000000003'::uuid, CURRENT_TIMESTAMP
FROM generate_series(1, 10) AS bar(n);

INSERT INTO products (id, category_id, sku, name, image_urls, cost_price, suggested_price, stock_quantity, is_active, is_custom, created_by, created_at)
SELECT gen_random_uuid(), 'b0000000-0000-0000-0000-000000000002'::uuid, 'SEED-BAR-ECO-' || n::text, 'Tủ Ecoplast Mẫu ' || n::text, '[]'::jsonb, 2000000.0, 4000000.0, 1, TRUE, FALSE, 'a0000000-0000-0000-0000-000000000003'::uuid, CURRENT_TIMESTAMP
FROM generate_series(1, 8) AS bar(n);

INSERT INTO products (id, category_id, sku, name, image_urls, cost_price, suggested_price, stock_quantity, is_active, is_custom, created_by, created_at)
SELECT gen_random_uuid(), 'b0000000-0000-0000-0000-000000000003'::uuid, 'SEED-BAR-BH-' || n::text, 'Bàn Học Mẫu ' || n::text, '[]'::jsonb, 800000.0, 1500000.0, 1, TRUE, FALSE, 'a0000000-0000-0000-0000-000000000003'::uuid, CURRENT_TIMESTAMP
FROM generate_series(1, 5) AS bar(n);
