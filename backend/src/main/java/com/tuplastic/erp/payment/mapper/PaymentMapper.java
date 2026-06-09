package com.tuplastic.erp.payment.mapper;

import com.tuplastic.erp.payment.dto.PaymentResponse;
import com.tuplastic.erp.payment.entity.Payment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface PaymentMapper {

    @Mapping(source = "order.id", target = "orderId")
    @Mapping(source = "order.displayCode", target = "orderDisplayCode")
    @Mapping(source = "agency.id", target = "agencyId")
    @Mapping(source = "agency.name", target = "agencyName")
    PaymentResponse toResponse(Payment payment);
}
