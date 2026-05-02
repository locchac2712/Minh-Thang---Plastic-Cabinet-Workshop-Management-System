package com.tuplastic.erp.upload.controller;

import com.tuplastic.erp.upload.dto.UploadResponse;
import com.tuplastic.erp.upload.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/uploadable")
@RequiredArgsConstructor
public class UploadController {

    private final CloudinaryService cloudinaryService;

    @PostMapping(value = "/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public UploadResponse uploadImage(@RequestParam("file") MultipartFile file) {
        return cloudinaryService.uploadImage(file);
    }
}
