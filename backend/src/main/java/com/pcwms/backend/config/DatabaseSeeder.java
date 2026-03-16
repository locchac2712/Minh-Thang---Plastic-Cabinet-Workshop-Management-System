package com.pcwms.backend.config;

import com.pcwms.backend.entity.*;
import com.pcwms.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

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
    @Autowired
    private BillOfMaterialRepository billOfMaterialRepository;
    @Autowired
    private QuotationRepository quotationRepository;
    @Autowired
    private SalesOrderRepository salesOrderRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        System.out.println("=== BẮT ĐẦU KIỂM TRA & TẠO DỮ LIỆU MẪU ===");

        // ==========================================
        // 1. TẠO DANH SÁCH QUYỀN (ROLES)
        // ==========================================
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

        // ==========================================
        // 2. TẠO TÀI KHOẢN VÀ HỒ SƠ NHÂN VIÊN NỘI BỘ
        // ==========================================
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

        // ==========================================
        // 3. TẠO KHÁCH HÀNG (CRM)
        // ==========================================
        if (customerRepository.count() == 0) {
            createCustomer("Công ty TNHH Khách Hàng VIP", "vip@gmail.com", "0911222333", "123 Đường ABC, Hà Nội", "0101234567", new BigDecimal("50000000"));
            createCustomer("Anh Tuấn Mua Lẻ", "tuan.anh@gmail.com", "0988777666", "456 Phố XYZ, HCM", null, BigDecimal.ZERO);
            System.out.println("-> Đã tạo 2 Khách hàng CRM mẫu.");
        }

        // ==========================================
        // 4. TẠO VẬT TƯ (MATERIALS) - Bổ sung setIsActive(true)
        // ==========================================
        if (materialRepository.count() == 0) {
            Material m1 = new Material(); m1.setName("Gỗ Sồi Nga"); m1.setSku("MAT-WOOD-001"); m1.setUnit("Khối"); m1.setMinStockLevel(50); m1.setCurrentStock(500); m1.setAverageUnitCost(new BigDecimal("10000000")); m1.setIsActive(true); materialRepository.save(m1);
            Material m2 = new Material(); m2.setName("Đinh ốc 5 phân"); m2.setSku("MAT-IRON-002"); m2.setUnit("Hộp"); m2.setMinStockLevel(100); m2.setCurrentStock(200); m2.setAverageUnitCost(new BigDecimal("50000")); m2.setIsActive(true); materialRepository.save(m2);
            Material m3 = new Material(); m3.setName("Sơn phủ bóng PU"); m3.setSku("MAT-PAINT-003"); m3.setUnit("Lít"); m3.setMinStockLevel(50); m3.setCurrentStock(15); m3.setAverageUnitCost(new BigDecimal("120000")); m3.setIsActive(true); materialRepository.save(m3);
            Material m4 = new Material(); m4.setName("Keo dán gỗ chuyên dụng"); m4.setSku("MAT-GLUE-004"); m4.setUnit("Hũ"); m4.setMinStockLevel(20); m4.setCurrentStock(5); m4.setAverageUnitCost(new BigDecimal("80000")); m4.setIsActive(true); materialRepository.save(m4);
            Material m5 = new Material(); m5.setName("Gỗ Công Nghiệp MDF"); m5.setSku("MAT-WOOD-005"); m5.setUnit("Tấm"); m5.setMinStockLevel(100); m5.setCurrentStock(300); m5.setAverageUnitCost(new BigDecimal("450000")); m5.setIsActive(true); materialRepository.save(m5);
            System.out.println("-> Đã tạo 5 Nguyên vật liệu mẫu.");
        }

        // ==========================================
        // 5. TẠO THÀNH PHẨM VÀ ĐỊNH MỨC (PRODUCT & BOM)
        // ==========================================
        if (productRepository.count() == 0 && billOfMaterialRepository.count() == 0) {
            Material goSoi = materialRepository.findAll().stream().filter(m -> m.getSku().equals("MAT-WOOD-001")).findFirst().orElse(null);
            Material dinhOc = materialRepository.findAll().stream().filter(m -> m.getSku().equals("MAT-IRON-002")).findFirst().orElse(null);
            Material sonPU = materialRepository.findAll().stream().filter(m -> m.getSku().equals("MAT-PAINT-003")).findFirst().orElse(null);
            Material keoDan = materialRepository.findAll().stream().filter(m -> m.getSku().equals("MAT-GLUE-004")).findFirst().orElse(null);
            Material goMDF = materialRepository.findAll().stream().filter(m -> m.getSku().equals("MAT-WOOD-005")).findFirst().orElse(null);

            // --- SẢN PHẨM 1: BÀN GỖ SỒI ---
            Product p1 = new Product();
            p1.setName("Bàn làm việc Gỗ Sồi"); p1.setSku("SP-BAN-001"); p1.setSellingPrice(new BigDecimal("2500000"));
            p1.setCurrentStock(15); p1.setUnit("Cái"); p1.setImageUrl("https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?q=80&w=800&auto=format&fit=crop");
            productRepository.save(p1);

            BillOfMaterial bom1 = new BillOfMaterial(); bom1.setProduct(p1); bom1.setVersion("1.0"); bom1.setIsActive(true);
            if (goSoi != null && dinhOc != null && sonPU != null) {
                bom1.addBomDetail(createBomDetail(goSoi, "0.2"));
                bom1.addBomDetail(createBomDetail(dinhOc, "0.5"));
                bom1.addBomDetail(createBomDetail(sonPU, "1.5"));
                billOfMaterialRepository.save(bom1);
            }

            // --- SẢN PHẨM 2: GHẾ XOAY ---
            Product p2 = new Product();
            p2.setName("Ghế xoay văn phòng cao cấp"); p2.setSku("SP-GHE-001"); p2.setSellingPrice(new BigDecimal("850000"));
            p2.setCurrentStock(50); p2.setUnit("Cái"); p2.setImageUrl("https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?q=80&w=800&auto=format&fit=crop");
            productRepository.save(p2);

            BillOfMaterial bom2 = new BillOfMaterial(); bom2.setProduct(p2); bom2.setVersion("1.0"); bom2.setIsActive(true);
            if (goMDF != null && dinhOc != null && keoDan != null) {
                bom2.addBomDetail(createBomDetail(goMDF, "0.5"));
                bom2.addBomDetail(createBomDetail(dinhOc, "0.2"));
                bom2.addBomDetail(createBomDetail(keoDan, "0.1"));
                billOfMaterialRepository.save(bom2);
            }

            // --- SẢN PHẨM 3: TỦ HỒ SƠ ---
            Product p3 = new Product();
            p3.setName("Tủ hồ sơ 3 buồng Gỗ Công Nghiệp"); p3.setSku("SP-TU-002"); p3.setSellingPrice(new BigDecimal("3200000"));
            p3.setCurrentStock(10); p3.setUnit("Cái"); p3.setImageUrl("https://images.unsplash.com/photo-1595514535415-ebc0ee5dbdb8?q=80&w=800&auto=format&fit=crop");
            productRepository.save(p3);

            BillOfMaterial bom3 = new BillOfMaterial(); bom3.setProduct(p3); bom3.setVersion("1.0"); bom3.setIsActive(true);
            if (goMDF != null && dinhOc != null && keoDan != null && sonPU != null) {
                bom3.addBomDetail(createBomDetail(goMDF, "4.0"));
                bom3.addBomDetail(createBomDetail(dinhOc, "2.0"));
                bom3.addBomDetail(createBomDetail(keoDan, "1.0"));
                bom3.addBomDetail(createBomDetail(sonPU, "3.0"));
                billOfMaterialRepository.save(bom3);
            }

            System.out.println("-> Đã tạo 3 Thành phẩm đi kèm 3 bộ Định mức (BOM) chuẩn xác!");
        }

        // ==========================================
        // 6. TẠO NHÀ CUNG CẤP
        // ==========================================
        if (supplierRepository.count() == 0) {
            Supplier sup1 = new Supplier();
            sup1.setName("Công ty TNHH Gỗ Trường Thành");
            sup1.setContactPerson("Nguyễn Văn Trường");
            sup1.setPhoneNumber("0909123456");
            sup1.setEmail("contact@gotruongthanh.vn");
            sup1.setAddress("KCN Sóng Thần, Bình Dương");
            sup1.setStatus("ACTIVE");
            supplierRepository.save(sup1);

            Material goSoi = materialRepository.findAll().stream().filter(m -> m.getName().equals("Gỗ Sồi Nga")).findFirst().orElse(null);
            if (goSoi != null) {
                SupplierMaterial sm = new SupplierMaterial();
                sm.setSupplier(sup1);
                sm.setMaterial(goSoi);
                sm.setPurchasePrice(new BigDecimal("12000000"));
                supplierMaterialRepository.save(sm);
            }
            System.out.println("-> Đã tạo Nhà cung cấp mẫu.");
        }

        // ==========================================
        // 7. TẠO BÁO GIÁ MẪU (QUOTATION) CHUẨN MÃ UI
        // ==========================================
        if (quotationRepository.count() == 0) {
            Customer vipCustomer = customerRepository.findAll().stream().filter(c -> c.getName().contains("VIP")).findFirst().orElse(null);
            Staff saleStaff = staffRepository.findAll().stream().filter(s -> s.getUser().getUsername().equals("sale_staff_1")).findFirst().orElse(null);
            Product banSoi = productRepository.findAll().stream().filter(p -> p.getSku().equals("SP-BAN-001")).findFirst().orElse(null);
            Product gheXoay = productRepository.findAll().stream().filter(p -> p.getSku().equals("SP-GHE-001")).findFirst().orElse(null);

            if (vipCustomer != null && saleStaff != null && banSoi != null && gheXoay != null) {
                Quotation q1 = new Quotation();

                String year = String.valueOf(java.time.LocalDateTime.now().getYear());
                int randomNum = 1000 + new java.util.Random().nextInt(9000);
                q1.setQuotationNumber("BG-" + year + "-" + randomNum);

                q1.setCustomer(vipCustomer);
                q1.setStaff(saleStaff);
                q1.setValidUntil(java.time.LocalDateTime.now().plusDays(15));
                q1.setNote("Báo giá setup văn phòng mới, đã áp dụng chiết khấu 10% cho Bàn làm việc.");
                q1.setStatus("DRAFT");

                BigDecimal grandTotal = BigDecimal.ZERO;

                QuotationDetail d1 = new QuotationDetail();
                d1.setProduct(banSoi);
                d1.setQuantity(5);
                d1.setUnitPrice(banSoi.getSellingPrice());
                BigDecimal basePrice1 = banSoi.getSellingPrice().multiply(new BigDecimal(5));
                BigDecimal discount1 = basePrice1.multiply(new BigDecimal("0.10"));
                d1.setDiscount(discount1);
                BigDecimal lineTotal1 = basePrice1.subtract(discount1);
                d1.setTotalLineAmount(lineTotal1);
                q1.addDetail(d1);
                grandTotal = grandTotal.add(lineTotal1);

                QuotationDetail d2 = new QuotationDetail();
                d2.setProduct(gheXoay);
                d2.setQuantity(10);
                d2.setUnitPrice(gheXoay.getSellingPrice());
                d2.setDiscount(BigDecimal.ZERO);
                BigDecimal lineTotal2 = gheXoay.getSellingPrice().multiply(new BigDecimal(10));
                d2.setTotalLineAmount(lineTotal2);
                q1.addDetail(d2);
                grandTotal = grandTotal.add(lineTotal2);

                q1.setTotalAmount(grandTotal);
                quotationRepository.save(q1);

                System.out.println("-> Đã tạo 1 Báo giá (Quotation) chuẩn Form UI thành công!");
            }
        }

        // =========================================================
        // 🚀 SEEDER: TẠO DỮ LIỆU ĐƠN HÀNG MẪU (SALES ORDERS)
        // =========================================================
        if (salesOrderRepository.count() == 0) {
            System.out.println("⏳ Đang tạo dữ liệu Đơn hàng mẫu...");

            // Lấy tạm Khách hàng VIP và 2 Sản phẩm có sẵn trong DB (Bàn và Ghế)
            // LƯU Ý: Đảm bảo Customer ID=1 và Product ID=1, ID=2 đã được tạo ở trên rồi nhé.
            Customer customerVIP = customerRepository.findById(1L).orElse(null);
            Product banGo = productRepository.findById(1L).orElse(null);
            Product gheXoay = productRepository.findById(2L).orElse(null);

            if (customerVIP != null && banGo != null && gheXoay != null) {

                // 📦 ĐƠN HÀNG SỐ 1: Đơn mới tinh, Khách chưa trả tiền (Cho Kế toán vào đòi nợ)
                SalesOrder order1 = new SalesOrder();
                order1.setOrderNumber("SO-2026-1001");
                order1.setCustomer(customerVIP);
                order1.setCreatedDate(java.time.LocalDateTime.now().minusDays(2)); // Đặt cách đây 2 ngày
                order1.setStatus("PENDING");
                order1.setPaymentStatus("UNPAID");

                // Mua 5 cái bàn Sồi
                SalesOrderDetail detail1_1 = new SalesOrderDetail();
                detail1_1.setProduct(banGo);
                detail1_1.setQuantity(5);
                detail1_1.setUnitPrice(new java.math.BigDecimal("2500000"));
                detail1_1.setDiscount(new java.math.BigDecimal("0"));
                order1.addDetail(detail1_1);

                order1.setTotalAmount(detail1_1.getTotalLineAmount());
                salesOrderRepository.save(order1);


                // 📦 ĐƠN HÀNG SỐ 2: Khách sộp, đã thanh toán, Xưởng đang làm (Cho Xưởng xem)
                SalesOrder order2 = new SalesOrder();
                order2.setOrderNumber("SO-2026-9999");
                order2.setCustomer(customerVIP);
                order2.setCreatedDate(java.time.LocalDateTime.now());
                order2.setStatus("PROCESSING"); // Xưởng đang làm
                order2.setPaymentStatus("PAID"); // Đã thanh toán 100%

                // Mua 10 cái Ghế và 2 cái Bàn (Có giảm giá)
                SalesOrderDetail detail2_1 = new SalesOrderDetail();
                detail2_1.setProduct(gheXoay);
                detail2_1.setQuantity(10);
                detail2_1.setUnitPrice(new java.math.BigDecimal("850000"));
                detail2_1.setDiscount(new java.math.BigDecimal("0"));
                order2.addDetail(detail2_1);

                SalesOrderDetail detail2_2 = new SalesOrderDetail();
                detail2_2.setProduct(banGo);
                detail2_2.setQuantity(2);
                detail2_2.setUnitPrice(new java.math.BigDecimal("2500000"));
                detail2_2.setDiscount(new java.math.BigDecimal("500000")); // Giảm 500k
                order2.addDetail(detail2_2);

                java.math.BigDecimal total2 = detail2_1.getTotalLineAmount().add(detail2_2.getTotalLineAmount());
                order2.setTotalAmount(total2);
                salesOrderRepository.save(order2);

                System.out.println("✅ Đã tạo xong 2 Đơn hàng mẫu!");
            }
        }

        // ==========================================
        // 8. TẠO PHIẾU KHO MẪU (WAREHOUSE TRANSACTIONS)
        // ==========================================
        if (warehouseTransactionRepository.count() == 0) {
            Staff thuKho = staffRepository.findAll().stream().filter(s -> s.getUser().getUsername().equals("warehouse_manager")).findFirst().orElse(null);
            Product banLamViec = productRepository.findAll().stream().findFirst().orElse(null);
            Material goSoi = materialRepository.findAll().stream().findFirst().orElse(null);

            if (thuKho != null && banLamViec != null && goSoi != null) {
                WarehouseTransaction phieuNhap = new WarehouseTransaction();
                phieuNhap.setType(TransactionType.IMPORT);
                phieuNhap.setReferenceId("PO-SUPPLIER-999");
                phieuNhap.setDate(java.time.LocalDateTime.now().minusDays(10));
                phieuNhap.setStaff(thuKho);
                phieuNhap.setStatus("COMPLETED");

                TransactionDetail chiTietNhap = new TransactionDetail();
                chiTietNhap.setWarehouseTransaction(phieuNhap);
                chiTietNhap.setMaterial(goSoi);
                chiTietNhap.setQuantity(500);
                chiTietNhap.setUnitPrice(goSoi.getAverageUnitCost());
                chiTietNhap.setTotalLineAmount(goSoi.getAverageUnitCost().multiply(new BigDecimal(500)));

                phieuNhap.setDetails(List.of(chiTietNhap));
                warehouseTransactionRepository.save(phieuNhap);

                System.out.println("-> Đã tạo 1 Phiếu Nhập kho mẫu có chứa Đơn giá thành công!");
            }
        }

        System.out.println("=== KẾT THÚC SEEDER ===");
    }

    // ==========================================
    // HÀM HELPER HỖ TRỢ TẠO DỮ LIỆU
    // ==========================================
    private BillOfMaterialDetail createBomDetail(Material material, String quantityStr) {
        BillOfMaterialDetail detail = new BillOfMaterialDetail();
        detail.setMaterial(material);
        detail.setQuantityRequired(new BigDecimal(quantityStr));
        return detail;
    }

    private void createStaffUser(String username, String encodedPassword, String roleName, String fullName, String department, String employeeId, String email, String phoneNumber) {
        Role role = roleRepository.findByRoleName(roleName).orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy Role"));
        User user = new User(); user.setUsername(username); user.setPassword(encodedPassword); user.setRole(role); user.setEmail(email);
        User savedUser = userRepository.save(user);
        Staff staff = new Staff(); staff.setUser(savedUser); staff.setFullname(fullName); staff.setDepartment(department); staff.setEmployeeId(employeeId); staff.setPhoneNumber(phoneNumber);
        staffRepository.save(staff);
    }

    private void createCustomer(String name, String email, String phone, String address, String taxCode, BigDecimal creditLimit) {
        Customer customer = new Customer(); customer.setName(name); customer.setEmail(email); customer.setPhoneNumber(phone); customer.setAddress(address); customer.setTaxCode(taxCode); customer.setCreditLimit(creditLimit); customer.setCurrentDebt(BigDecimal.ZERO);
        customerRepository.save(customer);
    }
}