package com.tuplastic.erp.upload.service;

import com.tuplastic.erp.common.exception.BadRequestException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import static org.junit.jupiter.api.Assertions.assertThrows;

@ExtendWith(MockitoExtension.class)
class CloudinaryServiceDocumentTest {

    @Mock
    private com.cloudinary.Cloudinary cloudinary;

    @InjectMocks
    private CloudinaryService cloudinaryService;

    @Test
    void uploadDocumentRejectsNonPdf() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "drawing.dwg", "application/octet-stream", new byte[]{1, 2, 3});

        assertThrows(BadRequestException.class, () -> cloudinaryService.uploadDocument(file));
    }

    @Test
    void uploadDocumentRejectsEmptyFile() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "empty.pdf", "application/pdf", new byte[0]);

        assertThrows(BadRequestException.class, () -> cloudinaryService.uploadDocument(file));
    }
}
