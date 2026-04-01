package com.pcwms.backend.repository;

import com.pcwms.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User,Long> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
    // reset password
    Optional<User> findByEmail(String email);
    Optional<User> findByResetToken(String resetToken);

    // Tìm user theo roleName — JOIN với bảng roles
    @Query("SELECT u FROM User u WHERE u.role.roleName IN :roleNames AND u.isActive = true")
    List<User> findActiveUsersByRoleNames(@Param("roleNames") List<String> roleNames);
}
