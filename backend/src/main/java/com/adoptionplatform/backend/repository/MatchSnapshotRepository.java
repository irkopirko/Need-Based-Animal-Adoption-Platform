package com.adoptionplatform.backend.repository;

import com.adoptionplatform.backend.entity.MatchSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MatchSnapshotRepository extends JpaRepository<MatchSnapshot, Long> {

    @Query(value = """
            SELECT DISTINCT ms.animal_id
            FROM match_snapshots ms
            INNER JOIN animals a ON a.id = ms.animal_id
            WHERE a.owner_id = :ownerId
              AND ms.match_percentage >= :minPct
              AND (a.listing_status IS NULL
                   OR UPPER(TRIM(a.listing_status)) NOT IN ('ARCHIVED', 'DELETED', 'ADOPTED', 'RESERVED'))
            """, nativeQuery = true)
    List<Long> findStrongMatchAnimalIdsForOwner(
            @Param("ownerId") Long ownerId,
            @Param("minPct") double minPct
    );

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

    void deleteByAnimalId(Long animalId);

    @Query(value = """
            SELECT COUNT(DISTINCT ms.animal_id)
            FROM match_snapshots ms
            INNER JOIN animals a ON a.id = ms.animal_id
            WHERE ms.adopter_user_id = :adopterUserId
              AND ms.adoption_request_id = :requestId
              AND ms.match_percentage >= :minPct
              AND (a.listing_status IS NULL
                   OR UPPER(TRIM(a.listing_status)) NOT IN ('ARCHIVED', 'DELETED', 'ADOPTED', 'RESERVED'))
            """, nativeQuery = true)
    long countStrongMatchesForAdopterRequest(
            @Param("adopterUserId") Long adopterUserId,
            @Param("requestId") Long requestId,
            @Param("minPct") double minPct
    );

    @Query(value = """
            SELECT
              a.id AS animalId,
              a.name AS name,
              a.animal_type AS animalType,
              a.breed AS breed,
              a.age_group AS ageGroup,
              a.size AS size,
              a.energy_level AS energyLevel,
              a.housing_location AS housingLocation,
              a.gender AS gender,
              a.grooming_need AS groomingNeed,
              a.special_needs AS specialNeeds,
              a.good_with_children AS goodWithChildren,
              a.good_with_pets AS goodWithPets,
              a.description AS description,
              ms.match_percentage AS matchPercentage,
              ms.match_reasons_json AS matchReasonsJson,
              (
                SELECT ai.image_url
                FROM animal_images ai
                WHERE ai.animal_id = a.id
                ORDER BY ai.sort_order ASC
                LIMIT 1
              ) AS coverImageUrl,
              (
                SELECT CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END
                FROM saved_animals sa
                WHERE sa.user_id = :adopterUserId AND sa.animal_id = a.id
              ) AS savedFlag
            FROM match_snapshots ms
            INNER JOIN animals a ON a.id = ms.animal_id
            WHERE ms.adopter_user_id = :adopterUserId
              AND ms.adoption_request_id = :requestId
              AND ms.match_percentage >= :minPct
              AND (a.listing_status IS NULL
                   OR UPPER(TRIM(a.listing_status)) NOT IN ('ARCHIVED', 'DELETED', 'ADOPTED', 'RESERVED'))
            ORDER BY ms.match_percentage DESC
            """, nativeQuery = true)
    List<CompatibleCardProjection> findCompatibleCardsForAdopter(
            @Param("adopterUserId") Long adopterUserId,
            @Param("requestId") Long requestId,
            @Param("minPct") double minPct
    );
}
