package com.tuplastic.erp.production.controller;

import com.tuplastic.erp.production.dto.TaskResponse;
import com.tuplastic.erp.production.service.ProductionTaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/production/orders")
@PreAuthorize("hasRole('PRODUCTION')")
@RequiredArgsConstructor
public class ProductionOrderController {

    private final ProductionTaskService productionTaskService;

    @GetMapping("/{orderId}/tasks")
    public List<TaskResponse> listTasksByOrder(@PathVariable UUID orderId) {
        return productionTaskService.listTasksByOrder(orderId);
    }
}
