package com.pcwms.backend.config;

import com.pcwms.backend.entity.*;
import com.pcwms.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StaffRepository staffRepository;

    @Autowired
    private MaterialRepository materialRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private WarehouseTransactionRepository warehouseTransactionRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private SupplierMaterialRepository supplierMaterialRepository;

    // 👉 BỔ SUNG: Kho chứa Định mức (BOM)
    @Autowired
    private BillOfMaterialRepository billOfMaterialRepository;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("=== BẮT ĐẦU KIỂM TRA & TẠO DỮ LIỆU MẪU ===");

        // 1. TẠO DANH SÁCH QUYỀN (ROLES)
        List<String> roles = List.of(
                "ROLE_ADMIN", "ROLE_DIRECTOR", "ROLE_SALES_MANAGER",
                "ROLE_SALES_STAFF", "ROLE_WAREHOUSE_MANAGER",
                "ROLE_PRODUCTION_MANAGER", "ROLE_ACCOUNTANT"
        );

        for (String roleName : roles) {
            if (!roleRepository.existsByRoleName(roleName)) {
                Role role = new Role();
                role.setRoleName(roleName);
                roleRepository.save(role);
            }
        }

        // 2. TẠO TÀI KHOẢN VÀ HỒ SƠ NHÂN VIÊN NỘI BỘ
        if (userRepository.count() == 0) {
            String defaultPassword = passwordEncoder.encode("123456");

            createStaffUser("admin", defaultPassword, "ROLE_ADMIN", "Nguyễn Quản Trị", "Ban Giám Đốc", "EMP-001", "admin_system@gmail.com", "0988000001");
            createStaffUser("director", defaultPassword, "ROLE_DIRECTOR", "Trần Giám Đốc", "Ban Giám Đốc", "EMP-002", "director@gmail.com", "0988000002");
            createStaffUser("sales_manager", defaultPassword, "ROLE_SALES_MANAGER", "Lê Trưởng Phòng Sale", "Phòng Kinh Doanh", "EMP-003", "sales_manager@gmail.com", "0988000003");
            createStaffUser("sale_staff_1", defaultPassword, "ROLE_SALES_STAFF", "Phạm Nhân Viên Sale", "Phòng Kinh Doanh", "EMP-004", "salestaff@gmail.com", "0988000004");
            createStaffUser("warehouse_manager", defaultPassword, "ROLE_WAREHOUSE_MANAGER", "Hoàng Thủ Kho", "Phòng Kho", "EMP-005", "locchac5@gmail.com", "0988000005");
            createStaffUser("production_manager", defaultPassword, "ROLE_PRODUCTION_MANAGER", "Đinh Quản Đốc", "Xưởng Sản Xuất", "EMP-006", "production@gmail.com", "0988000006");
            createStaffUser("accountant", defaultPassword, "ROLE_ACCOUNTANT", "Vũ Kế Toán", "Phòng Kế Toán", "EMP-007", "accountant@gmail.com", "0988000007");

            System.out.println("-> Đã tạo 7 User nội bộ và các hồ sơ Staff thành công!");
        }

        // 3. TẠO KHÁCH HÀNG (CRM MẪU) ĐỘC LẬP
        if (customerRepository.count() == 0) {
            createCustomer("Công ty TNHH Khách Hàng VIP", "vip@gmail.com", "0911222333", "123 Đường ABC, Hà Nội", "0101234567", new BigDecimal("50000000"));
            createCustomer("Anh Tuấn Mua Lẻ", "tuan.anh@gmail.com", "0988777666", "456 Phố XYZ, HCM", null, BigDecimal.ZERO);
            System.out.println("-> Đã tạo 2 Khách hàng CRM mẫu.");
        }

        // 4. TẠO VẬT TƯ & THÀNH PHẨM (Bơm nhiều Data để test cảnh báo)
        if (materialRepository.count() == 0) {
            // Nhóm 1: Vật tư dồi dào (An toàn - Xanh)
            Material m1 = new Material();
            m1.setName("Gỗ Sồi Nga");
            m1.setSku("MAT-WOOD-001");
            m1.setUnit("Khối");
            m1.setMinStockLevel(50);
            m1.setCurrentStock(500);
            m1.setActive(true);
            m1.setDescription("Gỗ tấm nguyên khối nhập khẩu, dùng để làm mặt bàn cao cấp.");
            materialRepository.save(m1);

            Material m2 = new Material();
            m2.setName("Đinh ốc 5 phân");
            m2.setSku("MAT-IRON-002");
            m2.setUnit("Hộp");
            m2.setMinStockLevel(100);
            m2.setCurrentStock(200);
            m2.setActive(true);
            m2.setDescription("Đinh ốc Lỏ.");
            materialRepository.save(m2);

            // Nhóm 2: Vật tư sắp hết (Cảnh báo - Đỏ)
            Material m3 = new Material();
            m3.setName("Sơn phủ bóng PU");
            m3.setSku("MAT-PAINT-003");
            m3.setUnit("Lít");
            m3.setMinStockLevel(50);
            m3.setCurrentStock(15); // Tồn < Ngưỡng
            m3.setActive(true);
            m3.setDescription("Sơn Trộm Của Sơn lại cuộc đời.");
            materialRepository.save(m3);

            Material m4 = new Material();
            m4.setName("Keo dán gỗ chuyên dụng");
            m4.setSku("MAT-GLUE-004");
            m4.setUnit("Hũ");
            m4.setMinStockLevel(20);
            m4.setCurrentStock(5); // Tồn < Ngưỡng
            m4.setActive(true);
            m4.setDescription("Keo con chó.");
            materialRepository.save(m4);

            // Nhóm 3: Vật tư ngừng sử dụng (Test Soft Delete - Ẩn)
            Material m5 = new Material();
            m5.setName("Vải nỉ cũ (Mẫu 2024)");
            m5.setSku("MAT-FABRIC-005");
            m5.setUnit("Cuộn");
            m5.setMinStockLevel(0);
            m5.setCurrentStock(0);
            m5.setActive(false);
            m5.setDescription("Vải nỉ đã ngừng sử dụng, chỉ để lại làm mẫu test xóa mềm.");
            materialRepository.save(m5);

            System.out.println("-> Đã tạo 5 Nguyên vật liệu mẫu (Đủ kịch bản Xanh/Đỏ/Ẩn).");
        }

        if (productRepository.count() == 0) {
            Product p1 = new Product();
            p1.setName("Bàn làm việc Gỗ Sồi");
            p1.setSku("SP-BAN-001");
            p1.setSellingPrice(new BigDecimal("1500000"));
            p1.setCurrentStock(15);
            p1.setUnit("Cái");
            p1.setDescription("Bàn làm việc mặt gỗ sồi nguyên khối");
            p1.setImageUrl("https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?q=80&w=800&auto=format&fit=crop");
            productRepository.save(p1);

            System.out.println("-> Đã tạo 1 Thành phẩm mẫu.");
        }

        // 4.1 TẠO NHÀ CUNG CẤP & NỐI VỚI VẬT TƯ (BẢNG TRUNG GIAN)
        if (supplierRepository.count() == 0) {
            // Tạo 1 ông Nhà cung cấp xịn
            Supplier sup1 = new Supplier();
            sup1.setName("Công ty TNHH Gỗ Trường Thành");
            sup1.setContactInfo("0909123456 - KCN Sóng Thần, Bình Dương");
            supplierRepository.save(sup1);

            // Tìm lại ông "Gỗ Sồi Nga" vừa tạo ở trên
            Material goSoi = materialRepository.findAll().stream()
                    .filter(m -> m.getName().equals("Gỗ Sồi Nga"))
                    .findFirst()
                    .orElse(null);

            // Tiến hành nối dây và báo giá nhập
            if (goSoi != null) {
                SupplierMaterial sm = new SupplierMaterial();
                sm.setSupplier(sup1);
                sm.setMaterial(goSoi);
                sm.setPurchasePrice(new BigDecimal("12000000")); // Giá nhập: 12 củ/khối
                supplierMaterialRepository.save(sm);
            }

            System.out.println("-> Đã tạo Nhà cung cấp và nối với Gỗ Sồi Nga thành công!");
        }

