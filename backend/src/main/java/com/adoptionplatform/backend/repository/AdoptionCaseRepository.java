package com.adoptionplatform.backend.repository;

import com.adoptionplatform.backend.entity.AdoptionCase;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AdoptionCaseRepository extends JpaRepository<AdoptionCase, Long> {

    List<AdoptionCase> findByOwnerUserIdOrderByUpdatedAtDesc(Long ownerUserId);

    List<AdoptionCase> findByAdopterUserIdOrderByUpdatedAtDesc(Long adopterUserId);

    List<AdoptionCase> findByAnimalIdOrderByUpdatedAtDesc(Long animalId);

    Optional<AdoptionCase> findByInquiryId(Long inquiryId);

    Optional<AdoptionCase> findByAnimalIdAndAdopterUserId(Long animalId, Long adopterUserId);

    List<AdoptionCase> findByAnimalIdAndStatusIn(Long animalId, List<String> statuses);

    boolean existsByAnimalIdAndStatusIn(Long animalId, List<String> statuses);
}
