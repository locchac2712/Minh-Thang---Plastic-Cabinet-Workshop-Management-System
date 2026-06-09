package com.tuplastic.erp.order.repository;

import com.tuplastic.erp.order.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, UUID> {

    List<OrderItem> findByOrderIdOrderByCreatedAtAsc(UUID orderId);

    List<OrderItem> findByOrder_IdInOrderByCreatedAtAsc(Collection<UUID> orderIds);
}
