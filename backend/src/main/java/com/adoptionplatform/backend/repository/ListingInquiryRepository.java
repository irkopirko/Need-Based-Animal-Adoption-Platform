package com.adoptionplatform.backend.repository;

import com.adoptionplatform.backend.entity.ListingInquiry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ListingInquiryRepository extends JpaRepository<ListingInquiry, Long> {

    List<ListingInquiry> findByOwnerUserIdOrderByCreatedAtDesc(Long ownerUserId);

    List<ListingInquiry> findByAdopterUserIdOrderByCreatedAtDesc(Long adopterUserId);

    Optional<ListingInquiry> findByAnimalIdAndAdopterUserId(Long animalId, Long adopterUserId);

    List<ListingInquiry> findByAnimalId(Long animalId);

    @Query("""
            SELECT COUNT(i) FROM ListingInquiry i
            WHERE i.ownerUserId = :ownerId
              AND UPPER(TRIM(i.status)) = :status
              AND EXISTS (
                SELECT 1 FROM Animal a
                WHERE a.id = i.animalId
                  AND (a.listingStatus IS NULL
                       OR UPPER(TRIM(a.listingStatus)) NOT IN ('ARCHIVED', 'DELETED', 'ADOPTED', 'RESERVED'))
              )
            """)
    long countByOwnerAndStatusForOpenListings(
            @Param("ownerId") Long ownerId,
            @Param("status") String status
    );
}
