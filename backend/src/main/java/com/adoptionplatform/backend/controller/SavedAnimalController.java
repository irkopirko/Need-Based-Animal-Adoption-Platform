package com.adoptionplatform.backend.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.adoptionplatform.backend.entity.Animal;
import com.adoptionplatform.backend.entity.SavedAnimal;
import com.adoptionplatform.backend.repository.AnimalRepository;
import com.adoptionplatform.backend.repository.SavedAnimalRepository;

@RestController
@RequestMapping("/api/saved")
public class SavedAnimalController {

    private final SavedAnimalRepository repo;
    private final AnimalRepository animalRepo;

    public SavedAnimalController(SavedAnimalRepository repo, AnimalRepository animalRepo) {
        this.repo = repo;
        this.animalRepo = animalRepo;
    }

    // ⭐ SAVE
    @PostMapping
    public ResponseEntity<?> saveAnimal(@RequestParam Long userId, @RequestParam Long animalId) {

        if (repo.findByUserIdAndAnimalId(userId, animalId).isPresent()) {
            return ResponseEntity.badRequest().body("Already saved");
        }

        SavedAnimal s = new SavedAnimal();
        s.setUserId(userId);
        s.setAnimalId(animalId);
        s.setSavedAt(LocalDateTime.now());

        repo.save(s);

        return ResponseEntity.ok("Saved");
    }

    // ⭐ GET SAVED
    @GetMapping("/{userId}")
    public List<Animal> getSaved(@PathVariable Long userId) {

        List<SavedAnimal> saved = repo.findByUserId(userId);

        return saved.stream()
                .map(s -> animalRepo.findById(s.getAnimalId()).orElse(null))
                .filter(a -> a != null)
                .toList();
    }

    // ⭐ DELETE (unsave)
    @DeleteMapping
    public ResponseEntity<?> unsave(@RequestParam Long userId, @RequestParam Long animalId) {

        Optional<SavedAnimal> existing = repo.findByUserIdAndAnimalId(userId, animalId);

        if (existing.isEmpty()) {
            return ResponseEntity.badRequest().body("Not saved");
        }

        repo.delete(existing.get());
        return ResponseEntity.ok("Removed");
    }
}
