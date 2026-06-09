package com.tuplastic.erp.reconcile;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

class AgencyOpenDebtCriteriaTest {

    @Test
    void openFulfillmentWhere_excludesQuotationsAndDoneOnly() {
        String w = AgencyOpenDebtCriteria.OPEN_FULFILLMENT_WHERE;
        assertTrue(w.contains("source_order_id IS NOT NULL"));
        assertTrue(w.contains("'Approved'"));
        assertTrue(w.contains("'Producing'"));
        assertTrue(w.contains("'Done'"));
    }
}
