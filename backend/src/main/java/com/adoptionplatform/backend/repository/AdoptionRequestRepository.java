package com.adoptionplatform.backend.repository;

import com.adoptionplatform.backend.entity.AdoptionRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AdoptionRequestRepository extends JpaRepository<AdoptionRequest, Long> {

    List<AdoptionRequest> findByUserId(Long userId);

    boolean existsByUserIdAndRequestPhase(Long userId, String requestPhase);

    @Modifying
    void deleteByUserId(Long userId);

    interface RequestPhaseRow {
        Long getId();

        String getRequestPhase();
    }

    @Query("""
            SELECT r.id AS id, r.requestPhase AS requestPhase
            FROM AdoptionRequest r
            WHERE r.userId = :userId
            """)
    List<RequestPhaseRow> findPhaseRowsByUserId(@Param("userId") Long userId);

    @Query("""
            SELECT COUNT(r)
            FROM AdoptionRequest r
            WHERE r.userId = :userId
              AND UPPER(COALESCE(r.requestPhase, '')) = 'SUBMITTED'
            """)
    long countSubmittedByUserId(@Param("userId") Long userId);

    Optional<AdoptionRequest> findTopByUserIdAndRequestPhaseIgnoreCaseOrderByRequestTimeDesc(
            Long userId,
            String requestPhase
    );
}
