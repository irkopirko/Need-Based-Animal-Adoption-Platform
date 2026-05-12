package com.adoptionplatform.backend.repository;

import com.adoptionplatform.backend.entity.AdoptionRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

import java.util.List;

public interface AdoptionRequestRepository extends JpaRepository<AdoptionRequest, Long> {
    List<AdoptionRequest> findByUserId(Long userId);

    boolean existsByUserIdAndRequestPhase(Long userId, String requestPhase);

    @Modifying
    void deleteByUserId(Long userId);
}