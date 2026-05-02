package com.tuplastic.erp.user.repository;

import com.tuplastic.erp.user.entity.User;
import com.tuplastic.erp.user.enums.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    @Query("""
            SELECT u FROM User u
            WHERE (:role IS NULL OR u.role = :role)
              AND (:isActive IS NULL OR u.isActive = :isActive)
            """)
    Page<User> findAllWithFilters(@Param("role") UserRole role,
                                  @Param("isActive") Boolean isActive,
                                  Pageable pageable);

    List<User> findByRoleAndIsActiveTrueOrderByFullNameAsc(UserRole role);

    long countByRole(UserRole role);

    long countByRoleAndIsActiveTrue(UserRole role);
}
