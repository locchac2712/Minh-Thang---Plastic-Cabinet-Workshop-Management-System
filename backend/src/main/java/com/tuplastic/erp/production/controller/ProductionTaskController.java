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
import java.util.UUID;

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

    @GetMapping("/{id}/details")
    public TaskResponse getTaskDetail(@PathVariable UUID id) {
        return taskService.getTaskDetail(id);
    }

    @PatchMapping("/{id}/assign")
    public TaskResponse assignTask(@PathVariable UUID id,
                                   @Valid @RequestBody AssignTaskRequest request) {
        return taskService.assignTask(id, request);
    }

    @PatchMapping("/{id}/start")
    public TaskResponse startTask(@PathVariable UUID id) {
        User worker = securityUtils.getCurrentUser();
        return taskService.startTask(id, worker);
    }

    @PatchMapping("/{id}/complete")
    public TaskResponse completeTask(@PathVariable UUID id) {
        User worker = securityUtils.getCurrentUser();
        return taskService.completeTask(id, worker);
    }

    @GetMapping("/{id}/logs")
    public List<ActivityLogResponse> getTaskLogs(@PathVariable UUID id) {
        return activityLogService.getLogsByTask(id);
    }

    @PostMapping("/{id}/logs")
    @ResponseStatus(HttpStatus.CREATED)
    public ActivityLogResponse createTaskLog(@PathVariable UUID id,
                                             @RequestBody CreateActivityLogRequest request) {
        User worker = securityUtils.getCurrentUser();
        return activityLogService.createLog(id, request, worker);
    }
}
