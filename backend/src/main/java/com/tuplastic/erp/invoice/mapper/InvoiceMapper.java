package com.tuplastic.erp.invoice.mapper;

import com.tuplastic.erp.invoice.dto.InvoiceResponse;
import com.tuplastic.erp.invoice.entity.Invoice;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface InvoiceMapper {

    @Mapping(source = "order.id", target = "orderId")
    InvoiceResponse toResponse(Invoice invoice);
}
