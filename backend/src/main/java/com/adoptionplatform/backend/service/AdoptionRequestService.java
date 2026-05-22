package com.adoptionplatform.backend.service;

import com.adoptionplatform.backend.dto.AdoptionRequestDto;
import com.adoptionplatform.backend.entity.AdoptionRequest;
import com.adoptionplatform.backend.repository.AdoptionRequestRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.StringJoiner;

@Service
public class AdoptionRequestService {

    private final AdoptionRequestRepository adoptionRequestRepository;
    private final MatchSnapshotService matchSnapshotService;

    public AdoptionRequestService(
            AdoptionRequestRepository adoptionRequestRepository,
            MatchSnapshotService matchSnapshotService
    ) {
        this.adoptionRequestRepository = adoptionRequestRepository;
        this.matchSnapshotService = matchSnapshotService;
    }

    public AdoptionRequest saveRequest(AdoptionRequestDto dto) {
        AdoptionRequest request = new AdoptionRequest();

        request.setUserId(dto.getUserId());

        request.setIndoorSpace(defaultText(dto.getIndoorSpace(), "Small, Medium, Large"));
        request.setLivingSpace(defaultText(dto.getLivingSpace(), "House, Villa, Apartment, Studio, Other"));
        request.setLivingSpaceOther(dto.getLivingSpaceOther());
        request.setHousingStatus(defaultText(dto.getHousingStatus(), "Owner, Renter, Family Home"));
        request.setHasGarden(defaultText(dto.getHasGarden(), "Yes, No"));
        request.setOutdoorAccess(defaultText(dto.getOutdoorAccess(), "Private Yard, Balcony, Terrace, Shared Outdoor Area, None"));

        request.setActivityLevel(defaultText(dto.getActivityLevel(), "Low, Medium, High"));
        request.setWorkSchedule(defaultText(dto.getWorkSchedule(), "Mostly Remote, Hybrid, Mostly Outside, Flexible"));
        request.setTimeAtHome(defaultText(dto.getTimeAtHome(), "Most of the day, About half the day, Mostly evenings, Mostly weekends"));

        request.setHouseholdType(defaultText(dto.getHouseholdType(), "Single Person, Couple, Family, Shared Household"));
        request.setHasChildren(defaultText(dto.getHasChildren(), "Yes, No"));
        request.setChildrenAgeGroup(defaultList(dto.getChildrenAgeGroup(), "0-5", "6-12", "13+"));

        request.setHasOtherPets(defaultText(dto.getHasOtherPets(), "Yes, No"));
        request.setOtherPetsType(defaultList(dto.getOtherPetsType(), "Dog", "Cat", "Other"));
        request.setOtherPetsTypeOther(dto.getOtherPetsTypeOther());

        request.setPrimaryCaretaker(defaultText(dto.getPrimaryCaretaker(), "Me, My Spouse, Shared Responsibility, Another Family Member, Other"));
        request.setPrimaryCaretakerOther(dto.getPrimaryCaretakerOther());
        request.setHasPreviousExperience(defaultText(dto.getHasPreviousExperience(), "Yes, No"));
        request.setPreviousPetTypes(defaultList(dto.getPreviousPetTypes(), "Dog", "Cat", "Other"));
        request.setPreviousPetTypesOther(dto.getPreviousPetTypesOther());

        request.setPreferredAnimalTypes(defaultList(dto.getPreferredAnimalTypes(), "Dog", "Cat"));
        request.setPreferredEnergyLevels(defaultList(dto.getPreferredEnergyLevels(), "Calm", "Balanced", "Active"));
        request.setPreferredAgeRanges(defaultList(dto.getPreferredAgeRanges(),
                "Dog - Puppy / Young", "Dog - Adult", "Dog - Senior",
                "Cat - Kitten / Young", "Cat - Adult", "Cat - Senior"
        ));
        request.setPreferredSizes(defaultList(dto.getPreferredSizes(), "Dog - Small", "Dog - Medium", "Dog - Large"));
        request.setPreferredGenders(defaultList(dto.getPreferredGenders(), "Male", "Female"));
        request.setGroomingTolerance(defaultList(dto.getGroomingTolerance(),
                "Dog - Low Grooming", "Dog - Medium Grooming", "Dog - High Grooming",
                "Cat - Low Grooming", "Cat - Medium Grooming", "Cat - High Grooming"
        ));

        request.setSpecialNeedsAcceptance(defaultText(dto.getSpecialNeedsAcceptance(), "Yes, No, Depends on the case"));
        request.setNotes(dto.getNotes());
        request.setRequestTime(LocalDateTime.now(ZoneId.of("Europe/Istanbul")));
        request.setRequestPhase("DRAFT");
        return adoptionRequestRepository.save(request);
    }

    public AdoptionRequest submitAdoptionRequest(Long id, Long userId) {
        AdoptionRequest request = adoptionRequestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Adoption request not found"));
        if (request.getUserId() == null || !request.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Not allowed to update this request");
        }
        if ("SUBMITTED".equals(request.getRequestPhase())) {
            return request;
        }
        request.setRequestPhase("SUBMITTED");
        AdoptionRequest saved = adoptionRequestRepository.save(request);
        matchSnapshotService.refreshSnapshotsForRequest(
                userId,
                saved.getId(),
                MatchService.STRONG_MATCH_THRESHOLD
        );
        return saved;
    }

    public List<AdoptionRequest> getRequestsByUserId(Long userId) {
        return adoptionRequestRepository.findByUserId(userId);
    }

    private String defaultText(String value, String defaultValue) {
        if (value == null || value.trim().isEmpty()) {
            return defaultValue;
        }
        return value;
    }

    private String defaultList(List<String> values, String... defaults) {
        if (values == null || values.isEmpty()) {
            StringJoiner joiner = new StringJoiner(", ");
            for (String item : defaults) {
                joiner.add(item);
            }
            return joiner.toString();
        }

        return String.join(", ", values);
    }
}