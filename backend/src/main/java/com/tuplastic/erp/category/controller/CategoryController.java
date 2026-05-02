package com.tuplastic.erp.category.controller;

import com.tuplastic.erp.category.dto.CategoryResponse;
import com.tuplastic.erp.category.dto.CreateCategoryRequest;
import com.tuplastic.erp.category.dto.UpdateCategoryRequest;
import com.tuplastic.erp.category.service.CategoryService;
import com.tuplastic.erp.common.dto.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/categories")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public PageResponse<CategoryResponse> getCategories(
            @RequestParam(required = false) String search,
            @RequestParam(name = "is_active", required = false) Boolean isActive,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return categoryService.getCategories(search, isActive, page, size);
    }

    @GetMapping("/{id}")
    public CategoryResponse getCategory(@PathVariable UUID id) {
        return categoryService.getCategoryById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryResponse createCategory(@Valid @RequestBody CreateCategoryRequest request) {
        return categoryService.createCategory(request);
    }

    @PatchMapping("/{id}")
    public CategoryResponse updateCategory(@PathVariable UUID id,
                                           @Valid @RequestBody UpdateCategoryRequest request) {
        return categoryService.updateCategory(id, request);
    }

    @PatchMapping("/{id}/toggle-active")
    public CategoryResponse toggleActive(@PathVariable UUID id) {
        return categoryService.toggleCategoryActive(id);
    }
}
