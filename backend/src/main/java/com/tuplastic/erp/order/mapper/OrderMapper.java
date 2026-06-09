package com.tuplastic.erp.order.mapper;

import com.tuplastic.erp.order.dto.OrderItemResponse;
import com.tuplastic.erp.order.dto.OrderResponse;
import com.tuplastic.erp.order.entity.Order;
import com.tuplastic.erp.order.entity.OrderItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface OrderMapper {

    @Mapping(source = "agency.id", target = "agencyId")
    @Mapping(source = "agency.name", target = "agencyName")
    @Mapping(source = "agency.phone", target = "agencyPhone")
    @Mapping(source = "agency.email", target = "agencyEmail")
    @Mapping(source = "agency.legalCompanyName", target = "agencyLegalName")
    @Mapping(source = "agency.taxCode", target = "agencyTaxCode")
    @Mapping(source = "createdBy.id", target = "createdById")
    @Mapping(source = "createdBy.fullName", target = "createdByName")
    @Mapping(source = "approver.id", target = "approverId")
    @Mapping(source = "approver.fullName", target = "approverName")
    @Mapping(source = "sourceOrder.id", target = "sourceOrderId")
    @Mapping(source = "sourceOrder.displayCode", target = "sourceDisplayCode")
    @Mapping(target = "recordKind", expression = "java(order.getSourceOrder() == null ? \"quotation\" : \"fulfillment\")")
    OrderResponse toResponse(Order order);

    @Mapping(source = "product.id", target = "productId")
    @Mapping(source = "product.name", target = "productName")
    @Mapping(source = "product.sku", target = "productSku")
    @Mapping(source = "product.isCustom", target = "isCustom")
    @Mapping(source = "product.resourceUrl", target = "resourceUrl")
    @Mapping(source = "deliveredQuantity", target = "deliveredQuantity")
    @Mapping(target = "remainingToDeliver", expression = "java(item.getQuantity() - item.getDeliveredQuantity())")
    OrderItemResponse toItemResponse(OrderItem item);
}
