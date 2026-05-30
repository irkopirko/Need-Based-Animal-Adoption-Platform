package com.adoptionplatform.backend.service;

import com.adoptionplatform.backend.dto.AdopterHomeSummaryDto;
import com.adoptionplatform.backend.dto.AdoptionRequestPhaseDto;
import com.adoptionplatform.backend.entity.AdoptionRequest;
import com.adoptionplatform.backend.entity.SavedAnimal;
import com.adoptionplatform.backend.repository.AdoptionRequestRepository;
import com.adoptionplatform.backend.repository.MatchSnapshotRepository;
import com.adoptionplatform.backend.repository.SavedAnimalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class AdopterHomeService {

    private static final double STRONG_MATCH_THRESHOLD = MatchService.STRONG_MATCH_THRESHOLD;

    private final AdoptionRequestRepository adoptionRequestRepository;
    private final SavedAnimalRepository savedAnimalRepository;
    private final MatchSnapshotRepository matchSnapshotRepository;

    public AdopterHomeService(
            AdoptionRequestRepository adoptionRequestRepository,
            SavedAnimalRepository savedAnimalRepository,
            MatchSnapshotRepository matchSnapshotRepository
    ) {
        this.adoptionRequestRepository = adoptionRequestRepository;
        this.savedAnimalRepository = savedAnimalRepository;
        this.matchSnapshotRepository = matchSnapshotRepository;
    }

    @Transactional(readOnly = true)
    public AdopterHomeSummaryDto loadSummary(Long userId) {
        AdopterHomeSummaryDto dto = new AdopterHomeSummaryDto();

        List<AdoptionRequestPhaseDto> stubs = new ArrayList<>();
        List<Long> submittedIds = new ArrayList<>();
        int draftCount = 0;
        for (AdoptionRequestRepository.RequestPhaseRow row : adoptionRequestRepository.findPhaseRowsByUserId(userId)) {
            stubs.add(new AdoptionRequestPhaseDto(row.getId(), row.getRequestPhase()));
            String phase = String.valueOf(row.getRequestPhase()).trim().toUpperCase();
            if ("SUBMITTED".equals(phase)) {
                submittedIds.add(row.getId());
            } else if (phase.isEmpty() || "DRAFT".equals(phase)) {
                draftCount++;
            }
        }
        dto.setRequests(stubs);
        dto.setDraftRequestCount(draftCount);
        dto.setSubmittedRequestCount(submittedIds.size());

        if (submittedIds.isEmpty()) {
            dto.setStrongMatchCount(0);
            dto.setSavedCount(0);
            return dto;
        }

        Optional<AdoptionRequest> primarySubmitted = adoptionRequestRepository
                .findTopByUserIdAndRequestPhaseIgnoreCaseOrderByRequestTimeDesc(userId, "SUBMITTED");
        Long primaryRequestId = primarySubmitted.map(AdoptionRequest::getId).orElse(submittedIds.get(0));
        dto.setPrimarySubmittedRequestId(primaryRequestId);

        dto.setStrongMatchCount((int) matchSnapshotRepository.countStrongMatchesForAdopterRequest(
                userId,
                primaryRequestId,
                STRONG_MATCH_THRESHOLD
        ));

        Set<Long> strongIds = new HashSet<>();
        matchSnapshotRepository
                .findCompatibleCardsForAdopter(userId, primaryRequestId, STRONG_MATCH_THRESHOLD)
                .forEach(row -> {
                    if (row.getAnimalId() != null) {
                        strongIds.add(row.getAnimalId());
                    }
                });

        dto.setSavedCount(
                collectSavedAnimalIds(userId, primaryRequestId, submittedIds.size() == 1, strongIds).size()
        );
        return dto;
    }

    private Set<Long> collectSavedAnimalIds(
            Long userId,
            Long requestId,
            boolean singleSubmitted,
            Set<Long> strongMatchAnimalIds
    ) {
        Set<Long> ids = new HashSet<>();
        List<SavedAnimal> rows = savedAnimalRepository.findByUserId(userId);
        for (SavedAnimal row : rows) {
            Long animalId = row.getAnimalId();
            if (animalId == null) {
                continue;
            }
            Long savedForRequest = row.getAdoptionRequestId();
            if (savedForRequest != null) {
                if (requestId.equals(savedForRequest)) {
                    ids.add(animalId);
                }
                continue;
            }
            if (singleSubmitted) {
                ids.add(animalId);
            } else if (strongMatchAnimalIds.contains(animalId)) {
                ids.add(animalId);
            }
        }
        return ids;
    }
}
