package com.tuplastic.erp.product.mapper;

import com.tuplastic.erp.product.dto.ProductResponse;
import com.tuplastic.erp.product.dto.SellerProductResponse;
import com.tuplastic.erp.product.entity.Product;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface ProductMapper {

    @Mapping(source = "category.id", target = "categoryId")
    @Mapping(source = "category.name", target = "categoryName")
    @Mapping(source = "agency.id", target = "agencyId")
    @Mapping(source = "createdBy.id", target = "createdById")
    ProductResponse toResponse(Product product);

    @BeanMapping(ignoreUnmappedSourceProperties = "costPrice")
    @Mapping(source = "category.id", target = "categoryId")
    @Mapping(source = "category.name", target = "categoryName")
    @Mapping(source = "agency.id", target = "agencyId")
    @Mapping(source = "createdBy.id", target = "createdById")
    SellerProductResponse toSellerResponse(Product product);
}
