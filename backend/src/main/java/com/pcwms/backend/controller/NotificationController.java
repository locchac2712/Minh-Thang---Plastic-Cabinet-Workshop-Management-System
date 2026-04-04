package com.pcwms.backend.controller;

import com.pcwms.backend.dto.response.NotificationResponse;
import com.pcwms.backend.dto.response.ResponseObject;
import com.pcwms.backend.entity.Notification;
import com.pcwms.backend.entity.User;
import com.pcwms.backend.repository.NotificationRepository;
import com.pcwms.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private com.pcwms.backend.repository.QuotationRepository quotationRepository;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getNotifications(Principal principal) {
        try {
            User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            List<Notification> notifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
            long unreadCount = notificationRepository.countByUserIdAndIsReadFalse(user.getId());
            
            Map<String, Object> data = Map.of(
                "notifications", notifs.stream().map(NotificationResponse::new).collect(Collectors.toList()),
                "unreadCount", unreadCount
            );
            return ResponseEntity.ok(new ResponseObject("SUCCESS", "Lấy thông báo thành công", data));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ResponseObject("ERROR", e.getMessage(), null));
        }
    }

    @GetMapping("/all-debug")
    public ResponseEntity<?> getAllDebug() {
        Map<String, Object> result = new java.util.HashMap<>();
        result.put("notifications", notificationRepository.findAll().stream().map(com.pcwms.backend.dto.response.NotificationResponse::new).collect(Collectors.toList()));
        
        List<Map<String, Object>> safeUsers = new java.util.ArrayList<>();
        for (User u : userRepository.findAll()) {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", u.getId());
            map.put("username", u.getUsername());
            map.put("role", u.getRole() != null ? u.getRole().getRoleName() : "NULL");
            map.put("isActive", u.getIsActive());
            safeUsers.add(map);
        }
        result.put("users", safeUsers);

        List<Map<String, Object>> quotes = new java.util.ArrayList<>();
        for (com.pcwms.backend.entity.Quotation q : quotationRepository.findAll()) {
             Map<String, Object> m = new java.util.HashMap<>();
             m.put("id", q.getId());
             m.put("status", q.getStatus());
             quotes.add(m);
        }
        result.put("quotations", quotes);
        
        return ResponseEntity.ok(result);
    }
    
    @PutMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> markAsRead(@PathVariable Long id, Principal principal) {
        try {
            Notification notif = notificationRepository.findById(id).orElseThrow();
            User user = userRepository.findByUsername(principal.getName()).orElseThrow();
            
            if (!notif.getUser().getId().equals(user.getId())) {
                return ResponseEntity.status(403).body(new ResponseObject("ERROR", "Access Denied", null));
            }
            
            notif.setRead(true);
            notificationRepository.save(notif);
            return ResponseEntity.ok(new ResponseObject("SUCCESS", "Đã đánh dấu đã đọc", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ResponseObject("ERROR", e.getMessage(), null));
        }
    }
    
    @PutMapping("/read-all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> markAllAsRead(Principal principal) {
        try {
            User user = userRepository.findByUsername(principal.getName()).orElseThrow();
            List<Notification> notifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
            for(Notification n : notifs) {
                n.setRead(true);
            }
            notificationRepository.saveAll(notifs);
            return ResponseEntity.ok(new ResponseObject("SUCCESS", "Đã đánh dấu tất cả đã đọc", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ResponseObject("ERROR", e.getMessage(), null));
        }
    }
}
