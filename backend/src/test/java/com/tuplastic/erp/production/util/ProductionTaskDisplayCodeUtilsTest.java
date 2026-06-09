package com.tuplastic.erp.production.util;

import com.tuplastic.erp.production.repository.ProductionTaskRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductionTaskDisplayCodeUtilsTest {

    @Mock
    private ProductionTaskRepository productionTaskRepository;

    @Test
    void allocateDisplayCode_formatsLsxWithSequence() {
        when(productionTaskRepository.nextProductionTaskNumberSeq()).thenReturn(42L);

        String code = ProductionTaskDisplayCodeUtils.allocateDisplayCode(productionTaskRepository);

        assertTrue(code.matches("^LSX-\\d{4}-00042$"));
    }

    @Test
    void looksLikeDisplayCode_acceptsLsxPattern() {
        assertTrue(ProductionTaskDisplayCodeUtils.looksLikeDisplayCode("LSX-2026-00001"));
        assertFalse(ProductionTaskDisplayCodeUtils.looksLikeDisplayCode("DH-2026-00001"));
    }

    @Test
    void displayRef_prefersDisplayCode() {
        UUID id = UUID.randomUUID();
        assertEquals("LSX-2026-00001", ProductionTaskDisplayCodeUtils.displayRef("LSX-2026-00001", id));
        assertTrue(ProductionTaskDisplayCodeUtils.displayRef(null, id).endsWith("…"));
    }

    @Test
    void parseUuid_returnsNullForLsx() {
        assertNull(ProductionTaskDisplayCodeUtils.parseUuid("LSX-2026-00001"));
    }
}
