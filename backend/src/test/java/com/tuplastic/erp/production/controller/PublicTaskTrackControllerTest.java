package com.tuplastic.erp.production.controller;

import com.tuplastic.erp.production.dto.PublicTaskTrackResponse;
import com.tuplastic.erp.production.service.TaskTrackingService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = PublicTaskTrackController.class)
class PublicTaskTrackControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TaskTrackingService taskTrackingService;

    @Test
    void getByTokenReturnsPublicPayload() throws Exception {
        when(taskTrackingService.getByPlainToken(eq("abc"))).thenReturn(
                PublicTaskTrackResponse.builder()
                        .productName("Tủ bếp")
                        .quantity(2)
                        .status("Doing")
                        .agencyDisplayName("Đại lý A")
                        .orderStatus("Producing")
                        .activityLogs(List.of())
                        .build());

        mockMvc.perform(get("/api/public/track/abc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.productName").value("Tủ bếp"))
                .andExpect(jsonPath("$.quantity").value(2));
    }
}
