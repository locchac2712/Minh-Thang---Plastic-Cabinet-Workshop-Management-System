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

        // 1. ROLES
        List<String> roles = List.of("ROLE_ADMIN", "ROLE_DIRECTOR", "ROLE_SALES_MANAGER", "ROLE_SALES_STAFF", "ROLE_WAREHOUSE_MANAGER", "ROLE_PRODUCTION_MANAGER", "ROLE_ACCOUNTANT");
        for (String roleName : roles) {
            if (!roleRepository.existsByRoleName(roleName)) {
                Role role = new Role(); role.setRoleName(roleName); roleRepository.save(role);
            }
        }

        // 2. STAFF & USERS
        if (userRepository.count() == 0) {
            String pass = passwordEncoder.encode("123456");
            createStaffUser("admin", pass, "ROLE_ADMIN", "Nguyễn Quản Trị", "Ban Giám Đốc", "EMP-001", "admin@gmail.com", "0988000001");
            createStaffUser("director", pass, "ROLE_DIRECTOR", "Trần Giám Đốc", "Ban Giám Đốc", "EMP-002", "director@gmail.com", "0988000002");
            createStaffUser("sales_manager", pass, "ROLE_SALES_MANAGER", "Lê Trưởng Phòng Sale", "Kinh Doanh", "EMP-003", "sales@gmail.com", "0988000003");
            createStaffUser("sale_staff_1", pass, "ROLE_SALES_STAFF", "Phạm Nhân Viên Sale", "Kinh Doanh", "EMP-004", "staff@gmail.com", "0988000004");
            createStaffUser("production_manager", pass, "ROLE_PRODUCTION_MANAGER", "Vũ Quản Lý Sản Xuất", "Sản Xuất", "EMP-005", "production@gmail.com", "0988000005");
        }

        // 3. CUSTOMERS
        if (customerRepository.count() == 0) {
            createCustomer("Công ty TNHH Khách Hàng VIP", "vip@gmail.com", "0911222333", "Hà Nội", "0101234567", new BigDecimal("50000000"));
            createCustomer("Anh Tuấn Mua Lẻ", "tuan@gmail.com", "0988777666", "HCM", null, BigDecimal.ZERO);
            createCustomer("Khách Nợ Xấu (Over Credit)", "bad@gmail.com", "0900000666", "Hải Phòng", "0109998887", new BigDecimal("10000000"));
            
            Customer badPayer = customerRepository.findAll().stream().filter(c -> c.getName().contains("Nợ Xấu")).findFirst().orElse(null);
            if (badPayer != null) {
                badPayer.setCurrentDebt(new BigDecimal("25000000"));
                customerRepository.save(badPayer);
            }
        }

        // 4. MATERIALS (Vật tư & Nguyên liệu)
        if (materialRepository.count() == 0) {
            createMaterial("Hạt nhựa PP (Polypropylene)",    "VT-PP-001",   "Kg",  new BigDecimal("32000"),   500, 100, "Hạt nhựa PP nguyên sinh, dùng sản xuất tủ nhựa chịu lực");
            createMaterial("Hạt nhựa ABS",                  "VT-ABS-001",  "Kg",  new BigDecimal("55000"),   300, 80,  "Nhựa ABS cao cấp, độ bền va đập cao");
            createMaterial("Hạt nhựa PVC cứng",             "VT-PVC-001",  "Kg",  new BigDecimal("28000"),   400, 120, "PVC cứng dùng làm khung tủ");
            createMaterial("Hạt nhựa HDPE",                 "VT-HDPE-001", "Kg",  new BigDecimal("30000"),   250, 60,  "Nhựa HDPE chống ẩm, dùng cho tủ ngoài trời");
            createMaterial("Bột màu trắng Titanium",        "VT-MAU-001",  "Kg",  new BigDecimal("85000"),   50,  15,  "Bột màu trắng TiO2 dùng pha màu nhựa");
            createMaterial("Bột màu xanh dương",            "VT-MAU-002",  "Kg",  new BigDecimal("92000"),   30,  10,  "Bột màu xanh dương công nghiệp");
            createMaterial("Bột màu nâu gỗ",               "VT-MAU-003",  "Kg",  new BigDecimal("78000"),   40,  10,  "Bột màu nâu giả gỗ cho tủ nhựa vân gỗ");
            createMaterial("Bột màu xám đậm",              "VT-MAU-004",  "Kg",  new BigDecimal("80000"),   25,  8,   "Bột màu xám đậm công nghiệp");
            createMaterial("Bản lề nhựa 50mm",              "VT-BL-001",   "Cái", new BigDecimal("3500"),    2000, 500, "Bản lề nhựa cường lực cho cánh tủ");
            createMaterial("Tay nắm tủ nhựa",               "VT-TN-001",   "Cái", new BigDecimal("5000"),    1500, 300, "Tay nắm nhựa mạ chrome dùng cho cửa tủ");
            createMaterial("Ốc vít inox M4x20",             "VT-OV-001",   "Hộp", new BigDecimal("45000"),   200, 50,  "Hộp 100 ốc vít inox M4x20mm");
            createMaterial("Ốc vít inox M5x30",             "VT-OV-002",   "Hộp", new BigDecimal("55000"),   150, 40,  "Hộp 100 ốc vít inox M5x30mm");
            createMaterial("Keo dán nhựa đa năng",          "VT-KEO-001",  "Lít", new BigDecimal("120000"),  80,  20,  "Keo dán nhựa công nghiệp, kết dính mạnh");
            createMaterial("Chân tủ nhựa điều chỉnh",       "VT-CT-001",   "Cái", new BigDecimal("8000"),    800, 200, "Chân tủ nhựa có thể điều chỉnh chiều cao");
            createMaterial("Thanh ray trượt ngăn kéo 400mm","VT-RAY-001",  "Bộ",  new BigDecimal("35000"),   300, 80,  "Ray trượt bi 3 tầng cho ngăn kéo tủ");
            createMaterial("Gioăng cao su chống nước",       "VT-GS-001",   "Mét", new BigDecimal("12000"),   500, 100, "Gioăng cao su dùng cho tủ chống ẩm");
            createMaterial("Màng co PE bọc sản phẩm",       "VT-PE-001",   "Cuộn",new BigDecimal("95000"),   60,  15,  "Cuộn màng co PE 50cm x 300m dùng đóng gói");
            createMaterial("Thùng carton đóng gói (lớn)",   "VT-CTN-001",  "Cái", new BigDecimal("18000"),   400, 100, "Thùng carton 5 lớp, kích thước 80x50x60cm");
            createMaterial("Phụ gia chống UV",               "VT-UV-001",   "Kg",  new BigDecimal("150000"),  20,  5,   "Phụ gia UV Stabilizer cho sản phẩm ngoài trời");
            createMaterial("Phụ gia tăng độ bền",            "VT-PG-001",   "Kg",  new BigDecimal("130000"),  30,  8,   "Phụ gia Impact Modifier tăng chịu va đập");
            System.out.println("-> Đã tạo 20 Vật tư mẫu thành công!");
        }

        // 5. PRODUCTS
        if (productRepository.count() == 0) {
            Product p1 = new Product(); p1.setName("Bàn làm việc Gỗ Sồi"); p1.setSku("SP-BAN-001"); p1.setSellingPrice(new BigDecimal("2500000")); p1.setCurrentStock(15); p1.setUnit("Cái"); productRepository.save(p1);
            Product p2 = new Product(); p2.setName("Ghế xoay văn phòng"); p2.setSku("SP-GHE-001"); p2.setSellingPrice(new BigDecimal("850000")); p2.setCurrentStock(50); p2.setUnit("Cái"); productRepository.save(p2);
        }

        // 5. QUOTATIONS
        if (quotationRepository.count() < 10) {
            List<Customer> customers = customerRepository.findAll();
            Staff staff = staffRepository.findAll().stream().filter(s -> s.getUser().getRole().getRoleName().contains("SALE")).findFirst().orElse(null);
            Product p1 = productRepository.findAll().get(0);
            
            if (!customers.isEmpty() && staff != null) {
                java.util.Random rnd = new java.util.Random();
                for (int i = 1; i <= 21; i++) {
                    Quotation q = new Quotation();
                    q.setCustomer(customers.get(rnd.nextInt(customers.size())));
                    q.setStaff(staff);
                    q.setValidUntil(java.time.LocalDateTime.now().plusDays(rnd.nextInt(30)));
                    q.setStatus(i % 5 == 0 ? "ACCEPTED" : (i % 4 == 0 ? "REJECTED" : "SENT"));
                    q.setNote("Dữ liệu mẫu số " + i);
                    
                    q.setQuotationNumber("TEMP-" + UUID.randomUUID().toString().substring(0,8));
                    q = quotationRepository.save(q);
                    q.setQuotationNumber("BG-2026-" + String.format("%04d", q.getId()));

                    QuotationDetail d = new QuotationDetail();
                    d.setProduct(p1); d.setQuantity(rnd.nextInt(10) + 1); d.setUnitPrice(p1.getSellingPrice());
                    d.setDiscount(BigDecimal.ZERO); d.setTotalLineAmount(d.getUnitPrice().multiply(new BigDecimal(d.getQuantity())));
                    q.addDetail(d);
                    q.setTotalAmount(d.getTotalLineAmount());
                    quotationRepository.save(q);
                }
                System.out.println("-> Đã tạo 21 Báo giá mẫu thành công!");
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
        Staff staff = new Staff(); staff.setUser(savedUser); staff.setFullName(fullName); staff.setDepartment(department); staff.setEmployeeId(employeeId); staff.setPhoneNumber(phoneNumber);
        staffRepository.save(staff);
    }

    private void createCustomer(String name, String email, String phone, String address, String taxCode, BigDecimal creditLimit) {
        Customer customer = new Customer(); customer.setName(name); customer.setEmail(email); customer.setPhoneNumber(phone); customer.setAddress(address); customer.setTaxCode(taxCode); customer.setCreditLimit(creditLimit); customer.setCurrentDebt(BigDecimal.ZERO);
        customerRepository.save(customer);
    }

    private void createMaterial(String name, String sku, String unit, BigDecimal avgCost, int stock, int minStock, String description) {
        Material m = new Material();
        m.setName(name);
        m.setSku(sku);
        m.setUnit(unit);
        m.setAverageUnitCost(avgCost);
        m.setCurrentStock(stock);
        m.setMinStockLevel(minStock);
        m.setDescription(description);
        m.setIsActive(true);
        materialRepository.save(m);
    }
}