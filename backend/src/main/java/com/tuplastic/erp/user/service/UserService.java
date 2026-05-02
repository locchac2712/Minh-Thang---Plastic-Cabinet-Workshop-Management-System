package com.tuplastic.erp.user.service;

import com.tuplastic.erp.common.dto.PageResponse;
import com.tuplastic.erp.common.exception.BadRequestException;
import com.tuplastic.erp.common.exception.ResourceNotFoundException;
import com.tuplastic.erp.user.dto.CreateUserRequest;
import com.tuplastic.erp.user.dto.ResetPasswordRequest;
import com.tuplastic.erp.user.dto.UpdateUserRequest;
import com.tuplastic.erp.user.dto.UserResponse;
import com.tuplastic.erp.user.entity.User;
import com.tuplastic.erp.user.enums.UserRole;
import com.tuplastic.erp.user.mapper.UserMapper;
import com.tuplastic.erp.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public PageResponse<UserResponse> getAllUsers(UserRole role, Boolean isActive, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<User> userPage = userRepository.findAllWithFilters(role, isActive, pageable);

        return PageResponse.<UserResponse>builder()
                .content(userPage.getContent().stream().map(userMapper::toResponse).toList())
                .page(userPage.getNumber())
                .size(userPage.getSize())
                .totalElements(userPage.getTotalElements())
                .totalPages(userPage.getTotalPages())
                .last(userPage.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(UUID id) {
        User user = findUserOrThrow(id);
        return userMapper.toResponse(user);
    }

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Tên đăng nhập đã tồn tại: " + request.getUsername());
        }
        if (request.getEmail() != null && userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email đã tồn tại: " + request.getEmail());
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .role(request.getRole())
                .build();

        return userMapper.toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse updateUser(UUID id, UpdateUserRequest request) {
        User user = findUserOrThrow(id);

        if (request.getEmail() != null) {
            user.setEmail(request.getEmail());
        }
        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        if (request.getRole() != null) {
            user.setRole(request.getRole());
        }

        return userMapper.toResponse(userRepository.save(user));
    }

    @Transactional
    public void resetPassword(UUID id, ResetPasswordRequest request) {
        User user = findUserOrThrow(id);
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional
    public UserResponse toggleActive(UUID id) {
        User user = findUserOrThrow(id);
        user.setIsActive(!user.getIsActive());
        return userMapper.toResponse(userRepository.save(user));
    }

    private User findUserOrThrow(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "id", id));
    }
}
