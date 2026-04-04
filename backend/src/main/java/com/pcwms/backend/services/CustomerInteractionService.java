package com.pcwms.backend.services;

import com.pcwms.backend.dto.request.CustomerInteractionRequest;
import com.pcwms.backend.dto.response.CustomerInteractionResponse;
import com.pcwms.backend.entity.Customer;
import com.pcwms.backend.entity.CustomerInteraction;
import com.pcwms.backend.entity.Staff;
import com.pcwms.backend.entity.User;
import com.pcwms.backend.repository.CustomerInteractionRepository;
import com.pcwms.backend.repository.CustomerRepository;
import com.pcwms.backend.repository.StaffRepository;
import com.pcwms.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerInteractionService {

    private final CustomerInteractionRepository interactionRepository;
    private final CustomerRepository customerRepository;
    private final StaffRepository staffRepository;
    private final UserRepository userRepository;

    @Transactional
    public CustomerInteractionResponse addInteraction(CustomerInteractionRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng hiện tại"));
        Staff staff = staffRepository.findByUser(currentUser)
                .orElseThrow(() -> new RuntimeException("Người dùng chưa có hồ sơ nhân viên"));

        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khách hàng"));

        CustomerInteraction interaction = CustomerInteraction.builder()
                .customer(customer)
                .staff(staff)
                .type(request.getType())
                .content(request.getContent())
                .interactionDate(request.getInteractionDate() != null ? request.getInteractionDate() : LocalDateTime.now())
                .reminderDate(request.getReminderDate())
                .isResolved(false)
                .build();

        CustomerInteraction saved = interactionRepository.save(interaction);
        return mapToResponse(saved);
    }

    public List<CustomerInteractionResponse> getInteractionsByCustomer(Long customerId) {
        // Có thể bổ sung quyền kiểm tra ở đây (Sale phụ trách hoặc Manager mới được xem)
        return interactionRepository.findByCustomerIdOrderByInteractionDateDesc(customerId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<CustomerInteractionResponse> getMyPendingReminders() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng hiện tại"));
        Staff staff = staffRepository.findByUser(currentUser)
                .orElseThrow(() -> new RuntimeException("Người dùng chưa có hồ sơ nhân viên"));

        return interactionRepository.findByStaffIdAndReminderDateIsNotNullAndIsResolvedFalseOrderByReminderDateAsc(staff.getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void resolveReminder(Long interactionId) {
        CustomerInteraction interaction = interactionRepository.findById(interactionId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tương tác"));
        interaction.setResolved(true);
        interactionRepository.save(interaction);
    }

    private CustomerInteractionResponse mapToResponse(CustomerInteraction entity) {
        return CustomerInteractionResponse.builder()
                .id(entity.getId())
                .customerId(entity.getCustomer().getId())
                .customerName(entity.getCustomer().getName())
                .staffId(entity.getStaff().getId())
                .staffName(entity.getStaff().getFullname())
                .type(entity.getType())
                .content(entity.getContent())
                .interactionDate(entity.getInteractionDate())
                .reminderDate(entity.getReminderDate())
                .isResolved(entity.isResolved())
                .build();
    }
}
