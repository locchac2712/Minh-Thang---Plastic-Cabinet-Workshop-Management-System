package com.tuplastic.erp.category.repository;

import com.tuplastic.erp.category.entity.Category;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CategoryRepository extends JpaRepository<Category, UUID> {

    List<Category> findByIsActiveOrderByNameAsc(Boolean isActive);

    List<Category> findAllByOrderByNameAsc();

    boolean existsByName(String name);

    @Query(value = """
            SELECT c.* FROM categories c
            WHERE (:search IS NULL OR
                   LOWER(unaccent(c.name)) LIKE LOWER(unaccent(CONCAT('%', :search, '%')))
                   OR LOWER(unaccent(COALESCE(c.description, ''))) LIKE LOWER(unaccent(CONCAT('%', :search, '%'))))
              AND (:isActive IS NULL OR c.is_active = :isActive)
            """,
            countQuery = """
            SELECT COUNT(*) FROM categories c
            WHERE (:search IS NULL OR
                   LOWER(unaccent(c.name)) LIKE LOWER(unaccent(CONCAT('%', :search, '%')))
                   OR LOWER(unaccent(COALESCE(c.description, ''))) LIKE LOWER(unaccent(CONCAT('%', :search, '%'))))
              AND (:isActive IS NULL OR c.is_active = :isActive)
            """,
            nativeQuery = true)
    Page<Category> findAllWithFilters(@Param("search") String search,
                                      @Param("isActive") Boolean isActive,
                                      Pageable pageable);
}
