package com.tuplastic.erp.director.controller;

import com.tuplastic.erp.director.dto.DirectorOrderWasteSummaryResponse;
import com.tuplastic.erp.director.service.DirectorOperationsService;
import com.tuplastic.erp.order.dto.OrderResponse;
import com.tuplastic.erp.order.dto.SellerOrderTaskTimelineResponse;
import com.tuplastic.erp.order.entity.Order;
import com.tuplastic.erp.order.service.OrderService;
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

@WebMvcTest(controllers = DirectorOperationsController.class)
class DirectorOperationsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DirectorOperationsService directorOperationsService;

    @MockBean
    private OrderService orderService;

    @Test
    @WithMockUser(roles = "DIRECTOR")
    void getOrderProductionTasksReturnsArray() throws Exception {
        UUID orderId = UUID.randomUUID();
        UUID taskId = UUID.randomUUID();
        Order order = Order.builder().build();
        order.setId(orderId);
        when(orderService.resolveDirectorOrder(eq(orderId.toString()))).thenReturn(order);
        when(directorOperationsService.getOrderProductionTasks(eq(orderId))).thenReturn(
                List.of(SellerOrderTaskTimelineResponse.builder()
                        .taskId(taskId)
                        .orderId(orderId)
                        .quantity(10)
                        .status("Doing")
                        .deliverable(false)
                        .activityLogs(List.of())
                        .build()));

        mockMvc.perform(get("/api/director/operations/orders/{orderId}/production-tasks", orderId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].taskId").value(taskId.toString()))
                .andExpect(jsonPath("$[0].quantity").value(10));
    }

    @Test
    @WithMockUser(roles = "DIRECTOR")
    void getOrderDetailReturnsFulfillmentOrder() throws Exception {
        UUID orderId = UUID.randomUUID();
        when(orderService.getDirectorFulfillmentOrderDetail(eq("DH-2026-00018")))
                .thenReturn(OrderResponse.builder()
                        .id(orderId)
                        .displayCode("DH-2026-00018")
                        .sourceDisplayCode("BG-2026-00042")
                        .status("Approved")
                        .agencyName("Agency A")
                        .createdByName("Seller One")
                        .build());

        mockMvc.perform(get("/api/director/operations/orders/{idOrCode}", "DH-2026-00018"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayCode").value("DH-2026-00018"))
                .andExpect(jsonPath("$.sourceDisplayCode").value("BG-2026-00042"));
    }

    @Test
    @WithMockUser(roles = "DIRECTOR")
    void getOrderWasteReturnsSummary() throws Exception {
        UUID orderId = UUID.randomUUID();
        Order order = Order.builder().build();
        order.setId(orderId);
        when(orderService.resolveDirectorOrder("DH-2026-00099")).thenReturn(order);
        when(directorOperationsService.getOrderWaste(orderId)).thenReturn(
                DirectorOrderWasteSummaryResponse.builder()
                        .orderId(orderId)
                        .estimatedDamageVnd(new BigDecimal("500000"))
                        .wasteEventCount(2)
                        .discardedBoardEquivalent(BigDecimal.ZERO)
                        .materialRows(List.of())
                        .events(List.of())
                        .build());

        mockMvc.perform(get("/api/director/operations/orders/{idOrCode}/waste", "DH-2026-00099"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderId").value(orderId.toString()))
                .andExpect(jsonPath("$.wasteEventCount").value(2))
                .andExpect(jsonPath("$.estimatedDamageVnd").value(500000));
    }

    @Test
    void getOrderProductionTasksRequiresDirectorRole() throws Exception {
        UUID orderId = UUID.randomUUID();
        mockMvc.perform(get("/api/director/operations/orders/{orderId}/production-tasks", orderId))
                .andExpect(status().isUnauthorized());
    }
}
