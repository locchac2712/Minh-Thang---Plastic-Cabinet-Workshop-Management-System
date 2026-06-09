package com.tuplastic.erp.production.controller;

import com.tuplastic.erp.activitylog.dto.ActivityLogResponse;
import com.tuplastic.erp.activitylog.dto.CreateActivityLogRequest;
import com.tuplastic.erp.activitylog.service.ActivityLogService;
import com.tuplastic.erp.common.dto.PageResponse;
import com.tuplastic.erp.common.security.SecurityUtils;
import com.tuplastic.erp.production.dto.AssignTaskRequest;
import com.tuplastic.erp.production.dto.TaskResponse;
import com.tuplastic.erp.production.service.ProductionTaskService;
import com.tuplastic.erp.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/production/tasks")
@PreAuthorize("hasRole('PRODUCTION')")
@RequiredArgsConstructor
public class ProductionTaskController {

    private final ProductionTaskService taskService;
    private final ActivityLogService activityLogService;
    private final SecurityUtils securityUtils;

    @GetMapping
    public PageResponse<TaskResponse> getTasks(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return taskService.getTasks(taskService.parseStatuses(status), page, size);
    }

    @GetMapping("/{idOrCode}/details")
    public TaskResponse getTaskDetail(@PathVariable String idOrCode) {
        return taskService.getTaskDetail(idOrCode);
    }

    @PatchMapping("/{idOrCode}/assign")
    public TaskResponse assignTask(@PathVariable String idOrCode,
                                   @Valid @RequestBody AssignTaskRequest request) {
        return taskService.assignTask(idOrCode, request);
    }

    @PatchMapping("/{idOrCode}/start")
    public TaskResponse startTask(@PathVariable String idOrCode) {
        User worker = securityUtils.getCurrentUser();
        return taskService.startTask(idOrCode, worker);
    }

    @PatchMapping("/{idOrCode}/complete")
    public TaskResponse completeTask(@PathVariable String idOrCode) {
        User worker = securityUtils.getCurrentUser();
        return taskService.completeTask(idOrCode, worker);
    }

    @GetMapping("/{idOrCode}/logs")
    public List<ActivityLogResponse> getTaskLogs(@PathVariable String idOrCode) {
        return activityLogService.getLogsByTask(idOrCode);
    }

    @PostMapping("/{idOrCode}/logs")
    @ResponseStatus(HttpStatus.CREATED)
    public ActivityLogResponse createTaskLog(@PathVariable String idOrCode,
                                             @RequestBody CreateActivityLogRequest request) {
        User worker = securityUtils.getCurrentUser();
        return activityLogService.createLog(idOrCode, request, worker);
    }
}
