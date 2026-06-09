package com.tuplastic.erp.production.controller;

import com.tuplastic.erp.production.dto.ShopFloorKpiSummary;
import com.tuplastic.erp.production.dto.ShopFloorPerformanceReport;
import com.tuplastic.erp.production.service.ShopFloorPerformanceService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ProductionShopFloorController.class)
class ProductionShopFloorControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ShopFloorPerformanceService shopFloorPerformanceService;

    @Test
    @WithMockUser(roles = "PRODUCTION")
    void getReportReturnsKpi() throws Exception {
        when(shopFloorPerformanceService.getReport(any(), any()))
                .thenReturn(ShopFloorPerformanceReport.builder()
                        .fromDate(LocalDate.of(2025, 1, 1))
                        .toDate(LocalDate.of(2025, 1, 31))
                        .kpi(ShopFloorKpiSummary.builder()
                                .doneCompletedInPeriod(3)
                                .doneWithExpectedDate(2)
                                .onTimeCount(1)
                                .onTimePercent(java.math.BigDecimal.valueOf(50))
                                .build())
                        .build());

        mockMvc.perform(get("/api/production/reports/shop-floor")
                        .param("from_date", "2025-01-01")
                        .param("to_date", "2025-01-31"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.kpi.doneCompletedInPeriod").value(3))
                .andExpect(jsonPath("$.kpi.onTimePercent").value(50));
    }
}
