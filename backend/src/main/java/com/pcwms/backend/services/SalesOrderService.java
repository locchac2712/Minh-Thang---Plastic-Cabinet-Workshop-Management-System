package com.pcwms.backend.services;

import com.pcwms.backend.dto.request.ApprovalRequest;
import com.pcwms.backend.dto.request.SalesOrderDetailRequest;
import com.pcwms.backend.dto.request.SalesOrderRequest;
import com.pcwms.backend.dto.response.SalesOrderDetailResponse;
import com.pcwms.backend.entity.*;
import com.pcwms.backend.repository.CustomerRepository;
import com.pcwms.backend.repository.QuotationRepository;
import com.pcwms.backend.repository.SalesOrderRepository;
import com.pcwms.backend.dto.response.SalesOrderListResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Service // 👉 PHẢI CÓ CÁI NÀY
public class SalesOrderService {

    @Autowired
    private SalesOrderRepository salesOrderRepository;
    @Autowired
    private CustomerRepository customerRepository;
    @Autowired
    private QuotationRepository quotationRepository;
    @Autowired
    private com.pcwms.backend.repository.ProductRepository productRepository;

    // =================================================================
    // 1. API: LẤY DANH SÁCH ĐƠN HÀNG (CÓ TÌM KIẾM & LỌC 2 LỚP)
    // =================================================================
    public Page<SalesOrderListResponse> getAllSalesOrders(String keyword, String statusStr, String paymentStatus, Long customerId, LocalDate startDate, LocalDate endDate, Pageable pageable) {
        String validKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : "";
        String validPaymentStatus = (paymentStatus != null && !paymentStatus.trim().isEmpty()) ? paymentStatus.trim().toUpperCase() : null;

        List<String> statuses = null;
        if (statusStr != null && !statusStr.trim().isEmpty()) {
            statuses = Arrays.stream(statusStr.split(","))
                    .map(String::trim)
                    .map(String::toUpperCase)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList());
        }

