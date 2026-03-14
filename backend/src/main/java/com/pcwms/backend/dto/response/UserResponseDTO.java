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
    private Boolean active;
    private String fullName;
    private String phone;
    private String address;
    private java.time.LocalDateTime createdAt;
    private java.time.LocalDateTime updatedAt;

    public static UserResponseDTO fromEntity(User user) {
        String fullName = null;
        String phone = null;
        String address = null;
        if (user.getStaff() != null) {
            fullName = user.getStaff().getFullname();
            phone = user.getStaff().getPhoneNumber();
            address = user.getStaff().getAddress();
        }
        return new UserResponseDTO(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole() != null ? user.getRole().getRoleName() : null,
                user.getIsActive(),
                fullName,
                phone,
                address,
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}
