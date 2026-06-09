package com.tuplastic.erp.accountant.controller;

import com.tuplastic.erp.accountant.dto.AccountantDashboardResponse;
import com.tuplastic.erp.accountant.service.AccountantDashboardService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AccountantDashboardController.class)
class AccountantDashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AccountantDashboardService accountantDashboardService;

    @Test
    @WithMockUser(roles = "ACCOUNTANT")
    void getDashboardReturnsBody() throws Exception {
        when(accountantDashboardService.getDashboard()).thenReturn(
                AccountantDashboardResponse.builder()
                        .pendingPaymentCount(2)
                        .draftInvoiceCount(1)
                        .purchaseOrdersPendingReceiveCount(0)
                        .purchaseOrdersWithOpenPaymentCount(3)
                        .lowStockMaterialCount(4)
                        .build());

        mockMvc.perform(get("/api/accountant/dashboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pendingPaymentCount").value(2))
                .andExpect(jsonPath("$.draftInvoiceCount").value(1))
                .andExpect(jsonPath("$.lowStockMaterialCount").value(4));
    }
}
