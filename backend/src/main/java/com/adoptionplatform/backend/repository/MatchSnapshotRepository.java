package com.adoptionplatform.backend.repository;

import com.adoptionplatform.backend.entity.MatchSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MatchSnapshotRepository extends JpaRepository<MatchSnapshot, Long> {

    List<MatchSnapshot> findByAdopterUserIdAndAdoptionRequestIdOrderByMatchPercentageDesc(
            Long adopterUserId,
            Long adoptionRequestId
    );

    List<MatchSnapshot> findByAnimalIdAndAdoptionRequestIdIsNotNullOrderByMatchPercentageDesc(Long animalId);

    List<MatchSnapshot> findByAnimalIdOrderByMatchPercentageDesc(Long animalId);

    Optional<MatchSnapshot> findByAdopterUserIdAndAnimalIdAndAdoptionRequestId(
            Long adopterUserId,
            Long animalId,
            Long adoptionRequestId
    );

    void deleteByAdopterUserIdAndAdoptionRequestId(Long adopterUserId, Long adoptionRequestId);
}
