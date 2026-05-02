package com.tuplastic.erp.user.mapper;

import com.tuplastic.erp.user.dto.UserResponse;
import com.tuplastic.erp.user.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface UserMapper {

    UserResponse toResponse(User user);
}
