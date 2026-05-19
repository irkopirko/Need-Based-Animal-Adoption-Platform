package com.adoptionplatform.backend.repository;

import com.adoptionplatform.backend.entity.ListingReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ListingReportRepository extends JpaRepository<ListingReport, Long> {

    List<ListingReport> findByStatusOrderByCreatedAtDesc(String status);

    List<ListingReport> findByAnimalId(Long animalId);

    boolean existsByAnimalIdAndReporterUserIdAndStatus(Long animalId, Long reporterUserId, String status);
}
