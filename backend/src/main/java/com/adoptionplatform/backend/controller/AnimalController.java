package com.adoptionplatform.backend.controller;

import com.adoptionplatform.backend.dto.AnimalRequest;
import com.adoptionplatform.backend.dto.OwnerDashboardDto;
import com.adoptionplatform.backend.dto.OwnerDashboardSummaryDto;
import com.adoptionplatform.backend.entity.Animal;
import com.adoptionplatform.backend.service.AnimalService;
import com.adoptionplatform.backend.service.OwnerDashboardService;
import org.springframework.dao.DataIntegrityViolationException;
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
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:5173",
        "http://127.0.0.1:5173"
})
public class AnimalController {

    private static final Logger log = LoggerFactory.getLogger(AnimalController.class);

    private final AnimalService animalService;
    private final OwnerDashboardService ownerDashboardService;

    public AnimalController(AnimalService animalService, OwnerDashboardService ownerDashboardService) {
        this.animalService = animalService;
        this.ownerDashboardService = ownerDashboardService;
    }

    @GetMapping("/owner/{ownerId}/dashboard-summary")
    public ResponseEntity<?> ownerDashboardSummary(
            @PathVariable Long ownerId,
            @RequestParam("viewerId") Long viewerId
    ) {
        try {
            OwnerDashboardSummaryDto summary = ownerDashboardService.loadSummary(ownerId, viewerId);
            return ResponseEntity.ok(summary);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            log.error("ownerDashboardSummary failed ownerId={} viewerId={}", ownerId, viewerId, ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Could not load owner dashboard summary."));
        }
    }

    @GetMapping("/owner/{ownerId}/dashboard")
    public ResponseEntity<?> ownerDashboard(
            @PathVariable Long ownerId,
            @RequestParam("viewerId") Long viewerId
    ) {
        try {
            OwnerDashboardDto dashboard = ownerDashboardService.loadDashboard(ownerId, viewerId);
            return ResponseEntity.ok(dashboard);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            log.error("ownerDashboard failed ownerId={} viewerId={}", ownerId, viewerId, ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Could not load owner dashboard."));
        }
    }

    @GetMapping("/owner/{ownerId}/cards")
    public ResponseEntity<?> listOwnerCards(
            @PathVariable Long ownerId,
            @RequestParam("viewerId") Long viewerId
    ) {
        try {
            return ResponseEntity.ok(animalService.listOwnerListingCardsForOwner(ownerId, viewerId));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            log.error("listOwnerCards failed ownerId={} viewerId={}", ownerId, viewerId, ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Could not load owner listing cards."));
        }
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

    /**
     * Serves JPEG bytes from {@code animal_images.image_data}, or legacy disk {@code /uploads/...} paths.
     */
    @GetMapping("/{animalId}/images/{sortOrder}")
    public ResponseEntity<byte[]> getListingImage(
            @PathVariable Long animalId,
            @PathVariable int sortOrder
    ) {
        return animalService.serveAnimalImage(animalId, sortOrder);
    }

    /**
     * Owner-only: append JPEGs to an existing listing (returns public image URLs).
     */
    @PostMapping(value = "/{animalId}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> appendListingImages(
            @PathVariable Long animalId,
            @RequestParam("viewerId") Long viewerId,
            @RequestPart(value = "images", required = false) List<MultipartFile> images
    ) {
        try {
            List<String> urls = animalService.appendJpegImagesToListing(animalId, viewerId, images);
            return ResponseEntity.ok(Map.of("urls", urls));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (DataIntegrityViolationException ex) {
            log.error("appendListingImages data error animalId={}", animalId, ex);
            return ResponseEntity.badRequest().body(Map.of(
                    "error",
                    "Image could not be saved. Use JPEG files under 5 MB each, then restart the backend."
            ));
        } catch (Exception ex) {
            log.error("appendListingImages failed animalId={} viewerId={}", animalId, viewerId, ex);
            String msg = ex.getMessage() != null && !ex.getMessage().isBlank()
                    ? ex.getMessage()
                    : "Upload failed.";
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", msg));
        }
    }

    @GetMapping("/{id}")
    public Animal getAnimalById(@PathVariable Long id) {
        return animalService.getAnimalById(id);
    }

    @GetMapping("/{id}/adopter-view")
    public ResponseEntity<?> getAdopterAnimalView(
            @PathVariable Long id,
            @RequestParam Long adopterUserId,
            @RequestParam(required = false) Long requestId
    ) {
        try {
            return ResponseEntity.ok(animalService.getAdopterAnimalView(id, adopterUserId, requestId));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
        }
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
     * @deprecated use {@code POST /api/animals/{animalId}/images} with {@code viewerId}.
     */
    @PostMapping(value = "/owner-upload-images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadOwnerListingImages(
            @RequestParam("viewerId") Long viewerId,
            @RequestParam("animalId") Long animalId,
            @RequestPart(value = "images", required = false) List<MultipartFile> images
    ) {
        try {
            List<String> urls = animalService.uploadJpegImagesForOwner(animalId, viewerId, images);
            return ResponseEntity.ok(Map.of("urls", urls));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            log.error("uploadOwnerListingImages failed animalId={} viewerId={}", animalId, viewerId, ex);
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
        } catch (DataIntegrityViolationException ex) {
            log.error("createAnimalWithImages data error", ex);
            return ResponseEntity.badRequest().body(Map.of(
                    "error",
                    "Image could not be saved. Use JPEG files under 5 MB each, then restart the backend if this persists."
            ));
        } catch (RuntimeException ex) {
            log.error("createAnimalWithImages failed", ex);
            String msg = ex.getMessage() != null && !ex.getMessage().isBlank()
                    ? ex.getMessage()
                    : "Could not save listing.";
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", msg));
        }
    }
}
