package com.adoptionplatform.backend.repository;

import com.adoptionplatform.backend.entity.Animal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnimalRepository extends JpaRepository<Animal, Long> {

    List<Animal> findByCompatibilityScoreGreaterThanEqual(Double score);
}

