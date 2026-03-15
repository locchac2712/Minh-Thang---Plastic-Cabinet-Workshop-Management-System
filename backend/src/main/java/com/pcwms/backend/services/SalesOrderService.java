package com.pcwms.backend.services;

import com.pcwms.backend.dto.response.SalesOrderDetailResponse;
import com.pcwms.backend.entity.Quotation;
import com.pcwms.backend.entity.QuotationDetail;
import com.pcwms.backend.entity.SalesOrder;
import com.pcwms.backend.entity.SalesOrderDetail;
import com.pcwms.backend.repository.QuotationRepository;
import com.pcwms.backend.repository.SalesOrderRepository;
import com.pcwms.backend.dto.response.SalesOrderListResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service // 👉 PHẢI CÓ CÁI NÀY
public class SalesOrderService {

    @Autowired // 👉 PHẢI CÓ CÁI NÀY ĐỂ KẾT NỐI DATABASE
    private SalesOrderRepository salesOrderRepository;

    @Autowired
    private QuotationRepository quotationRepository;

    // =================================================================
    // 1. API: LẤY DANH SÁCH ĐƠN HÀNG (CÓ TÌM KIẾM & LỌC 2 LỚP)
    // =================================================================
    public Page<SalesOrderListResponse> getAllSalesOrders(String keyword, String status, String paymentStatus, Pageable pageable) {
        // Nếu không có keyword, gán bằng chuỗi rỗng "" thay vì null
        String validKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : "";

        // Trạng thái thì vẫn giữ nguyên null bình thường
        String validStatus = (status != null && !status.trim().isEmpty()) ? status.trim().toUpperCase() : null;
        String validPaymentStatus = (paymentStatus != null && !paymentStatus.trim().isEmpty()) ? paymentStatus.trim().toUpperCase() : null;

        Page<SalesOrder> orderPage = salesOrderRepository.searchSalesOrders(validKeyword, validStatus, validPaymentStatus, pageable);
        return orderPage.map(SalesOrderListResponse::new);
    }

    // =================================================================
    // 2. API: TỰ ĐỘNG ĐÚC ĐƠN HÀNG TỪ BÁO GIÁ
    // =================================================================
    @Transactional
    public SalesOrder generateFromQuotation(Long quotationId) {
        Quotation quotation = quotationRepository.findById(quotationId)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy Báo giá ID: " + quotationId));

        if (!"ACCEPTED".equals(quotation.getStatus())) {
            throw new RuntimeException("Lỗi: Báo giá chưa được khách chốt (Trạng thái phải là ACCEPTED)!");
        }

        // Chặn trùng lặp đơn hàng
        if (salesOrderRepository.existsByQuotationId(quotationId)) {
            throw new RuntimeException("Lỗi: Báo giá này đã được tạo Đơn Hàng rồi, không thể tạo đúp!");
        }

        SalesOrder order = new SalesOrder();

        order.setCustomer(quotation.getCustomer());
        order.setQuotation(quotation);

        String year = String.valueOf(LocalDateTime.now().getYear());
        int randomNum = 1000 + new java.util.Random().nextInt(9000);
        order.setOrderNumber("SO-" + year + "-" + randomNum);

        order.setTotalAmount(quotation.getTotalAmount());
        order.setStatus("PENDING");
        order.setPaymentStatus("UNPAID");
        order.setCreatedDate(LocalDateTime.now());

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

    // =================================================================
    // 3. API: XEM CHI TIẾT 1 ĐƠN HÀNG (Dùng khi FE bấm vào 1 dòng trên bảng)
    // =================================================================
    public SalesOrderDetailResponse getSalesOrderDetail(Long id) {
        SalesOrder order = salesOrderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy Đơn hàng ID: " + id));

        return new SalesOrderDetailResponse(order);
    }
}