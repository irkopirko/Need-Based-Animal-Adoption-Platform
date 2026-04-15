package com.adoptionplatform.backend.repository;

import com.adoptionplatform.backend.entity.AdopterProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AdopterProfileRepository extends JpaRepository<AdopterProfile, Long> {
    Optional<AdopterProfile> findByUserId(Long userId);
}