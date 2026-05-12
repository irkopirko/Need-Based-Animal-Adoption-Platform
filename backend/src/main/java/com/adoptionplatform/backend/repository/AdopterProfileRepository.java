package com.adoptionplatform.backend.repository;

import com.adoptionplatform.backend.entity.AdopterProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

import java.util.Optional;

public interface AdopterProfileRepository extends JpaRepository<AdopterProfile, Long> {
    Optional<AdopterProfile> findByUserId(Long userId);

    @Modifying
    void deleteByUserId(Long userId);
}