package com.pcwms.backend.controller;

import com.pcwms.backend.dto.request.CustomerInteractionRequest;
import com.pcwms.backend.dto.response.ResponseObject;
import com.pcwms.backend.services.CustomerInteractionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/v1/crm/interactions")
@RequiredArgsConstructor
public class CustomerInteractionController {

    private final CustomerInteractionService interactionService;

    @PostMapping
    @PreAuthorize("hasRole('SALES_STAFF') or hasRole('SALES_MANAGER') or hasRole('DIRECTOR') or hasRole('ADMIN')")
    public ResponseEntity<ResponseObject> addInteraction(@RequestBody CustomerInteractionRequest request) {
        return ResponseEntity.ok(new ResponseObject("SUCCESS", "Ghi nhận tương tác thành công", 
                interactionService.addInteraction(request)));
    }

    @GetMapping("/customer/{customerId}")
    @PreAuthorize("hasRole('SALES_STAFF') or hasRole('SALES_MANAGER') or hasRole('DIRECTOR') or hasRole('ADMIN')")
    public ResponseEntity<ResponseObject> getByCustomer(@PathVariable Long customerId) {
        return ResponseEntity.ok(new ResponseObject("SUCCESS", "Lấy lịch sử tương tác thành công", 
                interactionService.getInteractionsByCustomer(customerId)));
    }

    @GetMapping("/reminders/my-pending")
    @PreAuthorize("hasRole('SALES_STAFF') or hasRole('SALES_MANAGER') or hasRole('DIRECTOR') or hasRole('ADMIN')")
    public ResponseEntity<ResponseObject> getMyPendingReminders() {
        return ResponseEntity.ok(new ResponseObject("SUCCESS", "Lấy danh sách nhắc hẹn thành công", 
                interactionService.getMyPendingReminders()));
    }

    @PatchMapping("/{id}/resolve")
    @PreAuthorize("hasRole('SALES_STAFF') or hasRole('SALES_MANAGER') or hasRole('DIRECTOR') or hasRole('ADMIN')")
    public ResponseEntity<ResponseObject> resolveReminder(@PathVariable Long id) {
        interactionService.resolveReminder(id);
        return ResponseEntity.ok(new ResponseObject("SUCCESS", "Đã đánh dấu hoàn thành nhắc hẹn", null));
    }
}
