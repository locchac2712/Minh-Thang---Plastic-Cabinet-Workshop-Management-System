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

    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif"
    );
    private static final Set<String> ALLOWED_DOCUMENT_TYPES = Set.of(
            "application/pdf"
    );
    private static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
    private static final long MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

    public UploadResponse uploadImage(MultipartFile file) {
        validateNonEmpty(file);
        if (!ALLOWED_IMAGE_TYPES.contains(file.getContentType())) {
            throw new BadRequestException("Chỉ chấp nhận file ảnh: JPEG, PNG, WebP, GIF");
        }
        if (file.getSize() > MAX_IMAGE_SIZE) {
            throw new BadRequestException("Dung lượng file không được vượt quá 5MB");
        }
        return uploadToCloudinary(file, "tuplastic", "image", "Upload ảnh thất bại, vui lòng thử lại");
    }

    /** PDF tài liệu / bản vẽ — Cloudinary resource_type raw. */
    public UploadResponse uploadDocument(MultipartFile file) {
        validateNonEmpty(file);
        if (!isAllowedDocument(file)) {
            throw new BadRequestException("Chỉ chấp nhận file PDF");
        }
        if (file.getSize() > MAX_DOCUMENT_SIZE) {
            throw new BadRequestException("Dung lượng file không được vượt quá 10MB");
        }
        return uploadToCloudinary(file, "tuplastic/documents", "raw", "Upload tài liệu thất bại, vui lòng thử lại");
    }

    private static void validateNonEmpty(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BadRequestException("File không được để trống");
        }
    }

    private static boolean isAllowedDocument(MultipartFile file) {
        if (ALLOWED_DOCUMENT_TYPES.contains(file.getContentType())) {
            return true;
        }
        String name = file.getOriginalFilename();
        return name != null && name.toLowerCase().endsWith(".pdf");
    }

    private UploadResponse uploadToCloudinary(MultipartFile file,
                                              String folder,
                                              String resourceType,
                                              String failureMessage) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> result = cloudinary.uploader().upload(file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", folder,
                            "resource_type", resourceType
                    ));

            String url = (String) result.get("secure_url");
            String publicId = (String) result.get("public_id");

            return UploadResponse.builder()
                    .url(url)
                    .publicId(publicId)
                    .build();

        } catch (IOException e) {
            log.error("Cloudinary upload failed", e);
            throw new BadRequestException(failureMessage);
        }
    }
}
