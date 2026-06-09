package com.tuplastic.erp.director.controller;

import com.tuplastic.erp.common.dto.PageResponse;
import com.tuplastic.erp.director.dto.DirectorOrderPipelineRow;
import com.tuplastic.erp.director.dto.DirectorOrderWasteSummaryResponse;
import com.tuplastic.erp.director.service.DirectorOperationsService;
import com.tuplastic.erp.order.dto.OrderFulfillmentSummaryDto;
import com.tuplastic.erp.order.dto.OrderResponse;
import com.tuplastic.erp.order.dto.SellerOrderTaskTimelineResponse;
import com.tuplastic.erp.order.enums.OrderStatus;
import com.tuplastic.erp.order.service.OrderService;
import com.tuplastic.erp.production.dto.TaskResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/director/operations")
@PreAuthorize("hasRole('DIRECTOR')")
@RequiredArgsConstructor
public class DirectorOperationsController {

    private final DirectorOperationsService directorOperationsService;
    private final OrderService orderService;

    @GetMapping("/order-pipeline")
    public PageResponse<DirectorOrderPipelineRow> getOrderPipeline(
            @RequestParam(required = false) String status,
            @RequestParam(name = "from_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(name = "to_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(name = "late_only", required = false, defaultValue = "false") boolean lateOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        List<OrderStatus> statuses = directorOperationsService.parsePipelineStatuses(status);
        return directorOperationsService.getOrderPipeline(statuses, fromDate, toDate, lateOnly, page, size);
    }

    @GetMapping("/orders/{idOrCode}")
    public OrderResponse getOrderDetail(@PathVariable String idOrCode) {
        return orderService.getDirectorFulfillmentOrderDetail(idOrCode);
    }

    @GetMapping("/orders/{idOrCode}/production-tasks")
    public List<SellerOrderTaskTimelineResponse> getOrderProductionTasks(@PathVariable String idOrCode) {
        UUID orderId = orderService.resolveDirectorOrder(idOrCode).getId();
        return directorOperationsService.getOrderProductionTasks(orderId);
    }

    @GetMapping("/orders/{idOrCode}/fulfillment")
    public OrderFulfillmentSummaryDto getOrderFulfillment(@PathVariable String idOrCode) {
        UUID orderId = orderService.resolveDirectorOrder(idOrCode).getId();
        return directorOperationsService.getOrderFulfillment(orderId);
    }

    @GetMapping("/orders/{idOrCode}/waste")
    public DirectorOrderWasteSummaryResponse getOrderWaste(@PathVariable String idOrCode) {
        UUID orderId = orderService.resolveDirectorOrder(idOrCode).getId();
        return directorOperationsService.getOrderWaste(orderId);
    }

    @GetMapping("/tasks")
    public PageResponse<TaskResponse> getTasks(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        List<String> statuses = parseTaskStatuses(status);
        return directorOperationsService.getTasks(statuses, page, size);
    }

    @GetMapping("/tasks/{idOrCode}")
    public TaskResponse getTaskDetail(@PathVariable String idOrCode) {
        return directorOperationsService.getTaskDetail(idOrCode);
    }

    private static List<String> parseTaskStatuses(String statusParam) {
        if (statusParam == null || statusParam.isBlank()) {
            return null;
        }
        return Arrays.stream(statusParam.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }
}
