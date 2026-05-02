-- M–N: vật tư (materials) – nhà cung cấp (suppliers)
CREATE TABLE material_supplier (
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    PRIMARY KEY (material_id, supplier_id)
);

CREATE INDEX idx_material_supplier_supplier ON material_supplier (supplier_id);
