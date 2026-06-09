package com.tuplastic.erp.production.controller;

import com.tuplastic.erp.agency.dto.AgencyResponse;
import com.tuplastic.erp.agency.service.AgencyService;
import com.tuplastic.erp.common.dto.PageResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ProductionAgencyController.class)
class ProductionAgencyControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AgencyService agencyService;

    @Test
    @WithMockUser(roles = "PRODUCTION")
    void listAgenciesReturnsPage() throws Exception {
        UUID id = UUID.fromString("11000000-0000-0000-0000-000000000001");
        when(agencyService.getAllAgencies(isNull(), eq(true), eq("can tho"), eq(0), eq(20)))
                .thenReturn(PageResponse.<AgencyResponse>builder()
                        .content(List.of(AgencyResponse.builder()
                                .id(id)
                                .name("Đại Lý Cần Thơ")
                                .taxCode("1801234567")
                                .legalCompanyName("CT TNHH TM")
                                .isActive(true)
                                .build()))
                        .page(0)
                        .size(20)
                        .totalElements(1)
                        .totalPages(1)
                        .last(true)
                        .build());

        mockMvc.perform(get("/api/production/agencies")
                        .param("is_active", "true")
                        .param("search", "can tho")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(id.toString()))
                .andExpect(jsonPath("$.content[0].name").value("Đại Lý Cần Thơ"));
    }
}
