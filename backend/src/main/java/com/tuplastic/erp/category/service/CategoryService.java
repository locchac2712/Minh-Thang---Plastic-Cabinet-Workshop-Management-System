package com.tuplastic.erp.category.service;

import com.tuplastic.erp.category.dto.CategoryResponse;
import com.tuplastic.erp.category.dto.CreateCategoryRequest;
import com.tuplastic.erp.category.dto.UpdateCategoryRequest;
import com.tuplastic.erp.category.entity.Category;
import com.tuplastic.erp.category.mapper.CategoryMapper;
import com.tuplastic.erp.category.repository.CategoryRepository;
import com.tuplastic.erp.common.dto.PageResponse;
import com.tuplastic.erp.common.exception.BadRequestException;
import com.tuplastic.erp.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;

    @Transactional(readOnly = true)
    public CategoryResponse getCategoryById(UUID id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Danh mục", "id", id));
        return categoryMapper.toResponse(category);
    }

    @Transactional(readOnly = true)
    public PageResponse<CategoryResponse> getCategories(String search, Boolean isActive, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("name").ascending());
        Page<Category> categoryPage = categoryRepository.findAllWithFilters(search, isActive, pageable);

        return PageResponse.<CategoryResponse>builder()
                .content(categoryPage.getContent().stream().map(categoryMapper::toResponse).toList())
                .page(categoryPage.getNumber())
                .size(categoryPage.getSize())
                .totalElements(categoryPage.getTotalElements())
                .totalPages(categoryPage.getTotalPages())
                .last(categoryPage.isLast())
                .build();
    }

    @Transactional
    public CategoryResponse createCategory(CreateCategoryRequest request) {
        if (categoryRepository.existsByName(request.getName())) {
            throw new BadRequestException("Tên danh mục đã tồn tại: " + request.getName());
        }

        Category category = Category.builder()
                .name(request.getName())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .build();

        return categoryMapper.toResponse(categoryRepository.save(category));
    }

    @Transactional
    public CategoryResponse updateCategory(UUID id, UpdateCategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Danh mục", "id", id));

        if (request.getName() != null) {
            if (!request.getName().equals(category.getName()) && categoryRepository.existsByName(request.getName())) {
                throw new BadRequestException("Tên danh mục đã tồn tại: " + request.getName());
            }
            category.setName(request.getName());
        }
        if (request.getDescription() != null) {
            category.setDescription(request.getDescription());
        }
        if (request.getImageUrl() != null) {
            category.setImageUrl(request.getImageUrl());
        }
        if (request.getIsActive() != null) {
            category.setIsActive(request.getIsActive());
        }

        return categoryMapper.toResponse(categoryRepository.save(category));
    }

    @Transactional
    public CategoryResponse toggleCategoryActive(UUID id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Danh mục", "id", id));
        category.setIsActive(!Boolean.TRUE.equals(category.getIsActive()));
        return categoryMapper.toResponse(categoryRepository.save(category));
    }
}
