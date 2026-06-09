package com.tuplastic.erp.production.controller;

import com.tuplastic.erp.production.dto.PublicTaskTrackResponse;
import com.tuplastic.erp.production.service.TaskTrackingService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/track")
@RequiredArgsConstructor
public class PublicTaskTrackController {

    private final TaskTrackingService taskTrackingService;

    @GetMapping("/{token}")
    public PublicTaskTrackResponse getByToken(@PathVariable String token) {
        return taskTrackingService.getByPlainToken(token);
    }
}
