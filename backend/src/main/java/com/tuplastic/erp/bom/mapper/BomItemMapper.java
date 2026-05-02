package com.tuplastic.erp.bom.mapper;

import com.tuplastic.erp.bom.dto.BomItemResponse;
import com.tuplastic.erp.bom.entity.BomItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface BomItemMapper {

    @Mapping(source = "product.id", target = "productId")
    @Mapping(source = "material.id", target = "materialId")
    @Mapping(source = "material.code", target = "materialCode")
    @Mapping(source = "material.name", target = "materialName")
    @Mapping(source = "material.unit", target = "materialUnit")
    BomItemResponse toResponse(BomItem bomItem);
}
