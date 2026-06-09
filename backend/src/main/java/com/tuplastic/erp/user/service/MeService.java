package com.tuplastic.erp.user.service;

import com.tuplastic.erp.common.exception.BadRequestException;
import com.tuplastic.erp.user.dto.ChangeMePasswordRequest;
import com.tuplastic.erp.user.dto.UpdateMeRequest;
import com.tuplastic.erp.user.dto.UserResponse;
import com.tuplastic.erp.user.entity.User;
import com.tuplastic.erp.user.mapper.UserMapper;
import com.tuplastic.erp.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MeService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public UserResponse updateProfile(User current, UpdateMeRequest request) {
        current.setFullName(request.getFullName().trim());
        return userMapper.toResponse(userRepository.save(current));
    }

    @Transactional
    public void changePassword(User current, ChangeMePasswordRequest request) {
        if (!passwordEncoder.matches(request.getCurrentPassword(), current.getPassword())) {
            throw new BadRequestException("Mật khẩu hiện tại không đúng");
        }
        current.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(current);
    }
}
