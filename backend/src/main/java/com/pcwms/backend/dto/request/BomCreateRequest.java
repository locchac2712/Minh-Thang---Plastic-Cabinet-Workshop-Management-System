package com.pcwms.backend.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class BomCreateRequest {
    private Long productId; // Tạo công thức cho Thành phẩm nào?
    private String version; // Phiên bản bao nhiêu (VD: 1.0)
    private List<BomDetailRequest> details; // Danh sách các vật tư FE gửi lên
}