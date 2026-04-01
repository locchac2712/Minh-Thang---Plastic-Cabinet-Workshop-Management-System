package com.pcwms.backend.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class PriorityRequest {
    private Integer level;
    private LocalDate dueDate;
}
