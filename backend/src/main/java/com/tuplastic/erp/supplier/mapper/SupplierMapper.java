package com.tuplastic.erp.supplier.mapper;

import com.tuplastic.erp.supplier.dto.SupplierResponse;
import com.tuplastic.erp.supplier.entity.Supplier;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface SupplierMapper {

    SupplierResponse toResponse(Supplier supplier);
}
