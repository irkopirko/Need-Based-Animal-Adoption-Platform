package com.adoptionplatform.backend.controller;

import com.adoptionplatform.backend.dto.AnimalRequest;
import com.adoptionplatform.backend.entity.Animal;
import com.adoptionplatform.backend.service.AnimalService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

import java.util.List;

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
public ResponseEntity<Animal> createAnimalWithImages(
        @RequestPart("animal") AnimalRequest request,
        @RequestPart("images") List<MultipartFile> images
) {
    Animal savedAnimal = animalService.createAnimalWithImages(request, images);
    return ResponseEntity.ok(savedAnimal);
}
}
