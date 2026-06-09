package com.tuplastic.erp.production.controller;

import com.tuplastic.erp.common.dto.PageResponse;
import com.tuplastic.erp.production.dto.CreateProductionBatchRequest;
import com.tuplastic.erp.production.dto.ProductionOrderBatchesResponse;
import com.tuplastic.erp.production.dto.ProductionOrderDetailDto;
import com.tuplastic.erp.production.dto.ProductionOrderQueueItemDto;
import com.tuplastic.erp.production.dto.TaskResponse;
import com.tuplastic.erp.production.service.ProductionBatchService;
import com.tuplastic.erp.production.service.ProductionOrderQueueService;
import com.tuplastic.erp.production.service.ProductionTaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/production/orders")
@PreAuthorize("hasRole('PRODUCTION')")
@RequiredArgsConstructor
public class ProductionOrderController {

    private final ProductionTaskService productionTaskService;
    private final ProductionBatchService productionBatchService;
    private final ProductionOrderQueueService productionOrderQueueService;

    /**
     * Danh sách đơn cho xưởng (mặc định Producing). {@code awaitingBatch=true} → còn SL lập lô hoặc chưa có lệnh.
     */
    @GetMapping
    public PageResponse<ProductionOrderQueueItemDto> listOrders(
            @RequestParam(required = false, defaultValue = "Producing") String status,
            @RequestParam(required = false) Boolean awaitingBatch,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return productionOrderQueueService.listOrders(status, awaitingBatch, search, page, size);
    }

    @GetMapping("/{orderId}")
    public ProductionOrderDetailDto getOrder(@PathVariable UUID orderId) {
        return productionOrderQueueService.getOrderDetail(orderId);
    }

    @GetMapping("/{orderId}/tasks")
    public List<TaskResponse> listTasksByOrder(@PathVariable UUID orderId) {
        return productionTaskService.listTasksByOrder(orderId);
    }

    @GetMapping("/{orderId}/batches")
    public ProductionOrderBatchesResponse listBatchesByOrder(@PathVariable UUID orderId) {
        return productionBatchService.listBatchesByOrder(orderId);
    }

    @PostMapping("/{orderId}/batches")
    @ResponseStatus(HttpStatus.CREATED)
    public TaskResponse createBatch(@PathVariable UUID orderId,
                                    @Valid @RequestBody CreateProductionBatchRequest request) {
        return productionBatchService.createBatch(orderId, request);
    }
}
