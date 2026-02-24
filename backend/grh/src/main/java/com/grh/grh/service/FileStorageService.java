package com.grh.grh.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
public class FileStorageService {
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList("pdf" , "jpg" , "jpeg" , "png");
    private static final long MAX_FILE_SIZE = 3 * 1024 * 1024;

    @Value("${app.file-storage.upload-dir:uploads}")
    private String uploadDir;

    public String storeFile(MultipartFile file, String subfolder) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException(
                "File size exceeds maximum allowed size of 3MB: " + file.getOriginalFilename()
            );
        }

        String originalFilename = file.getOriginalFilename();
        String extension = getFileExtension(originalFilename);
        if (!ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
            throw new IllegalArgumentException(
                "File type not allowed. Allowed: PDF, JPG, JPEG, PNG. Got: " + extension
            );
        }

        try {
            
            Path dirPath = Paths.get(uploadDir, subfolder);
            Files.createDirectories(dirPath);

            String storedFilename = UUID.randomUUID() + "-" + sanitizeFilename(originalFilename);
            Path filePath = dirPath.resolve(storedFilename);

            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            String relativePath = subfolder + "/" + storedFilename;
            log.info("Stored file: {}", relativePath);
            return relativePath;

        } catch (IOException e) {
            throw new RuntimeException("Failed to store file: " + originalFilename, e);
        }

    }

    public void deleteFile(String relativePath){

        if(relativePath == null || relativePath.isBlank()){
            return;
        }

        try {
            Path filePath = Paths.get(uploadDir , relativePath);
            Files.deleteIfExists(filePath);
            log.info("Deleted file : {}", relativePath);
        } catch (IOException e) {
            log.warn("Failed to delete file: {}", relativePath, e);
        }

    }

    public Path getFilePath(String relativePath) {
        return Paths.get(uploadDir, relativePath);
    }

    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf('.') + 1);
    }

    private String sanitizeFilename(String filename) {
        if (filename == null) return "file";
        // Remove path separators and special chars, keep only safe characters
        return filename.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
