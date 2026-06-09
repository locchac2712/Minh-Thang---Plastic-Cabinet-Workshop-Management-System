package com.tuplastic.erp.activitylog.mapper;

import com.tuplastic.erp.activitylog.dto.ActivityLogResponse;
import com.tuplastic.erp.activitylog.entity.ActivityLog;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface ActivityLogMapper {

    @Mapping(source = "task.id", target = "taskId")
    @Mapping(source = "task.displayCode", target = "taskDisplayCode")
    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "user.fullName", target = "userName")
    ActivityLogResponse toResponse(ActivityLog activityLog);
}
