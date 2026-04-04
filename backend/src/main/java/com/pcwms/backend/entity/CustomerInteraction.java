package com.pcwms.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "customer_interactions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerInteraction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id", nullable = false)
    private Staff staff;

    @Column(name = "type", nullable = false)
    private String type; // CALL, EMAIL, MEETING, NOTE, REMINDER

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Column(name = "interaction_date", nullable = false)
    private LocalDateTime interactionDate;

    // Theo yêu cầu "Tính năng nhắc hẹn"
    @Column(name = "reminder_date")
    private LocalDateTime reminderDate;

    @Column(name = "is_resolved")
    private boolean isResolved = false;

    @PrePersist
    protected void onCreate() {
        if (interactionDate == null) {
            interactionDate = LocalDateTime.now();
        }
    }
}
