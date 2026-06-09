package com.tuplastic.erp.accountant.controller;

import com.tuplastic.erp.accountant.service.AccountantPurchaseService;
import com.tuplastic.erp.common.security.SecurityUtils;
import com.tuplastic.erp.purchase.service.MaterialSupplierPriceInsightService;
import com.tuplastic.erp.purchase.service.OpenTaskMaterialRequirementService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AccountantPurchaseController.class)
class AccountantPurchaseMaterialReportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AccountantPurchaseService accountantPurchaseService;

    @MockBean
    private OpenTaskMaterialRequirementService openTaskMaterialRequirementService;

    @MockBean
    private MaterialSupplierPriceInsightService materialSupplierPriceInsightService;

    @MockBean
    private SecurityUtils securityUtils;

    @Test
    @WithMockUser(roles = "ACCOUNTANT")
    void openTaskMaterialNeedsReturnsList() throws Exception {
        when(openTaskMaterialRequirementService.listOpenTaskMaterialNeeds()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/accountant/purchases/open-task-material-needs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @WithMockUser(roles = "ACCOUNTANT")
    void materialSupplierPricesReturnsList() throws Exception {
        when(materialSupplierPriceInsightService.listMaterialSupplierPriceHints(null)).thenReturn(List.of());

        mockMvc.perform(get("/api/accountant/purchases/material-supplier-prices"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }
}
