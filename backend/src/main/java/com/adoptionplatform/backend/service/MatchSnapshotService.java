package com.adoptionplatform.backend.service;

import com.adoptionplatform.backend.dto.MatchSnapshotViewDto;
import com.adoptionplatform.backend.entity.AdoptionRequest;
import com.adoptionplatform.backend.entity.Animal;
import com.adoptionplatform.backend.entity.MatchSnapshot;
import com.adoptionplatform.backend.entity.User;
import com.adoptionplatform.backend.repository.AdoptionRequestRepository;
import com.adoptionplatform.backend.repository.AnimalRepository;
import com.adoptionplatform.backend.repository.MatchSnapshotRepository;
import com.adoptionplatform.backend.repository.UserRepository;
import com.adoptionplatform.backend.util.ListingCodeUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class MatchSnapshotService {

    private final MatchSnapshotRepository snapshotRepository;
    private final AdoptionRequestRepository adoptionRequestRepository;
    private final AnimalRepository animalRepository;
    private final UserRepository userRepository;
    private final MatchService matchService;

    public MatchSnapshotService(
            MatchSnapshotRepository snapshotRepository,
            AdoptionRequestRepository adoptionRequestRepository,
            AnimalRepository animalRepository,
            UserRepository userRepository,
            MatchService matchService
    ) {
        this.snapshotRepository = snapshotRepository;
        this.adoptionRequestRepository = adoptionRequestRepository;
        this.animalRepository = animalRepository;
        this.userRepository = userRepository;
        this.matchService = matchService;
    }

    @Transactional
    public int refreshSnapshotsForRequest(Long adopterUserId, Long adoptionRequestId, double minThreshold) {
        AdoptionRequest request = adoptionRequestRepository.findById(adoptionRequestId)
                .orElseThrow(() -> new IllegalArgumentException("Adoption request not found"));
        if (!Objects.equals(request.getUserId(), adopterUserId)) {
            throw new IllegalArgumentException("Not allowed to refresh matches for this request");
        }
        if (!"SUBMITTED".equalsIgnoreCase(String.valueOf(request.getRequestPhase()))) {
            throw new IllegalArgumentException("Submit the adoption request before refreshing matches");
        }

        snapshotRepository.deleteByAdopterUserIdAndAdoptionRequestId(adopterUserId, adoptionRequestId);
        LocalDateTime now = LocalDateTime.now(ZoneId.of("Europe/Istanbul"));
        int saved = 0;

        for (Animal animal : animalRepository.findAll()) {
            if (!matchService.isListedForPublicMatching(animal)) {
                continue;
            }
            MatchService.AnimalMatchScore score = matchService.scoreAnimal(request, animal);
            if (score.percentage() < minThreshold) {
                continue;
            }
            MatchSnapshot snap = new MatchSnapshot();
            snap.setAdopterUserId(adopterUserId);
            snap.setAnimalId(animal.getId());
            snap.setAdoptionRequestId(adoptionRequestId);
            snap.setMatchPercentage(score.percentage());
            snap.setMatchReasonsJson(encodeReasons(score.reasons()));
            snap.setCreatedAt(now);
            snap.setUpdatedAt(now);
            snapshotRepository.save(snap);
            animal.setCompatibilityScore(score.percentage());
            animalRepository.save(animal);
            saved++;
        }
        return saved;
    }

    @Transactional(readOnly = true)
    public Double resolveMatchPercentage(Long adopterUserId, Long animalId, Long adoptionRequestId) {
        if (adoptionRequestId != null) {
            return snapshotRepository
                    .findByAdopterUserIdAndAnimalIdAndAdoptionRequestId(adopterUserId, animalId, adoptionRequestId)
                    .map(MatchSnapshot::getMatchPercentage)
                    .orElseGet(() -> computeLive(adopterUserId, animalId, adoptionRequestId));
        }
        return computeLive(adopterUserId, animalId, null);
    }

    @Transactional(readOnly = true)
    public List<MatchSnapshotViewDto> listForOwnerAnimal(Long animalId, Long ownerId) {
        Animal animal = animalRepository.findById(animalId)
                .orElseThrow(() -> new IllegalArgumentException("Listing not found"));
        if (!Objects.equals(animal.getOwnerId(), ownerId)) {
            throw new IllegalArgumentException("Not authorized for this listing");
        }
        return snapshotRepository.findByAnimalIdOrderByMatchPercentageDesc(animalId).stream()
                .map(this::toView)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MatchSnapshotViewDto> listForAdopter(Long adopterUserId, Long adoptionRequestId) {
        return snapshotRepository
                .findByAdopterUserIdAndAdoptionRequestIdOrderByMatchPercentageDesc(adopterUserId, adoptionRequestId)
                .stream()
                .map(this::toView)
                .collect(Collectors.toList());
    }

    private Double computeLive(Long adopterUserId, Long animalId, Long adoptionRequestId) {
        AdoptionRequest request = adoptionRequestRepository.findById(adoptionRequestId)
                .orElse(null);
        if (request == null) {
            List<AdoptionRequest> all = adoptionRequestRepository.findByUserId(adopterUserId);
            request = all.stream()
                    .filter(r -> "SUBMITTED".equalsIgnoreCase(String.valueOf(r.getRequestPhase())))
                    .max(Comparator.comparing(AdoptionRequest::getId, Comparator.nullsLast(Comparator.naturalOrder())))
                    .orElse(null);
        }
        if (request == null) {
            return null;
        }
        Animal animal = animalRepository.findById(animalId).orElse(null);
        if (animal == null) {
            return null;
        }
        return matchService.scoreAnimal(request, animal).percentage();
    }

    private MatchSnapshotViewDto toView(MatchSnapshot snap) {
        MatchSnapshotViewDto dto = new MatchSnapshotViewDto();
        dto.setId(snap.getId());
        dto.setAdopterUserId(snap.getAdopterUserId());
        dto.setAnimalId(snap.getAnimalId());
        dto.setAdoptionRequestId(snap.getAdoptionRequestId());
        dto.setMatchPercentage(snap.getMatchPercentage());
        dto.setMatchReasons(decodeReasons(snap.getMatchReasonsJson()));
        dto.setUpdatedAt(snap.getUpdatedAt());
        dto.setListingCode(ListingCodeUtil.format(snap.getAnimalId()));
        animalRepository.findById(snap.getAnimalId()).ifPresent(a -> dto.setAnimalName(a.getName()));
        userRepository.findById(snap.getAdopterUserId()).ifPresent(u -> {
            dto.setAdopterName(u.getFullName());
            dto.setAdopterEmail(u.getEmail());
        });
        return dto;
    }

    private static String encodeReasons(List<String> reasons) {
        if (reasons == null || reasons.isEmpty()) {
            return "";
        }
        return reasons.stream()
                .map(r -> r == null ? "" : r.replace("\u001e", " ").trim())
                .filter(s -> !s.isEmpty())
                .collect(Collectors.joining("\u001e"));
    }

    private static List<String> decodeReasons(String raw) {
        if (raw == null || raw.isBlank()) {
            return new ArrayList<>();
        }
        if (raw.startsWith("[")) {
            return new ArrayList<>();
        }
        List<String> out = new ArrayList<>();
        for (String part : raw.split("\u001e")) {
            if (part != null && !part.isBlank()) {
                out.add(part.trim());
            }
        }
        return out;
    }
}
