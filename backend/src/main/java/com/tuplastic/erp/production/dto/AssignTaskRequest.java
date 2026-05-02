package com.tuplastic.erp.production.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class AssignTaskRequest {

    @NotNull(message = "Mã nhân viên không được để trống")
    private UUID assignedTo;
}
