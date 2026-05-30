package com.adoptionplatform.backend.repository;

import com.adoptionplatform.backend.entity.Animal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface AnimalRepository extends JpaRepository<Animal, Long> {

    List<Animal> findByCompatibilityScoreGreaterThanEqual(Double score);

    @Query("""
            SELECT a FROM Animal a
            WHERE a.listingStatus IS NULL
               OR UPPER(TRIM(a.listingStatus)) NOT IN ('ARCHIVED', 'DELETED', 'ADOPTED', 'RESERVED')
            """)
    List<Animal> findAllForPublicMatching();

    List<Animal> findAllByIdIn(Collection<Long> ids);

    @Query("""
            SELECT COUNT(a) FROM Animal a
            WHERE a.owner.id = :ownerId
              AND (a.listingStatus IS NULL
                   OR UPPER(TRIM(a.listingStatus)) NOT IN ('ARCHIVED', 'DELETED', 'ADOPTED', 'RESERVED'))
            """)
    long countActiveListingsByOwner(@Param("ownerId") Long ownerId);

    @Query("""
            SELECT COUNT(a) FROM Animal a
            WHERE a.owner.id = :ownerId
              AND UPPER(TRIM(a.listingStatus)) = 'ADOPTED'
            """)
    long countAdoptedListingsByOwner(@Param("ownerId") Long ownerId);

    @Query("""
            SELECT COUNT(a) FROM Animal a
            WHERE a.owner.id = :ownerId
              AND UPPER(TRIM(a.listingStatus)) LIKE 'ARCHIV%'
            """)
    long countArchivedListingsByOwner(@Param("ownerId") Long ownerId);

    @Query(value = """
            SELECT
              a.id AS id,
              a.owner_id AS ownerId,
              a.name AS name,
              a.animal_type AS animalType,
              a.breed AS breed,
              a.age_group AS ageGroup,
              a.`size` AS size,
              a.energy_level AS energyLevel,
              a.grooming_need AS groomingNeed,
              a.special_needs AS specialNeeds,
              a.good_with_children AS goodWithChildren,
              a.good_with_pets AS goodWithPets,
              a.description AS description,
              a.listing_status AS listingStatus,
              a.gender AS gender,
              a.housing_location AS housingLocation,
              a.register_time AS registerTime,
              (
                SELECT GROUP_CONCAT(ai.image_url ORDER BY ai.sort_order ASC SEPARATOR CHAR(30))
                FROM animal_images ai
                WHERE ai.animal_id = a.id
              ) AS imageUrlsPacked
            FROM animals a
            WHERE a.owner_id = :ownerId
            ORDER BY a.register_time DESC
            """, nativeQuery = true)
    List<OwnerListingCardProjection> findOwnerListingCards(@Param("ownerId") Long ownerId);

    @Query(value = """
            SELECT
              a.id AS id,
              a.name AS name,
              (
                SELECT ai.image_url
                FROM animal_images ai
                WHERE ai.animal_id = a.id
                ORDER BY ai.sort_order ASC
                LIMIT 1
              ) AS coverImageUrl
            FROM animals a
            WHERE a.id IN (:ids)
            """, nativeQuery = true)
    List<AnimalListingMetaProjection> findListingMetaByIdIn(@Param("ids") Collection<Long> ids);

    @Query(value = """
            SELECT
              a.id AS id,
              a.owner_id AS ownerId,
              a.name AS name,
              a.animal_type AS animalType,
              a.breed AS breed,
              a.age_group AS ageGroup,
              a.`size` AS size,
              a.energy_level AS energyLevel,
              a.grooming_need AS groomingNeed,
              a.special_needs AS specialNeeds,
              a.good_with_children AS goodWithChildren,
              a.good_with_pets AS goodWithPets,
              a.description AS description,
              a.listing_status AS listingStatus,
              a.gender AS gender,
              a.housing_location AS housingLocation,
              a.register_time AS registerTime,
              a.compatibility_score AS compatibilityScore,
              (
                SELECT GROUP_CONCAT(ai.image_url ORDER BY ai.sort_order ASC SEPARATOR CHAR(30))
                FROM animal_images ai
                WHERE ai.animal_id = a.id
              ) AS imageUrlsPacked
            FROM animals a
            WHERE a.id = :animalId
            """, nativeQuery = true)
    java.util.Optional<AnimalDetailProjection> findListingDetailById(@Param("animalId") Long animalId);
}

