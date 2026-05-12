package com.adoptionplatform.backend.controller;

import com.adoptionplatform.backend.config.UploadRootHolder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.nio.file.Files;
import java.nio.file.Path;


@RestController
@CrossOrigin(origins = "*")
public class PublicUploadController {

    private static final Logger log = LoggerFactory.getLogger(PublicUploadController.class);

    private final Path uploadRoot;

    public PublicUploadController(UploadRootHolder uploadRootHolder) {
        this.uploadRoot = uploadRootHolder.getUploadRoot().normalize();
        log.info("Public uploads served from {}", uploadRoot);
    }

    /**
     * {@code filepath} is eg. {@code animals/uuid_photo.jpg} (no leading slash).
     */
    @GetMapping("/uploads/{*filepath}")
    public ResponseEntity<Resource> serveUpload(@PathVariable("filepath") String filepath) {
        if (filepath == null || filepath.isBlank()) {
            return ResponseEntity.notFound().build();
        }
        Path file = uploadRoot.resolve(filepath).normalize();
        if (!file.startsWith(uploadRoot)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        if (!Files.isRegularFile(file) || !Files.isReadable(file)) {
            log.warn("Upload file not found: {}", file);
            return ResponseEntity.notFound().build();
        }
        Resource body = new FileSystemResource(file);
        MediaType contentType = MediaTypeFactory.getMediaType(body)
                .orElse(MediaType.APPLICATION_OCTET_STREAM);
        return ResponseEntity.ok()
                .contentType(contentType)
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                .header("Cross-Origin-Resource-Policy", "cross-origin")
                .body(body);
    }
}
