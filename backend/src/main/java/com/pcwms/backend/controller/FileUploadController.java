package com.pcwms.backend.controller;

import com.pcwms.backend.dto.response.ResponseObject;
import com.pcwms.backend.services.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/v1/files")
public class FileUploadController {
    @Autowired
    private FileStorageService fileStorageService;

    @PostMapping("/upload/{type}")
    public ResponseEntity<ResponseObject> uploadFile(
            @RequestParam("file") MultipartFile file,
            @PathVariable("type") String type) { // Hứng cái chữ "products" từ Frontend truyền lên

        try {
            // Truyền cái type đó vào Service để nó biết mà tạo thư mục
            String fileUrl = fileStorageService.storeFile(file, type);

            return ResponseEntity.ok(
                    new ResponseObject("SUCCESS", "Upload file thành công", fileUrl)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new ResponseObject("ERROR", e.getMessage(), null)
            );
        }
    }
}
