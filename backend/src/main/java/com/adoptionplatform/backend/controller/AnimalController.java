package com.adoptionplatform.backend.controller;

import com.adoptionplatform.backend.dto.AnimalRequest;
import com.adoptionplatform.backend.entity.Animal;
import com.adoptionplatform.backend.service.AnimalService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/animals")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173"
})
public class AnimalController {

    private static final Logger log = LoggerFactory.getLogger(AnimalController.class);

    private final AnimalService animalService;

    public AnimalController(AnimalService animalService) {
        this.animalService = animalService;
    }

    /**
     * owner dashboard: animals where {@code animals.owner_id} = {@code ownerId}.
     */
    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<?> listByOwner(
            @PathVariable Long ownerId,
            @RequestParam("viewerId") Long viewerId
    ) {
        try {
            return ResponseEntity.ok(animalService.listAnimalsForOwner(ownerId, viewerId));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            log.error("listByOwner failed ownerId={} viewerId={}", ownerId, viewerId, ex);
            String msg = ex.getMessage() != null && !ex.getMessage().isBlank()
                    ? ex.getMessage()
                    : "Could not load listings.";
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", msg));
        }
    }

    /**
     * animals whose {@code compatibilityScore} is greater than or equal to {@code threshold}
     * (default 75) a score of exactly 75% counts as a match.
     */
    @GetMapping("/compatible")
    public List<Animal> getCompatibleAnimals(
            @RequestParam(defaultValue = "75") Double threshold) {
        return animalService.getCompatibleAnimals(threshold);
    }

    @GetMapping
    public List<Animal> getAllAnimals() {
        return animalService.getAllAnimals();
    }

    @PostMapping("/create")
    public ResponseEntity<?> createAnimal(@RequestBody AnimalRequest request) {
        try {
            return ResponseEntity.ok(animalService.createAnimal(request));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public Animal getAnimalById(@PathVariable Long id) {
        return animalService.getAnimalById(id);
    }

    /**
     * same contract as the {@code POST /api/animals/create}: persists a row in {@code animals} with
     * {@code owner_id} pointing at {@code users.id} (animal PK remains {@code animals.id})
     */
    @PostMapping
    public ResponseEntity<?> createAnimalListing(@RequestBody AnimalRequest request) {
        try {
            return ResponseEntity.ok(animalService.createAnimal(request));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAnimal(
            @PathVariable Long id,
            @RequestParam("viewerId") Long viewerId,
            @RequestBody Animal animal
    ) {
        try {
            return ResponseEntity.ok(animalService.updateAnimal(id, viewerId, animal));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (RuntimeException ex) {
            if (ex.getMessage() != null && ex.getMessage().startsWith("Animal not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
            }
            throw ex;
        }
    }

    @PostMapping("/{id}/archive")
    public ResponseEntity<?> archiveListing(
            @PathVariable Long id,
            @RequestParam("viewerId") Long viewerId
    ) {
        try {
            return ResponseEntity.ok(animalService.archiveListing(id, viewerId));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/{id}/unarchive")
    public ResponseEntity<?> unarchiveListing(
            @PathVariable Long id,
            @RequestParam("viewerId") Long viewerId
    ) {
        try {
            return ResponseEntity.ok(animalService.unarchiveListing(id, viewerId));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAnimal(
            @PathVariable Long id,
            @RequestParam("viewerId") Long viewerId
    ) {
        try {
            animalService.deleteAnimal(id, viewerId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (RuntimeException ex) {
            if (ex.getMessage() != null && ex.getMessage().startsWith("Animal not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
            }
            throw ex;
        }
    }

    /**
     * Ooner-only: uploads JPEGs and returns public image URLs (for edit listing without replacing all photos).
     */
    @PostMapping(value = "/owner-upload-images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadOwnerListingImages(
            @RequestParam("viewerId") Long viewerId,
            @RequestPart(value = "images", required = false) List<MultipartFile> images
    ) {
        try {
            List<String> urls = animalService.uploadJpegImagesForOwner(viewerId, images);
            return ResponseEntity.ok(Map.of("urls", urls));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            log.error("uploadOwnerListingImages failed viewerId={}", viewerId, ex);
            String msg = ex.getMessage() != null && !ex.getMessage().isBlank()
                    ? ex.getMessage()
                    : "Upload failed.";
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", msg));
        }
    }

    @PostMapping(value = "/create-with-images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createAnimalWithImages(
            @RequestPart("animal") AnimalRequest request,
            @RequestPart("images") List<MultipartFile> images
    ) {
        try {
            Animal savedAnimal = animalService.createAnimalWithImages(request, images);
            return ResponseEntity.ok(savedAnimal);
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }
}
