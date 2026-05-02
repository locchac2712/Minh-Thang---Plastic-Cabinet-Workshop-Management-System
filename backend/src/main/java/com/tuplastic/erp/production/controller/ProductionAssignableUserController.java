package com.tuplastic.erp.production.controller;

import com.tuplastic.erp.user.dto.AssignableUserResponse;
import com.tuplastic.erp.user.entity.User;
import com.tuplastic.erp.user.enums.UserRole;
import com.tuplastic.erp.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/production")
@PreAuthorize("hasRole('PRODUCTION')")
@RequiredArgsConstructor
public class ProductionAssignableUserController {

    private final UserRepository userRepository;

    @GetMapping("/assignable-users")
    public List<AssignableUserResponse> listAssignableUsers() {
        return userRepository.findByRoleAndIsActiveTrueOrderByFullNameAsc(UserRole.PRODUCTION).stream()
                .map(this::toAssignable)
                .toList();
    }

    private AssignableUserResponse toAssignable(User u) {
        return AssignableUserResponse.builder()
                .id(u.getId())
                .username(u.getUsername())
                .fullName(u.getFullName())
                .email(u.getEmail())
                .build();
    }
}
