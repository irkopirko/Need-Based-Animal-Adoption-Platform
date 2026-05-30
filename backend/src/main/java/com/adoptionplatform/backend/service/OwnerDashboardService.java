package com.adoptionplatform.backend.service;

import com.adoptionplatform.backend.dto.OwnerDashboardDto;
import com.adoptionplatform.backend.dto.OwnerDashboardSummaryDto;
import com.adoptionplatform.backend.repository.AnimalRepository;
import com.adoptionplatform.backend.repository.ListingInquiryRepository;
import com.adoptionplatform.backend.repository.MatchSnapshotRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class OwnerDashboardService {

    private static final double STRONG_MATCH_THRESHOLD = 75.0;

    private final AnimalService animalService;
    private final InquiryService inquiryService;
    private final MatchSnapshotRepository matchSnapshotRepository;
    private final AnimalRepository animalRepository;
    private final ListingInquiryRepository listingInquiryRepository;

    public OwnerDashboardService(
            AnimalService animalService,
            InquiryService inquiryService,
            MatchSnapshotRepository matchSnapshotRepository,
            AnimalRepository animalRepository,
            ListingInquiryRepository listingInquiryRepository
    ) {
        this.animalService = animalService;
        this.inquiryService = inquiryService;
        this.matchSnapshotRepository = matchSnapshotRepository;
        this.animalRepository = animalRepository;
        this.listingInquiryRepository = listingInquiryRepository;
    }

    @Transactional(readOnly = true)
    public OwnerDashboardDto loadDashboard(Long ownerId, Long viewerId) {
        OwnerDashboardDto dto = new OwnerDashboardDto();
        dto.setListings(animalService.listAnimalsForOwner(ownerId, viewerId));
        dto.setInquiries(inquiryService.listForOwner(ownerId));
        dto.setStrongMatchListingIds(
                matchSnapshotRepository.findStrongMatchAnimalIdsForOwner(ownerId, STRONG_MATCH_THRESHOLD)
        );
        return dto;
    }

    @Transactional(readOnly = true)
    public OwnerDashboardSummaryDto loadSummary(Long ownerId, Long viewerId) {
        if (ownerId == null || viewerId == null) {
            throw new IllegalArgumentException("Owner id and viewer id are required");
        }
        if (!ownerId.equals(viewerId)) {
            throw new IllegalArgumentException("You can only load your own dashboard summary");
        }
        OwnerDashboardSummaryDto summary = new OwnerDashboardSummaryDto();
        summary.setActiveListings((int) animalRepository.countActiveListingsByOwner(ownerId));
        summary.setAdoptedCount((int) animalRepository.countAdoptedListingsByOwner(ownerId));
        summary.setArchivedCount((int) animalRepository.countArchivedListingsByOwner(ownerId));
        summary.setPendingRequests(
                (int) listingInquiryRepository.countByOwnerAndStatusForOpenListings(ownerId, "PENDING")
        );
        summary.setAcceptedInquiries(
                (int) listingInquiryRepository.countByOwnerAndStatusForOpenListings(ownerId, "ACCEPTED")
        );
        return summary;
    }
}
