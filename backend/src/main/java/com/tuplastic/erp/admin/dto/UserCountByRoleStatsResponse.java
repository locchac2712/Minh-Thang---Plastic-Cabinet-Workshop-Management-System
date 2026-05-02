package com.tuplastic.erp.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Số lượng user theo từng vai trò (phân bổ nhân sự, biểu đồ). Chỉ tính tài khoản
 * {@code is_active = true}. Thứ tự key theo {@link com.tuplastic.erp.user.enums.UserRole#values()}.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserCountByRoleStatsResponse {

    private Map<String, Long> countByRole;
    /** Tổng số user active (bằng tổng các giá trị trong {@link #countByRole}). */
    private long totalActiveUsers;
}
