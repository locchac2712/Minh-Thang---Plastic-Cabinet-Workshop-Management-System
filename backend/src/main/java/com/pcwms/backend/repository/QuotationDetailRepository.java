package com.pcwms.backend.repository;

import com.pcwms.backend.entity.QuotationDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface QuotationDetailRepository extends JpaRepository<QuotationDetail, Long> {
}