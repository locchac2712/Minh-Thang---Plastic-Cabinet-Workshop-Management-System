package com.tuplastic.erp.payment.controller;

import com.tuplastic.erp.common.security.SecurityUtils;
import com.tuplastic.erp.order.service.OrderService;
import com.tuplastic.erp.payment.dto.PaymentResponse;
import com.tuplastic.erp.payment.service.PaymentService;
import com.tuplastic.erp.user.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = SellerPaymentController.class)
class SellerPaymentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PaymentService paymentService;

    @MockBean
    private OrderService orderService;

    @MockBean
    private SecurityUtils securityUtils;

    @Test
    @WithMockUser(roles = "SELLER")
    void getOrderPaymentsAcceptsDisplayCode() throws Exception {
        UUID orderId = UUID.randomUUID();
        User seller = User.builder().build();
        seller.setId(UUID.randomUUID());

        when(securityUtils.getCurrentUser()).thenReturn(seller);
        when(orderService.resolveSellerFulfillmentOrderId(eq("DH-2026-00001"), eq(seller))).thenReturn(orderId);
        when(paymentService.getPaymentsByOrder(eq(orderId), eq(seller))).thenReturn(
                List.of(PaymentResponse.builder()
                        .id(UUID.randomUUID())
                        .orderId(orderId)
                        .amount(new BigDecimal("1000000"))
                        .paymentMethod("Chuyển khoản")
                        .status("Pending")
                        .build()));

        mockMvc.perform(get("/api/seller/orders/DH-2026-00001/payments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].orderId").value(orderId.toString()));
    }
}