// 👉 4.2 TẠO ĐỊNH MỨC SẢN XUẤT (BOM) MẪU
        if (billOfMaterialRepository.count() == 0) {
            Product banLamViec = productRepository.findAll().stream()
                    .filter(p -> p.getSku().equals("SP-BAN-001")).findFirst().orElse(null);

            Material goSoi = materialRepository.findAll().stream()
                    .filter(m -> m.getSku().equals("MAT-WOOD-001")).findFirst().orElse(null);

            Material dinhOc = materialRepository.findAll().stream()
                    .filter(m -> m.getSku().equals("MAT-IRON-002")).findFirst().orElse(null);

            Material keoDan = materialRepository.findAll().stream()
                    .filter(m -> m.getSku().equals("MAT-GLUE-004")).findFirst().orElse(null);

            if (banLamViec != null && goSoi != null && dinhOc != null && keoDan != null) {

                // ==========================================
                // 🛑 BOM SỐ 1: ĐÃ DUYỆT (Dùng để test chặn Edit)
                // ==========================================
                BillOfMaterial bom1 = new BillOfMaterial();
                bom1.setProduct(banLamViec);
                bom1.setVersion("1.0");
                bom1.setIsApproved(true); // Đã duyệt
                bom1.setIsActive(true);

                BillOfMaterialDetail detail1 = new BillOfMaterialDetail();
                detail1.setMaterial(goSoi);
                detail1.setQuantityRequired(new BigDecimal("0.5000"));
                bom1.addBomDetail(detail1);

                BillOfMaterialDetail detail2 = new BillOfMaterialDetail();
                detail2.setMaterial(dinhOc);
                detail2.setQuantityRequired(new BigDecimal("20.0000"));
                bom1.addBomDetail(detail2);

                billOfMaterialRepository.save(bom1);

                // ==========================================
                // 🟢 BOM SỐ 2: BẢN NHÁP (Dùng để test Edit thành công và Approve)
                // ==========================================
                BillOfMaterial bom2 = new BillOfMaterial();
                bom2.setProduct(banLamViec);
                bom2.setVersion("2.0-DRAFT");
                bom2.setIsApproved(false); // 👉 CHƯA DUYỆT (Được phép Edit)
                bom2.setIsActive(true);

                // Bản nháp này mới chỉ có Gỗ, chưa có Đinh và Keo
                BillOfMaterialDetail detail2_1 = new BillOfMaterialDetail();
                detail2_1.setMaterial(goSoi);
                detail2_1.setQuantityRequired(new BigDecimal("0.4500")); // Thử giảm gỗ xuống
                bom2.addBomDetail(detail2_1);

                billOfMaterialRepository.save(bom2);

                System.out.println("-> Đã tạo 2 Định mức (1 Đã duyệt, 1 Bản nháp) cho Bàn Gỗ Sồi thành công!");
            }
        }

        // 5. TẠO PHIẾU KHO MẪU ĐỂ TEST API (BẢN NÂNG CẤP NHIỀU DATA)
        if (warehouseTransactionRepository.count() == 0) {
            Staff thuKho = staffRepository.findAll().stream()
                    .filter(s -> s.getUser().getUsername().equals("warehouse_manager"))
                    .findFirst()
                    .orElse(null);

            Product banLamViec = productRepository.findAll().stream().findFirst().orElse(null);
            Material goSoi = materialRepository.findAll().stream().findFirst().orElse(null);

            if (thuKho != null && banLamViec != null && goSoi != null) {

                // --- 1. TẠO 1 PHIẾU NHẬP KHO VẬT TƯ TRƯỚC ---
                WarehouseTransaction phieuNhap = new WarehouseTransaction();
                phieuNhap.setType(TransactionType.IMPORT);
                phieuNhap.setReferenceId("PO-SUPPLIER-999");
                phieuNhap.setDate(java.time.LocalDateTime.now().minusDays(10));
                phieuNhap.setStaff(thuKho);

                TransactionDetail chiTietNhap = new TransactionDetail();
                chiTietNhap.setWarehouseTransaction(phieuNhap);
                chiTietNhap.setMaterial(goSoi);
                chiTietNhap.setQuantity(500);

                phieuNhap.setDetails(List.of(chiTietNhap));
                warehouseTransactionRepository.save(phieuNhap);

                // --- 2. DÙNG VÒNG LẶP ĐẺ RA 15 PHIẾU XUẤT KHO ---
                for (int i = 1; i <= 15; i++) {
                    WarehouseTransaction phieuXuat = new WarehouseTransaction();
                    phieuXuat.setType(TransactionType.EXPORT);

                    if (i % 3 == 0) {
                        phieuXuat.setReferenceId("SO-VIP-2026-00" + i);
                    } else {
                        phieuXuat.setReferenceId("SO-NORMAL-2026-00" + i);
                    }

                    phieuXuat.setDate(java.time.LocalDateTime.now().minusHours(i));
                    phieuXuat.setStaff(thuKho);

                    TransactionDetail chiTietXuat = new TransactionDetail();
                    chiTietXuat.setWarehouseTransaction(phieuXuat);
                    chiTietXuat.setProduct(banLamViec);
                    chiTietXuat.setQuantity(i);

                    phieuXuat.setDetails(List.of(chiTietXuat));
                    warehouseTransactionRepository.save(phieuXuat);
                }

                System.out.println("-> Đã tạo 1 Phiếu Nhập và 15 Phiếu Xuất kho mẫu thành công (Sẵn sàng test Phân trang)!");
            }
        }

        System.out.println("=== KẾT THÚC SEEDER ===");
    }

    private void createStaffUser(String username, String encodedPassword, String roleName, String fullName, String department, String employeeId, String email, String phoneNumber) {
        Role role = roleRepository.findByRoleName(roleName)
                .orElseThrow(() -> new RuntimeException("Lỗi Seeder: Không tìm thấy Role " + roleName));

        User user = new User();
        user.setUsername(username);
        user.setPassword(encodedPassword);
        user.setRole(role);
        user.setEmail(email);
        User savedUser = userRepository.save(user);

        Staff staff = new Staff();
        staff.setUser(savedUser);
        staff.setFullname(fullName);
        staff.setDepartment(department);
        staff.setEmployeeId(employeeId);
        staff.setPhoneNumber(phoneNumber);
        staffRepository.save(staff);
    }

    private void createCustomer(String name, String email, String phone, String address, String taxCode, BigDecimal creditLimit) {
        Customer customer = new Customer();
        customer.setName(name);
        customer.setEmail(email);
        customer.setPhoneNumber(phone);
        customer.setAddress(address);
        customer.setTaxCode(taxCode);
        customer.setCreditLimit(creditLimit);
        customer.setCurrentDebt(BigDecimal.ZERO);
        customerRepository.save(customer);
    }
}