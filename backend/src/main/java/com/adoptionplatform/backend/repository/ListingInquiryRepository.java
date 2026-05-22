package com.adoptionplatform.backend.repository;

import com.adoptionplatform.backend.entity.ListingInquiry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ListingInquiryRepository extends JpaRepository<ListingInquiry, Long> {

    List<ListingInquiry> findByOwnerUserIdOrderByCreatedAtDesc(Long ownerUserId);

    List<ListingInquiry> findByAdopterUserIdOrderByCreatedAtDesc(Long adopterUserId);

    Optional<ListingInquiry> findByAnimalIdAndAdopterUserId(Long animalId, Long adopterUserId);

    List<ListingInquiry> findByAnimalId(Long animalId);
}
