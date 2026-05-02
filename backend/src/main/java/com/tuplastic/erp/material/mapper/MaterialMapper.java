package com.tuplastic.erp.material.mapper;

import com.tuplastic.erp.material.dto.MaterialResponse;
import com.tuplastic.erp.material.entity.Material;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface MaterialMapper {

    @Mapping(target = "linkedSuppliers", ignore = true)
    @Mapping(target = "linkedSupplierCount", ignore = true)
    MaterialResponse toResponse(Material material);
}
