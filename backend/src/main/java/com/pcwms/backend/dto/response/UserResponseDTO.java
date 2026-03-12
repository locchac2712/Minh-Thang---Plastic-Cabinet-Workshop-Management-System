package com.pcwms.backend.dto.response;

import com.pcwms.backend.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserResponseDTO {
    private Long id;
    private String username;
    private String email;
    private String role;
    private Boolean isActive;

    public static UserResponseDTO fromEntity(User user) {
        return new UserResponseDTO(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole() != null ? user.getRole().getRoleName() : null,
                user.getIsActive()
        );
    }
}
