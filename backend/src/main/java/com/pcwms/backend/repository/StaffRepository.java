package com.pcwms.backend.repository;

import com.pcwms.backend.entity.Staff;
import com.pcwms.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StaffRepository extends JpaRepository<Staff, Long> {
    Optional<Staff> findByUserId(Long userId);

    Optional<Staff> findByUser(User user);
}