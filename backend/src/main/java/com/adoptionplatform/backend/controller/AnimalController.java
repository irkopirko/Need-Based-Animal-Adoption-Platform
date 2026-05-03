package com.adoptionplatform.backend.controller;

import com.adoptionplatform.backend.dto.AnimalRequest;
import com.adoptionplatform.backend.entity.Animal;
import com.adoptionplatform.backend.service.AnimalService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/animals")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class AnimalController {

    @PostMapping("/create")
    public ResponseEntity<Animal> createAnimal(@RequestBody AnimalRequest request) {
        return ResponseEntity.ok(animalService.createAnimal(request));
    }
    private final AnimalService animalService;

    public AnimalController(AnimalService animalService) {
        this.animalService = animalService;
    }

    @GetMapping
    public List<Animal> getAllAnimals() {
        return animalService.getAllAnimals();
    }

    @GetMapping("/{id}")
    public Animal getAnimalById(@PathVariable Long id) {
        return animalService.getAnimalById(id);
    }

    /**
     * Animals whose {@code compatibilityScore} is greater than or equal to {@code threshold}
     * (default 75). A score of exactly 75% counts as a match.
     */
    @GetMapping("/compatible")
    public List<Animal> getCompatibleAnimals(
            @RequestParam(defaultValue = "75") Double threshold) {
        return animalService.getCompatibleAnimals(threshold);
    }
    @PostMapping
    public Animal createAnimal(@RequestBody Animal animal) {
        return animalService.saveAnimal(animal);
    }

    @PutMapping("/{id}")
    public Animal updateAnimal(@PathVariable Long id, @RequestBody Animal animal) {
        return animalService.updateAnimal(id, animal);
    }

    @DeleteMapping("/{id}")
    public void deleteAnimal(@PathVariable Long id) {
        animalService.deleteAnimal(id);
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
