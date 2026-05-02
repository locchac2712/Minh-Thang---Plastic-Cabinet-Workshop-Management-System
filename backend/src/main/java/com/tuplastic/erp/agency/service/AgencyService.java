package com.tuplastic.erp.agency.service;

import com.tuplastic.erp.agency.dto.*;
import com.tuplastic.erp.agency.entity.Agency;
import com.tuplastic.erp.agency.mapper.AgencyMapper;
import com.tuplastic.erp.agency.repository.AgencyRepository;
import com.tuplastic.erp.common.dto.PageResponse;
import com.tuplastic.erp.common.exception.BadRequestException;
import com.tuplastic.erp.common.exception.ResourceNotFoundException;
import com.tuplastic.erp.user.entity.User;
import com.tuplastic.erp.user.enums.UserRole;
import com.tuplastic.erp.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AgencyService {

    private final AgencyRepository agencyRepository;
    private final UserRepository userRepository;
    private final AgencyMapper agencyMapper;

    @Transactional(readOnly = true)
    public PageResponse<AgencyResponse> getAllAgencies(String level, Boolean isActive, String search,
                                                       int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("name").ascending());
        Page<Agency> agencyPage = agencyRepository.findAllWithFilters(level, isActive, search, pageable);

        return PageResponse.<AgencyResponse>builder()
                .content(agencyPage.getContent().stream().map(agencyMapper::toResponse).toList())
                .page(agencyPage.getNumber())
                .size(agencyPage.getSize())
                .totalElements(agencyPage.getTotalElements())
                .totalPages(agencyPage.getTotalPages())
                .last(agencyPage.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public AgencyResponse getAgencyByIdForAdmin(UUID id) {
        Agency agency = findAgencyOrThrow(id);
        return agencyMapper.toResponse(agency);
    }

    @Transactional
    public AgencyResponse updateAgency(UUID id, UpdateAgencyRequest request) {
        Agency agency = findAgencyOrThrow(id);

        if (request.getName() != null) {
            agency.setName(request.getName());
        }
        if (request.getPhone() != null) {
            agency.setPhone(request.getPhone());
        }
        if (request.getAddress() != null) {
            agency.setAddress(request.getAddress());
        }
        if (request.getTaxCode() != null) {
            agency.setTaxCode(request.getTaxCode());
        }
        if (request.getLegalCompanyName() != null) {
            agency.setLegalCompanyName(request.getLegalCompanyName());
        }
        if (request.getLevel() != null) {
            agency.setLevel(request.getLevel());
        }

        return agencyMapper.toResponse(agencyRepository.save(agency));
    }

    /**
     * Admin tạo đại lý và gán seller phụ trách (cấu hình master).
     */
    @Transactional
    public AgencyResponse createAgencyForAdmin(AdminCreateAgencyRequest request) {
        User seller = userRepository.findById(request.getAssignedSellerId())
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "id", request.getAssignedSellerId()));

        if (seller.getRole() != UserRole.SELLER) {
            throw new BadRequestException("Người được gán phải có vai trò SELLER.");
        }
        if (!Boolean.TRUE.equals(seller.getIsActive())) {
            throw new BadRequestException("Tài khoản seller đã bị vô hiệu hóa.");
        }

        if (agencyRepository.existsByNameAndAssignedSellerId(request.getName(), seller.getId())) {
            throw new BadRequestException(
                    "Đại lý với tên '" + request.getName() + "' đã tồn tại trong danh sách của seller đó.");
        }

        Agency agency = Agency.builder()
                .name(request.getName())
                .level(request.getLevel())
                .phone(request.getPhone())
                .address(request.getAddress())
                .taxCode(request.getTaxCode())
                .assignedSeller(seller)
                .build();

        return agencyMapper.toResponse(agencyRepository.save(agency));
    }

    @Transactional
    public AgencyResponse transferOwner(UUID agencyId, TransferOwnerRequest request) {
        Agency agency = findAgencyOrThrow(agencyId);

        User newSeller = userRepository.findById(request.getNewSellerId())
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "id", request.getNewSellerId()));

        if (newSeller.getRole() != UserRole.SELLER) {
            throw new BadRequestException("Người dùng '" + newSeller.getFullName() + "' không phải nhân viên kinh doanh (Seller)");
        }
        if (!newSeller.getIsActive()) {
            throw new BadRequestException("Tài khoản nhân viên '" + newSeller.getFullName() + "' đã bị vô hiệu hóa");
        }

        agency.setAssignedSeller(newSeller);
        return agencyMapper.toResponse(agencyRepository.save(agency));
    }

    @Transactional
    public AgencyResponse toggleActive(UUID id) {
        Agency agency = findAgencyOrThrow(id);
        agency.setIsActive(!agency.getIsActive());
        return agencyMapper.toResponse(agencyRepository.save(agency));
    }

    // ========== Seller-scoped methods ==========

    @Transactional(readOnly = true)
    public PageResponse<AgencyResponse> getSellerAgencies(User seller, String search,
                                                           BigDecimal totalDebtGt,
                                                           int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("name").ascending());
        Page<Agency> agencyPage = agencyRepository.findBySellerWithFilters(
                seller.getId(), search, totalDebtGt, pageable);

        return PageResponse.<AgencyResponse>builder()
                .content(agencyPage.getContent().stream().map(agencyMapper::toResponse).toList())
                .page(agencyPage.getNumber())
                .size(agencyPage.getSize())
                .totalElements(agencyPage.getTotalElements())
                .totalPages(agencyPage.getTotalPages())
                .last(agencyPage.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public AgencyResponse getSellerAgencyDetail(UUID agencyId, User seller) {
        Agency agency = findAgencyBySellerOrThrow(agencyId, seller.getId());
        return agencyMapper.toResponse(agency);
    }

    @Transactional
    public AgencyResponse createAgency(CreateAgencyRequest request, User seller) {
        if (agencyRepository.existsByNameAndAssignedSellerId(request.getName(), seller.getId())) {
            throw new BadRequestException("Đại lý với tên '" + request.getName() + "' đã tồn tại trong danh sách của bạn");
        }

        Agency agency = Agency.builder()
                .name(request.getName())
                .level(request.getLevel())
                .phone(request.getPhone())
                .address(request.getAddress())
                .taxCode(request.getTaxCode())
                .legalCompanyName(request.getLegalCompanyName())
                .assignedSeller(seller)
                .build();

        return agencyMapper.toResponse(agencyRepository.save(agency));
    }

    @Transactional
    public AgencyResponse sellerUpdateAgency(UUID agencyId, SellerUpdateAgencyRequest request, User seller) {
        Agency agency = findAgencyBySellerOrThrow(agencyId, seller.getId());

        if (request.getName() != null) {
            agency.setName(request.getName());
        }
        if (request.getPhone() != null) {
            agency.setPhone(request.getPhone());
        }
        if (request.getAddress() != null) {
            agency.setAddress(request.getAddress());
        }
        if (request.getTaxCode() != null) {
            agency.setTaxCode(request.getTaxCode());
        }
        if (request.getLegalCompanyName() != null) {
            agency.setLegalCompanyName(request.getLegalCompanyName());
        }

        return agencyMapper.toResponse(agencyRepository.save(agency));
    }

    // ========== Director methods ==========

    @Transactional
    public AgencyResponse overrideDebtLimit(UUID agencyId, OverrideDebtRequest request) {
        Agency agency = findAgencyOrThrow(agencyId);
        agency.setMaxDebtLimit(request.getMaxDebtLimit());
        return agencyMapper.toResponse(agencyRepository.save(agency));
    }

    // ========== Private helpers ==========

    private Agency findAgencyOrThrow(UUID id) {
        return agencyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Đại lý", "id", id));
    }

    private Agency findAgencyBySellerOrThrow(UUID agencyId, UUID sellerId) {
        return agencyRepository.findByIdAndAssignedSellerId(agencyId, sellerId)
                .orElseThrow(() -> new ResourceNotFoundException("Đại lý", "id", agencyId));
    }
}
