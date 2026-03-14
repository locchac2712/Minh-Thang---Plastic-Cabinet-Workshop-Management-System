package com.pcwms.backend.repository;

import com.pcwms.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    // reset password
    Optional<User> findByEmail(String email);
    Optional<User> findByResetToken(String resetToken);

    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u LEFT JOIN FETCH u.staff LEFT JOIN FETCH u.role")
    java.util.List<User> findAllWithStaffAndRole();
}
