package com.tuplastic.erp.user.service;

import com.tuplastic.erp.common.exception.BadRequestException;
import com.tuplastic.erp.user.dto.ChangeMePasswordRequest;
import com.tuplastic.erp.user.dto.UpdateMeRequest;
import com.tuplastic.erp.user.dto.UserResponse;
import com.tuplastic.erp.user.entity.User;
import com.tuplastic.erp.user.enums.UserRole;
import com.tuplastic.erp.user.mapper.UserMapper;
import com.tuplastic.erp.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MeServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private UserMapper userMapper;
    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private MeService meService;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .username("seller1")
                .email("seller1@example.com")
                .fullName("Nguyen Van A")
                .password("old-secret")
                .role(UserRole.SELLER)
                .build();
        user.setId(UUID.randomUUID());
    }

    @Test
    void updateProfile_updatesFullName() {
        UpdateMeRequest request = new UpdateMeRequest();
        request.setFullName("Tran Thi B");

        UserResponse mapped = UserResponse.builder().fullName("Tran Thi B").build();
        when(userRepository.save(user)).thenReturn(user);
        when(userMapper.toResponse(user)).thenReturn(mapped);

        UserResponse result = meService.updateProfile(user, request);

        assertEquals("Tran Thi B", user.getFullName());
        assertEquals("Tran Thi B", result.getFullName());
        verify(userRepository).save(user);
    }

    @Test
    void changePassword_succeedsWhenCurrentPasswordMatches() {
        ChangeMePasswordRequest request = new ChangeMePasswordRequest();
        request.setCurrentPassword("old-secret");
        request.setNewPassword("new-secret");

        when(passwordEncoder.matches("old-secret", "old-secret")).thenReturn(true);
        when(passwordEncoder.encode("new-secret")).thenReturn("encoded-new");
        when(userRepository.save(user)).thenReturn(user);

        meService.changePassword(user, request);

        assertEquals("encoded-new", user.getPassword());
        verify(userRepository).save(user);
    }

    @Test
    void changePassword_rejectsWrongCurrentPassword() {
        ChangeMePasswordRequest request = new ChangeMePasswordRequest();
        request.setCurrentPassword("wrong");
        request.setNewPassword("new-secret");

        when(passwordEncoder.matches(eq("wrong"), any())).thenReturn(false);

        assertThrows(BadRequestException.class, () -> meService.changePassword(user, request));
    }
}
