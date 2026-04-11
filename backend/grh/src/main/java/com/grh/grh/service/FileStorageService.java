package com.grh.grh.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
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

    @Value("${app.file-storage.private-upload-dir:uploads-private}")
    private String privateUploadDir;

    public String storeFile(MultipartFile file, String subfolder) {
        return store(file, subfolder, uploadDir, false);
    }

    public String storePrivateFile(MultipartFile file, String subfolder) {
        return store(file, subfolder, privateUploadDir, true);
    }

    private String store(MultipartFile file, String subfolder, String baseDir, boolean privateFile) {
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
            Path dirPath = Paths.get(baseDir, subfolder);
            Files.createDirectories(dirPath);

            String storedFilename = UUID.randomUUID() + "-" + sanitizeFilename(originalFilename);
            Path filePath = dirPath.resolve(storedFilename);

            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            String relativePath = subfolder + "/" + storedFilename;
            log.info("Stored file: {}", relativePath);
            if (privateFile) {
                return "private/" + relativePath;
            }
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

    public byte[] loadFile(String relativePath) {
        try {
            Path filePath = Paths.get(uploadDir, relativePath);
            return Files.readAllBytes(filePath);
        } catch (IOException e) {
            throw new RuntimeException("Could not read file: " + relativePath, e);
        }
    }

    public Resource loadFileAsResource(String relativePath) {
        return buildResource(Paths.get(uploadDir, relativePath), relativePath);
    }

    public Resource loadPrivateFileAsResource(String storedPrivatePath) {
        String relativePath = storedPrivatePath.startsWith("private/")
            ? storedPrivatePath.substring("private/".length())
            : storedPrivatePath;
        return buildResource(Paths.get(privateUploadDir, relativePath), relativePath);
    }

    private Resource buildResource(Path path, String originalPath) {
        try {
            Resource resource = new UrlResource(path.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new IllegalArgumentException("File not found: " + originalPath);
            }
            return resource;
        } catch (IOException ex) {
            throw new RuntimeException("Could not load file: " + originalPath, ex);
        }
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
