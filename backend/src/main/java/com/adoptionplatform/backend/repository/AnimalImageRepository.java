package com.adoptionplatform.backend.repository;

import com.adoptionplatform.backend.entity.AnimalImage;
import com.adoptionplatform.backend.entity.AnimalImageId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AnimalImageRepository extends JpaRepository<AnimalImage, AnimalImageId> {

    Optional<AnimalImage> findByAnimal_IdAndSortOrder(Long animalId, Integer sortOrder);
}
