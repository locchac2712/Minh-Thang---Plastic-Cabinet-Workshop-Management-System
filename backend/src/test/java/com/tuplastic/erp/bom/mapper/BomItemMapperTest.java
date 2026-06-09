package com.tuplastic.erp.bom.mapper;

import com.tuplastic.erp.bom.dto.BomItemResponse;
import com.tuplastic.erp.bom.entity.BomItem;
import com.tuplastic.erp.material.entity.Material;
import com.tuplastic.erp.product.entity.Product;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;

class BomItemMapperTest {

    private final BomItemMapper mapper = Mappers.getMapper(BomItemMapper.class);

    @Test
    void toResponse_mapsMaterialUnitCost() {
        UUID productId = UUID.randomUUID();
        UUID materialId = UUID.randomUUID();

        Product product = Product.builder().sku("SP-01").name("Tủ").build();
        product.setId(productId);

        Material material = Material.builder()
                .code("NVL-01")
                .name("Hạt PE")
                .unit("kg")
                .unitCost(new BigDecimal("19500.0000"))
                .build();
        material.setId(materialId);

        BomItem bomItem = BomItem.builder()
                .product(product)
                .material(material)
                .quantity(new BigDecimal("0.25"))
                .note("Test")
                .build();
        bomItem.setId(UUID.randomUUID());

        BomItemResponse response = mapper.toResponse(bomItem);

        assertEquals(new BigDecimal("19500.0000"), response.getMaterialUnitCost());
        assertEquals("NVL-01", response.getMaterialCode());
        assertEquals(productId, response.getProductId());
        assertEquals(materialId, response.getMaterialId());
    }

    @Test
    void toResponse_mapsDefaultMaterialUnitCostAsZero() {
        Material material = Material.builder()
                .code("NVL-02")
                .name("Phụ gia")
                .unit("g")
                .build();
        material.setId(UUID.randomUUID());

        Product product = Product.builder().sku("SP-02").name("Tủ B").build();
        product.setId(UUID.randomUUID());

        BomItem bomItem = BomItem.builder()
                .product(product)
                .material(material)
                .quantity(BigDecimal.ONE)
                .build();

        BomItemResponse response = mapper.toResponse(bomItem);

        assertEquals(BigDecimal.ZERO, response.getMaterialUnitCost());
    }
}