        Page<SalesOrder> orderPage = salesOrderRepository.searchSalesOrders(validKeyword, statuses, validPaymentStatus, customerId, startDate, endDate, pageable);
        return orderPage.map(SalesOrderListResponse::new);
    }

    // =================================================================
    // 2. API: TỰ ĐỘNG ĐÚC ĐƠN HÀNG TỪ BÁO GIÁ
    // =================================================================
    // =================================================================
    // API: TỰ ĐỘNG ĐÚC ĐƠN HÀNG TỪ BÁO GIÁ (CÓ KIỂM TRA TÍN DỤNG)
    // =================================================================
    @Transactional
    public SalesOrder generateFromQuotation(Long quotationId) {
        if (quotationId == null) {
            throw new IllegalArgumentException("Lỗi: ID Báo giá không được để trống!");
        }
        Quotation quotation = quotationRepository.findById(quotationId)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy Báo giá ID: " + quotationId));

        if (!"ACCEPTED".equals(quotation.getStatus())) {
            throw new RuntimeException("Lỗi: Báo giá chưa được khách chốt (Trạng thái phải là ACCEPTED)!");
        }

        if (salesOrderRepository.existsByQuotationId(quotationId)) {
            throw new RuntimeException("Lỗi: Báo giá này đã được tạo Đơn Hàng rồi, không thể tạo đúp!");
        }

        SalesOrder order = new SalesOrder();

        // 1. Copy thông tin cơ bản
        Customer customer = quotation.getCustomer();
        order.setCustomer(customer);
        order.setQuotation(quotation);

        String year = String.valueOf(LocalDateTime.now().getYear());
        int randomNum = 1000 + new java.util.Random().nextInt(9000);
        order.setOrderNumber("SO-" + year + "-" + randomNum);

        BigDecimal orderValue = quotation.getTotalAmount();
        order.setTotalAmount(orderValue);
        order.setPaymentStatus("UNPAID");
        order.setCreatedDate(LocalDateTime.now());

        // ==========================================================
        // 🚦 TRẠM KIỂM SOÁT TÍN DỤNG (CREDIT CHECK GATEKEEPER)
        // ==========================================================

        // Lấy dữ liệu tài chính của khách (Phòng hờ null thì gán bằng 0)
        BigDecimal currentDebt = customer.getCurrentDebt() != null ? customer.getCurrentDebt() : BigDecimal.ZERO;
        BigDecimal creditLimit = customer.getCreditLimit() != null ? customer.getCreditLimit() : BigDecimal.ZERO;

        // Dùng compareTo của BigDecimal: 1 là Lớn hơn, 0 là Bằng, -1 là Nhỏ hơn
        if (currentDebt.compareTo(BigDecimal.ZERO) > 0) {
            //  TH1: Khách đang có nợ tồn -> KHÓA ĐƠN NGAY LẬP TỨC
            order.setStatus("PENDING_APPROVAL");
        } else {
            //  TH2: Khách sạch nợ (currentDebt == 0)
            if (orderValue.compareTo(creditLimit) > 0) {
                // 🟡 TH2B: Đơn hàng mới VƯỢT Hạn mức cho phép -> KHÓA ĐƠN
                order.setStatus("PENDING_APPROVAL");
            } else {
                //  TH2A: Đơn hàng NẰM TRONG Hạn mức -> DUYỆT TỰ ĐỘNG
                order.setStatus("WAITING_FOR_DEPOSIT");
            }
        }
        // ==========================================================

        // 2. Copy chi tiết sản phẩm
        for (QuotationDetail qDetail : quotation.getDetails()) {
            SalesOrderDetail oDetail = new SalesOrderDetail();
            oDetail.setProduct(qDetail.getProduct());
            oDetail.setQuantity(qDetail.getQuantity());
            oDetail.setUnitPrice(qDetail.getUnitPrice());
            oDetail.setDiscount(qDetail.getDiscount());

            order.addDetail(oDetail);
        }

        return salesOrderRepository.save(order);
    }

    @Transactional
    public SalesOrder createSalesOrder(SalesOrderRequest request) {
        if (request.getCustomerId() == null) {
            throw new IllegalArgumentException("Lỗi: ID Khách hàng không được để trống!");
        }
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy Khách hàng ID: " + request.getCustomerId()));

        SalesOrder order = new SalesOrder();
        order.setCustomer(customer);
        order.setDueDate(request.getDueDate());
        order.setDeliveryAddress(request.getDeliveryAddress());
        order.setNotes(request.getNotes());
        order.setPaymentTerms(request.getPaymentTerms());
        order.setPaymentMethod(request.getPaymentMethod());
        order.setDepositRatio(request.getDepositRatio());
        order.setDepositAmount(request.getDepositAmount());
        order.setCreatedDate(LocalDateTime.now());
        order.setPaymentStatus("UNPAID");

        // Sinh mã đơn hàng
        String year = String.valueOf(LocalDateTime.now().getYear());
        int randomNum = 1000 + new java.util.Random().nextInt(9000);
        order.setOrderNumber("SO-" + year + "-" + randomNum);

        BigDecimal totalAmount = BigDecimal.ZERO;

        for (SalesOrderDetailRequest dReq : request.getDetails()) {
            Product product = productRepository.findById(dReq.getProductId())
                    .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy Sản phẩm ID: " + dReq.getProductId()));

            SalesOrderDetail detail = new SalesOrderDetail();
            detail.setProduct(product);
            detail.setQuantity(dReq.getQuantity());
            detail.setUnitPrice(dReq.getUnitPrice());
            detail.setDiscount(dReq.getDiscount() != null ? dReq.getDiscount() : BigDecimal.ZERO);
            detail.setNotes(dReq.getNotes());

            order.addDetail(detail);
            totalAmount = totalAmount.add(detail.getTotalLineAmount());
        }

        order.setTotalAmount(totalAmount);

        // 👉 CREDIT CHECK
        BigDecimal currentDebt = customer.getCurrentDebt() != null ? customer.getCurrentDebt() : BigDecimal.ZERO;
        BigDecimal creditLimit = customer.getCreditLimit() != null ? customer.getCreditLimit() : BigDecimal.ZERO;

        if (currentDebt.compareTo(BigDecimal.ZERO) > 0 || totalAmount.compareTo(creditLimit) > 0) {
            order.setStatus("PENDING_APPROVAL");
        } else {
            order.setStatus("WAITING_FOR_DEPOSIT");
        }

        return salesOrderRepository.save(order);
    }

    // =================================================================
    // 3. API: XEM CHI TIẾT 1 ĐƠN HÀNG (Dùng khi FE bấm vào 1 dòng trên bảng)
    // =================================================================
    public SalesOrderDetailResponse getSalesOrderDetail(Long id) {
        SalesOrder order = salesOrderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy Đơn hàng ID: " + id));

        return new SalesOrderDetailResponse(order);
    }

    // =================================================================
    // 4. API: DIRECTOR APPROVAL/REJECTION
    // =================================================================
    @Transactional
    public SalesOrder processApproval(Long orderId, ApprovalRequest request, Long directorId) {
        // 1. tìm đơn hàng
        SalesOrder order = salesOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy Đơn hàng ID: " + orderId));
        //2. chặn lỗi thao tác: chỉ cho phép duyệt những đơn đang bị kẹt
        if (!"PENDING_APPROVAL".equals(order.getStatus())) {
            throw new RuntimeException("Lỗi: Chỉ có thể duyệt những đơn đang ở trạng thái PENDING_APPROVAL!");
        }

        //3. Ghi nhận vết duyệt (Audit trail)
        order.setApprovedById(directorId);
        order.setApprovedAt(LocalDateTime.now());
        order.setApprovalNote(request.getApprovalNote());

        if (request.isApproved()) {
            // TH Director approve -> Đơn được duyệt, chuyển sang trạng thái chờ đặt cọc
            if (request.getNewCreditLimit() == null || request.getNewCreditLimit().compareTo(BigDecimal.ZERO) < 0) {
                throw new RuntimeException("Lỗi: Khi Phê duyệt, Sếp phải nhập Hạn mức tín dụng mới cho khách!");
            }
            order.setStatus("WAITING_FOR_DEPOSIT");
            // Cập nhật hạn mức vĩnh viên mới cho KH
            Customer customer = order.getCustomer();
            customer.setCreditLimit(request.getNewCreditLimit());
            customerRepository.save(customer);
        } else {
            //TH Director reject
            order.setStatus("CANCELLED");
        }
        return salesOrderRepository.save(order);
    }

    //Production manager lay danh sach don hang de len ke hoach san xuat
    public Page<SalesOrderDetailResponse> getPaginatedProductionQueue(String keyword, int page, int size) {
        // Sắp xếp theo mức độ ưu tiên trước, sau đó đến ngày tạo
        Sort sort = Sort.by("priorityLevel").ascending().and(Sort.by("createdDate").ascending());
        Pageable pageable = PageRequest.of(page, size, sort);

        // Xử lý keyword: Nếu null hoặc chỉ có khoảng trắng thì chuyển thành null
        // để Repository nhận diện được điều kiện :keyword IS NULL
        String validKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;

        // Gọi DB lấy data theo trang
        Page<SalesOrder> orderPage = salesOrderRepository.findOrdersForProduction(validKeyword, pageable);

        // Map sang DTO
        return orderPage.map(SalesOrderDetailResponse::new);
    }

}