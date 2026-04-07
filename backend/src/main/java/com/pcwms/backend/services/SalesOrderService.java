package com.pcwms.backend.services;

import com.pcwms.backend.dto.request.ApprovalRequest;
import com.pcwms.backend.dto.response.SalesOrderDetailResponse;
import com.pcwms.backend.dto.response.SalesOrderListResponse;
import com.pcwms.backend.entity.*;
import com.pcwms.backend.repository.QuotationRepository;
import com.pcwms.backend.repository.SalesOrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
public class SalesOrderService {

    @Autowired
    private SalesOrderRepository salesOrderRepository;

    @Autowired
    private QuotationRepository quotationRepository;

    // =================================================================
    // 👉 1. LẤY DANH SÁCH ĐƠN HÀNG (TÌM KIẾM & LỌC)
    // =================================================================
    public Page<SalesOrderListResponse> getAllSalesOrders(String keyword, String status, String paymentStatus, Long customerId, Pageable pageable) {
        // Xử lý an toàn các tham số tìm kiếm
        String validKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : "";
        String validStatus = (status != null && !status.trim().isEmpty()) ? status.trim().toUpperCase() : null;
        String validPaymentStatus = (paymentStatus != null && !paymentStatus.trim().isEmpty()) ? paymentStatus.trim().toUpperCase() : null;

        Page<SalesOrder> orderPage = salesOrderRepository.searchSalesOrders(validKeyword, validStatus, validPaymentStatus, customerId, pageable);
        return orderPage.map(SalesOrderListResponse::new);
    }

    // =================================================================
    // 👉 2. TỰ ĐỘNG ĐÚC ĐƠN HÀNG TỪ BÁO GIÁ (CREDIT CHECK GATEKEEPER)
    // =================================================================
    @Transactional
    public SalesOrder generateFromQuotation(Long quotationId) {
        Quotation quotation = quotationRepository.findById(quotationId)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy Báo giá ID: " + quotationId));

        // 1. Kiểm tra điều kiện đầu vào
        if (!"ACCEPTED".equals(quotation.getStatus())) {
            throw new RuntimeException("Lỗi: Báo giá chưa được khách chốt (Trạng thái phải là ACCEPTED)!");
        }
        if (salesOrderRepository.existsByQuotationId(quotationId)) {
            throw new RuntimeException("Lỗi: Báo giá này đã được tạo Đơn Hàng rồi, không thể tạo đúp!");
        }

        // 2. Khởi tạo Đơn hàng mới
        SalesOrder order = new SalesOrder();
        Customer customer = quotation.getCustomer();

        order.setCustomer(customer);
        order.setQuotation(quotation);

        // Sinh mã SO tự động (VD: SO-2026-8273)
        String year = String.valueOf(LocalDateTime.now().getYear());
        int randomNum = 1000 + new java.util.Random().nextInt(9000);
        order.setOrderNumber("SO-" + year + "-" + randomNum);

        BigDecimal orderValue = quotation.getTotalAmount();
        order.setTotalAmount(orderValue);
        order.setPaymentStatus("UNPAID");
        order.setCreatedDate(LocalDateTime.now());

        // ----------------------------------------------------------
        // 🚦 TRẠM KIỂM SOÁT TÍN DỤNG (CREDIT CHECK)
        // ----------------------------------------------------------
        BigDecimal currentDebt = customer.getCurrentDebt() != null ? customer.getCurrentDebt() : BigDecimal.ZERO;
        BigDecimal creditLimit = customer.getCreditLimit() != null ? customer.getCreditLimit() : BigDecimal.ZERO;

        if (currentDebt.compareTo(BigDecimal.ZERO) > 0) {
            // TH1: Khách đang có nợ tồn -> Khóa đơn, chờ duyệt
            order.setStatus("PENDING_APPROVAL");
        } else {
            // TH2: Khách sạch nợ
            if (orderValue.compareTo(creditLimit) > 0) {
                // TH2.1: Vượt hạn mức tín dụng -> Khóa đơn, chờ duyệt
                order.setStatus("PENDING_APPROVAL");
            } else {
                // TH2.2: Nằm trong hạn mức -> Tự động qua ải
                order.setStatus("WAITING_FOR_DEPOSIT");
            }
        }

        // 3. Sao chép chi tiết sản phẩm từ Báo giá sang Đơn hàng
        if (quotation.getDetails() != null) {
            for (QuotationDetail qDetail : quotation.getDetails()) {
                SalesOrderDetail oDetail = new SalesOrderDetail();
                oDetail.setProduct(qDetail.getProduct());
                oDetail.setQuantity(qDetail.getQuantity());
                oDetail.setUnitPrice(qDetail.getUnitPrice());
                oDetail.setDiscount(qDetail.getDiscount());

                // Giả định bạn có hàm addDetail để xử lý quan hệ 2 chiều trong entity SalesOrder
                order.addDetail(oDetail);
            }
        }

        return salesOrderRepository.save(order);
    }

    // =================================================================
    // 👉 3. XEM CHI TIẾT 1 ĐƠN HÀNG
    // =================================================================
    public SalesOrderDetailResponse getSalesOrderDetail(Long id) {
        SalesOrder order = salesOrderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy Đơn hàng ID: " + id));

        return new SalesOrderDetailResponse(order);
    }

    // =================================================================
    // 👉 4. QUẢN LÝ PHÊ DUYỆT CỦA GIÁM ĐỐC (ĐANG TẠM KHOÁ)
    // =================================================================
    /*
    @Transactional
    public SalesOrder processApproval(Long orderId, ApprovalRequest request, Long directorId) {
        SalesOrder order = salesOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy Đơn hàng ID: " + orderId));

        if (!"PENDING_APPROVAL".equals(order.getStatus())) {
            throw new RuntimeException("Lỗi: Chỉ có thể duyệt những đơn đang ở trạng thái PENDING_APPROVAL!");
        }

        order.setApprovedById(directorId);
        order.setApprovedAt(LocalDateTime.now());
        order.setApprovalNote(request.getApprovalNote());

        if (request.isApproved()) {
            if (request.getNewCreditLimit() == null || request.getNewCreditLimit().compareTo(BigDecimal.ZERO) < 0) {
                throw new RuntimeException("Lỗi: Khi Phê duyệt, Sếp phải nhập Hạn mức tín dụng mới hợp lệ cho khách!");
            }
            order.setStatus("WAITING_FOR_DEPOSIT");

            Customer customer = order.getCustomer();
            customer.setCreditLimit(request.getNewCreditLimit());
        } else {
            order.setStatus("CANCELLED");
        }
        return salesOrderRepository.save(order);
    }
    */

    // =================================================================
    // 👉 5. LẤY DANH SÁCH CHỜ SẢN XUẤT (CHO PRODUCTION MANAGER)
    // =================================================================
    public Page<SalesOrderDetailResponse> getPaginatedProductionQueue(String keyword, int page, int size) {
        // Ưu tiên theo priorityLevel (tăng dần/giảm dần tùy logic của bạn) rồi đến ngày tạo
        Sort sort = Sort.by("priorityLevel").ascending().and(Sort.by("createdDate").ascending());
        Pageable pageable = PageRequest.of(page, size, sort);

        String validKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;

        Page<SalesOrder> orderPage = salesOrderRepository.findOrdersForProduction(validKeyword, pageable);
        return orderPage.map(SalesOrderDetailResponse::new);
    }
}