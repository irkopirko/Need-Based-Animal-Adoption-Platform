
package com.adoptionplatform.backend.repository;

import com.adoptionplatform.backend.entity.SavedAnimal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface SavedAnimalRepository extends JpaRepository<SavedAnimal, Long> {

    List<SavedAnimal> findByUserId(Long userId);

    Optional<SavedAnimal> findByUserIdAndAnimalId(Long userId, Long animalId);

    boolean existsByUserIdAndAnimalId(Long userId, Long animalId);

    @Modifying
    void deleteByUserId(Long userId);

    @Modifying
    void deleteByAnimalIdIn(Collection<Long> animalIds);
}