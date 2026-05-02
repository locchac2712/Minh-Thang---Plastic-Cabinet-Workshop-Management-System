package com.tuplastic.erp.director.entity;

import com.tuplastic.erp.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "director_waste_team_remarks",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_director_waste_remark_period_team",
                columnNames = {"period_from", "period_to", "team_user_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DirectorWasteTeamRemark {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "period_from", nullable = false)
    private LocalDate periodFrom;

    @Column(name = "period_to", nullable = false)
    private LocalDate periodTo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_user_id", nullable = false)
    private User teamUser;

    @Column(columnDefinition = "TEXT")
    private String remark;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private User updatedBy;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
