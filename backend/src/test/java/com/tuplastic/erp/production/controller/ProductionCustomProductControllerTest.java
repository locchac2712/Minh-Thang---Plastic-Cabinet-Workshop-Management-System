package com.tuplastic.erp.production.controller;

import com.tuplastic.erp.bom.dto.BomItemResponse;
import com.tuplastic.erp.bom.service.BomService;
import com.tuplastic.erp.common.dto.PageResponse;
import com.tuplastic.erp.common.security.SecurityUtils;
import com.tuplastic.erp.product.dto.ProductionCustomProductResponse;
import com.tuplastic.erp.product.service.CustomCatalogProductService;
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

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ProductionCustomProductController.class)
class ProductionCustomProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CustomCatalogProductService customCatalogProductService;

    @MockBean
    private BomService bomService;

    @MockBean
    private SecurityUtils securityUtils;

    @Test
    @WithMockUser(roles = "PRODUCTION")
    void listCustomProductsReturnsPage() throws Exception {
        UUID id = UUID.fromString("p1111111-2222-3333-4444-555555555555");
        when(customCatalogProductService.listCustomProducts(isNull(), eq("custom"), eq(0), eq(10)))
                .thenReturn(PageResponse.<ProductionCustomProductResponse>builder()
                        .content(List.of(ProductionCustomProductResponse.builder()
                                .id(id)
                                .sku("CUS-001")
                                .name("Tủ custom A")
                                .agencyName("Đại lý A")
                                .isCustom(true)
                                .costPrice(BigDecimal.ZERO)
                                .suggestedPrice(BigDecimal.valueOf(100000))
                                .build()))
                        .page(0)
                        .size(10)
                        .totalElements(1)
                        .totalPages(1)
                        .last(true)
                        .build());

        mockMvc.perform(get("/api/production/custom-products")
                        .param("search", "custom")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].id").value(id.toString()))
                .andExpect(jsonPath("$.data.content[0].sku").value("CUS-001"));
    }

    @Test
    @WithMockUser(roles = "PRODUCTION")
    void getCustomProductBom() throws Exception {
        UUID id = UUID.fromString("p1111111-2222-3333-4444-555555555555");
        UUID bomId = UUID.fromString("b1111111-2222-3333-4444-555555555555");
        when(customCatalogProductService.getCustomProduct(id))
                .thenReturn(ProductionCustomProductResponse.builder().id(id).sku("CUS-001").isCustom(true).build());
        when(bomService.getBomByProductId(id))
                .thenReturn(List.of(BomItemResponse.builder()
                        .id(bomId)
                        .productId(id)
                        .materialCode("VL-01")
                        .materialName("MDF")
                        .quantity(BigDecimal.ONE)
                        .build()));

        mockMvc.perform(get("/api/production/custom-products/{id}/bom", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].materialCode").value("VL-01"));
    }
}
