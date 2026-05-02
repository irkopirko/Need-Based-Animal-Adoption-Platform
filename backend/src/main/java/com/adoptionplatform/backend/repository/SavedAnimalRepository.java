
package com.adoptionplatform.backend.repository;

import com.adoptionplatform.backend.entity.SavedAnimal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SavedAnimalRepository extends JpaRepository<SavedAnimal, Long> {

    List<SavedAnimal> findByUserId(Long userId);

    Optional<SavedAnimal> findByUserIdAndAnimalId(Long userId, Long animalId);

    boolean existsByUserIdAndAnimalId(Long userId, Long animalId);
}