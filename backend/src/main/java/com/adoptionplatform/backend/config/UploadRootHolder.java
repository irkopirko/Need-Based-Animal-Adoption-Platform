package com.adoptionplatform.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Component
public class UploadRootHolder {

    private static final Logger log = LoggerFactory.getLogger(UploadRootHolder.class);

    private final Path uploadRoot;

    public UploadRootHolder() {
        this.uploadRoot = resolveUploadRoot();
        log.info("Resolved upload root: {}", uploadRoot);
    }

    public Path getUploadRoot() {
        return uploadRoot;
    }

    public Path getAnimalsUploadDir() {
        return uploadRoot.resolve("animals");
    }

    private static Path resolveUploadRoot() {
        Path underCwd = Paths.get("uploads").toAbsolutePath().normalize();
        Path underBackend = Paths.get("backend", "uploads").toAbsolutePath().normalize();
        Path animalsUnderCwd = underCwd.resolve("animals");
        Path animalsUnderBackend = underBackend.resolve("animals");
        boolean cwdHasAnimals = Files.isDirectory(animalsUnderCwd);
        boolean backendSubHasAnimals = Files.isDirectory(animalsUnderBackend);
        if (backendSubHasAnimals && !cwdHasAnimals) {
            return underBackend;
        }
        return underCwd;
    }
}
