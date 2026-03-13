package com.pcwms.backend.services;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {
    private final Path fileStorageLocation = Paths.get("uploads").toAbsolutePath().normalize();

    public FileStorageService(){
        try{
            Files.createDirectories(this.fileStorageLocation);
        }catch (Exception ex){
            throw new RuntimeException("Không thể tạo thư mục lưu trữ file.", ex);
        }
    }

    // 👉 HÀM LƯU FILE ĐÃ NÂNG CẤP (Có phân loại thư mục)
    public String storeFile(MultipartFile file, String subFolder) {
        try {
            // 1. Lấy đuôi file (VD: .jpg, .png)
            String originalFileName = file.getOriginalFilename();
            String fileExtension = "";
            if (originalFileName != null && originalFileName.contains(".")) {
                fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
            }

            // 2. Đổi tên file thành UUID
            String newFileName = UUID.randomUUID().toString() + fileExtension;

            // 3. 👉 TẠO ĐƯỜNG DẪN THƯ MỤC CON (VD: uploads/products)
            Path targetFolder = this.fileStorageLocation.resolve(subFolder);
            Files.createDirectories(targetFolder); // Nếu chưa có thư mục con thì tự tạo

            // 4. Đường dẫn lưu file cuối cùng
            Path targetLocation = targetFolder.resolve(newFileName);

            // 5. Lưu file vào ổ cứng
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            // 6. Trả về link URL xịn xò có chứa tên thư mục con
            return "http://localhost:8080/uploads/" + subFolder + "/" + newFileName;

        } catch (IOException ex) {
            throw new RuntimeException("Lỗi! Không thể lưu file " + file.getOriginalFilename(), ex);
        }
    }
}
