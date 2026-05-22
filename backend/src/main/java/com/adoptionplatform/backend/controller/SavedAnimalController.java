package com.adoptionplatform.backend.controller;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RestController;

import com.adoptionplatform.backend.dto.SavedAnimalEntryDto;
import com.adoptionplatform.backend.entity.Animal;
import com.adoptionplatform.backend.entity.SavedAnimal;
import com.adoptionplatform.backend.repository.AnimalRepository;
import com.adoptionplatform.backend.repository.SavedAnimalRepository;

@RestController
@RequestMapping("/api/saved")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class SavedAnimalController {

    private final SavedAnimalRepository repo;
    private final AnimalRepository animalRepo;

    public SavedAnimalController(SavedAnimalRepository repo, AnimalRepository animalRepo) {
        this.repo = repo;
        this.animalRepo = animalRepo;
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> saveAnimal(
            @RequestParam Long userId,
            @RequestParam Long animalId,
            @RequestParam(required = false) Long adoptionRequestId) {

        SavedAnimal kept = consolidateToSingleRow(userId, animalId);
        if (kept != null) {
            if (adoptionRequestId != null && kept.getAdoptionRequestId() == null) {
                kept.setAdoptionRequestId(adoptionRequestId);
                repo.save(kept);
            }
            return ResponseEntity.ok("Already saved");
        }

        SavedAnimal s = new SavedAnimal();
        s.setUserId(userId);
        s.setAnimalId(animalId);
        s.setAdoptionRequestId(adoptionRequestId);
        s.setSavedAt(LocalDateTime.now());

        repo.save(s);

        return ResponseEntity.ok("Saved");
    }

    @GetMapping("/{userId}")
    @Transactional
    public List<SavedAnimalEntryDto> getSaved(@PathVariable Long userId) {
        consolidateAllDuplicatesForUser(userId);

        List<SavedAnimal> saved = repo.findByUserId(userId);
        Map<Long, SavedAnimal> uniqueByAnimal = new LinkedHashMap<>();
        for (SavedAnimal row : saved) {
            uniqueByAnimal.putIfAbsent(row.getAnimalId(), row);
        }

        List<SavedAnimalEntryDto> result = new ArrayList<>();
        for (SavedAnimal s : uniqueByAnimal.values()) {
            Animal animal = animalRepo.findById(s.getAnimalId()).orElse(null);
            if (animal == null) {
                continue;
            }
            SavedAnimalEntryDto dto = new SavedAnimalEntryDto();
            dto.setAnimalId(s.getAnimalId());
            dto.setAdoptionRequestId(s.getAdoptionRequestId());
            dto.setSavedAt(s.getSavedAt());
            dto.setAnimal(animal);
            result.add(dto);
        }
        return result;
    }

    @DeleteMapping
    @Transactional
    public ResponseEntity<?> unsave(@RequestParam Long userId, @RequestParam Long animalId) {
        List<SavedAnimal> rows = repo.findAllByUserIdAndAnimalId(userId, animalId);

        if (rows.isEmpty()) {
            return ResponseEntity.badRequest().body("Not saved");
        }

        repo.deleteByUserIdAndAnimalId(userId, animalId);
        return ResponseEntity.ok("Removed");
    }

    /**
     * Legacy rows may exist per (user, animal) with different adoption_request_id.
     * Keep the newest row and delete the rest so JPA queries stay unambiguous.
     */
    private SavedAnimal consolidateToSingleRow(Long userId, Long animalId) {
        List<SavedAnimal> rows = repo.findAllByUserIdAndAnimalId(userId, animalId);
        if (rows.isEmpty()) {
            return null;
        }
        rows.sort(Comparator.comparing(
                SavedAnimal::getSavedAt,
                Comparator.nullsLast(Comparator.reverseOrder())));
        SavedAnimal kept = rows.get(0);
        for (int i = 1; i < rows.size(); i++) {
            repo.delete(rows.get(i));
        }
        if (kept.getAdoptionRequestId() == null) {
            for (SavedAnimal row : rows) {
                if (row.getAdoptionRequestId() != null) {
                    kept.setAdoptionRequestId(row.getAdoptionRequestId());
                    repo.save(kept);
                    break;
                }
            }
        }
        return kept;
    }

    private void consolidateAllDuplicatesForUser(Long userId) {
        List<SavedAnimal> saved = repo.findByUserId(userId);
        Map<Long, List<SavedAnimal>> byAnimal = new LinkedHashMap<>();
        for (SavedAnimal row : saved) {
            byAnimal.computeIfAbsent(row.getAnimalId(), k -> new ArrayList<>()).add(row);
        }
        for (List<SavedAnimal> group : byAnimal.values()) {
            if (group.size() <= 1) {
                continue;
            }
            group.sort(Comparator.comparing(
                    SavedAnimal::getSavedAt,
                    Comparator.nullsLast(Comparator.reverseOrder())));
            SavedAnimal kept = group.get(0);
            for (int i = 1; i < group.size(); i++) {
                repo.delete(group.get(i));
            }
            if (kept.getAdoptionRequestId() == null) {
                for (SavedAnimal row : group) {
                    if (row.getAdoptionRequestId() != null) {
                        kept.setAdoptionRequestId(row.getAdoptionRequestId());
                        repo.save(kept);
                        break;
                    }
                }
            }
        }
    }
}
