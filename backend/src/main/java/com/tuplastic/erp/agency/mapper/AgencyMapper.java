package com.tuplastic.erp.agency.mapper;

import com.tuplastic.erp.agency.dto.AgencyResponse;
import com.tuplastic.erp.agency.entity.Agency;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface AgencyMapper {

    @Mapping(source = "assignedSeller.id", target = "assignedSellerId")
    @Mapping(source = "assignedSeller.fullName", target = "assignedSellerName")
    AgencyResponse toResponse(Agency agency);
}
