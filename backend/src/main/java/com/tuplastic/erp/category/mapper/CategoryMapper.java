package com.tuplastic.erp.category.mapper;

import com.tuplastic.erp.category.dto.CategoryResponse;
import com.tuplastic.erp.category.entity.Category;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface CategoryMapper {

    CategoryResponse toResponse(Category category);
}
