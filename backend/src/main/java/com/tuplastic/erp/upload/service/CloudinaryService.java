package com.tuplastic.erp.upload.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.tuplastic.erp.common.exception.BadRequestException;
import com.tuplastic.erp.upload.dto.UploadResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private final Cloudinary cloudinary;

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif"
    );
    private static final long MAX_SIZE = 5 * 1024 * 1024; // 5MB

    public UploadResponse uploadImage(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BadRequestException("File không được để trống");
        }
        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new BadRequestException("Chỉ chấp nhận file ảnh: JPEG, PNG, WebP, GIF");
        }
        if (file.getSize() > MAX_SIZE) {
            throw new BadRequestException("Dung lượng file không được vượt quá 5MB");
        }

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> result = cloudinary.uploader().upload(file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", "tuplastic",
                            "resource_type", "image"
                    ));

            String url = (String) result.get("secure_url");
            String publicId = (String) result.get("public_id");

            return UploadResponse.builder()
                    .url(url)
                    .publicId(publicId)
                    .build();

        } catch (IOException e) {
            log.error("Cloudinary upload failed", e);
            throw new BadRequestException("Upload ảnh thất bại, vui lòng thử lại");
        }
    }
}
