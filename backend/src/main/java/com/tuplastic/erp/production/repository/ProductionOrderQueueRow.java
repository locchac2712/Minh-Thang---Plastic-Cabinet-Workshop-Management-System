package com.tuplastic.erp.production.repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/** Native query projection for production order queue list. */
public interface ProductionOrderQueueRow {

    UUID getOrderId();

    String getOrderDisplayCode();

    String getAgencyName();

    LocalDate getExpectedDeliveryDate();

    LocalDateTime getCreatedAt();

    Long getTaskCount();

    Long getRemainingBatchableTotal();
}
