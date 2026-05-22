package com.adoptionplatform.backend.service;

import com.adoptionplatform.backend.dto.AdoptionCaseViewDto;
import com.adoptionplatform.backend.entity.AdoptionCase;
import com.adoptionplatform.backend.entity.Animal;
import com.adoptionplatform.backend.entity.ListingInquiry;
import com.adoptionplatform.backend.entity.User;
import com.adoptionplatform.backend.repository.AdoptionCaseRepository;
import com.adoptionplatform.backend.repository.AnimalRepository;
import com.adoptionplatform.backend.repository.ListingInquiryRepository;
import com.adoptionplatform.backend.repository.UserRepository;
import com.adoptionplatform.backend.util.ListingCodeUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class AdoptionCaseService {

    private static final ZoneId ZONE = ZoneId.of("Europe/Istanbul");

    private final AdoptionCaseRepository caseRepository;
    private final ListingInquiryRepository inquiryRepository;
    private final AnimalRepository animalRepository;
    private final UserRepository userRepository;
    private final AnimalService animalService;
    private final AdoptionAuditService auditService;
    private final EmailService emailService;

    public AdoptionCaseService(
            AdoptionCaseRepository caseRepository,
            ListingInquiryRepository inquiryRepository,
            AnimalRepository animalRepository,
            UserRepository userRepository,
            AnimalService animalService,
            AdoptionAuditService auditService,
            EmailService emailService
    ) {
        this.caseRepository = caseRepository;
        this.inquiryRepository = inquiryRepository;
        this.animalRepository = animalRepository;
        this.userRepository = userRepository;
        this.animalService = animalService;
        this.auditService = auditService;
        this.emailService = emailService;
    }

    @Transactional
    public AdoptionCase ensureProposedCase(
            ListingInquiry inquiry,
            Long adoptionRequestId,
            Double matchPercentage
    ) {
        LocalDateTime now = LocalDateTime.now(ZONE);
        AdoptionCase existing = caseRepository
                .findByAnimalIdAndAdopterUserId(inquiry.getAnimalId(), inquiry.getAdopterUserId())
                .orElse(null);

        if (existing != null) {
            if ("COMPLETED".equalsIgnoreCase(existing.getStatus())
                    || "CANCELLED".equalsIgnoreCase(existing.getStatus())) {
                throw new IllegalArgumentException("An adoption case already exists for this adopter and listing");
            }
            existing.setInquiryId(inquiry.getId());
            if (adoptionRequestId != null) {
                existing.setAdoptionRequestId(adoptionRequestId);
            }
            if (matchPercentage != null) {
                existing.setMatchPercentageSnapshot(matchPercentage);
            }
            existing.setUpdatedAt(now);
            return caseRepository.save(existing);
        }

        AdoptionCase created = new AdoptionCase();
        created.setAnimalId(inquiry.getAnimalId());
        created.setAdopterUserId(inquiry.getAdopterUserId());
        created.setOwnerUserId(inquiry.getOwnerUserId());
        created.setInquiryId(inquiry.getId());
        created.setAdoptionRequestId(adoptionRequestId);
        created.setMatchPercentageSnapshot(matchPercentage);
        created.setStatus("PROPOSED");
        created.setProposedAt(now);
        created.setUpdatedAt(now);
        AdoptionCase saved = caseRepository.save(created);
        auditService.record("ADOPTION_CASE", saved.getId(), inquiry.getAdopterUserId(), "PROPOSED", null);
        return saved;
    }

    @Transactional
    public AdoptionCaseViewDto acceptCaseForInquiry(Long inquiryId, Long ownerId) {
        ListingInquiry inquiry = loadOwnedInquiry(inquiryId, ownerId);
        AdoptionCase adoptionCase = caseRepository.findByInquiryId(inquiryId)
                .orElseGet(() -> ensureProposedCase(inquiry, inquiry.getAdoptionRequestId(), inquiry.getMatchPercentageAtContact()));

        if ("COMPLETED".equalsIgnoreCase(adoptionCase.getStatus())) {
            throw new IllegalArgumentException("Adoption already completed");
        }
        LocalDateTime now = LocalDateTime.now(ZONE);
        adoptionCase.setStatus("ACCEPTED");
        adoptionCase.setAcceptedAt(now);
        adoptionCase.setUpdatedAt(now);
        AdoptionCase saved = caseRepository.save(adoptionCase);
        auditService.record("ADOPTION_CASE", saved.getId(), ownerId, "ACCEPTED", "inquiry=" + inquiryId);
        notifyAdopter(inquiry.getAdopterUserId(), "Message request approved",
                "The owner approved your message request. You can continue the conversation.");
        return toView(saved);
    }

    @Transactional
    public AdoptionCaseViewDto reserveForAdopter(Long caseId, Long ownerId) {
        AdoptionCase adoptionCase = loadOwnedCase(caseId, ownerId);
        if ("COMPLETED".equalsIgnoreCase(adoptionCase.getStatus())) {
            throw new IllegalArgumentException("Adoption already completed");
        }
        if ("CANCELLED".equalsIgnoreCase(adoptionCase.getStatus())) {
            throw new IllegalArgumentException("Adoption case was cancelled");
        }

        LocalDateTime now = LocalDateTime.now(ZONE);
        adoptionCase.setStatus("RESERVED");
        adoptionCase.setReservedAt(now);
        adoptionCase.setUpdatedAt(now);
        caseRepository.save(adoptionCase);

        animalService.markListingReserved(adoptionCase.getAnimalId(), ownerId);
        cancelCompetingCases(adoptionCase, ownerId, now);

        auditService.record("ADOPTION_CASE", adoptionCase.getId(), ownerId, "RESERVED", null);
        notifyAdopter(adoptionCase.getAdopterUserId(), "Listing reserved for you",
                "The owner reserved this animal for you while the adoption process continues.");

        return toView(adoptionCase);
    }

    @Transactional
    public AdoptionCaseViewDto completeAdoption(Long caseId, Long ownerId) {
        AdoptionCase adoptionCase = loadOwnedCase(caseId, ownerId);
        String status = adoptionCase.getStatus() == null ? "" : adoptionCase.getStatus().toUpperCase();
        if (!"ACCEPTED".equals(status) && !"RESERVED".equals(status) && !"PROPOSED".equals(status)) {
            if ("COMPLETED".equals(status)) {
                return toView(adoptionCase);
            }
            throw new IllegalArgumentException("Cannot complete adoption from status: " + adoptionCase.getStatus());
        }

        LocalDateTime now = LocalDateTime.now(ZONE);
        adoptionCase.setStatus("COMPLETED");
        adoptionCase.setCompletedAt(now);
        adoptionCase.setUpdatedAt(now);
        caseRepository.save(adoptionCase);

        animalService.markListingAdopted(adoptionCase.getAnimalId(), ownerId);
        closeOtherInquiries(adoptionCase.getAnimalId(), adoptionCase.getAdopterUserId(), now);
        cancelCompetingCases(adoptionCase, ownerId, now);

        auditService.record("ADOPTION_CASE", adoptionCase.getId(), ownerId, "COMPLETED", null);
        Animal animal = animalRepository.findById(adoptionCase.getAnimalId()).orElse(null);
        String listingCode = ListingCodeUtil.format(adoptionCase.getAnimalId());
        String animalName = animal != null ? animal.getName() : "your listing";
        notifyAdopter(adoptionCase.getAdopterUserId(), "Adoption completed",
                "Congratulations! The adoption of " + animalName + " (" + listingCode + ") is marked complete.");
        notifyOwner(ownerId, "Adoption marked complete",
                "You marked " + animalName + " (" + listingCode + ") as adopted.");

        return toView(adoptionCase);
    }

    @Transactional
    public AdoptionCaseViewDto cancelCase(Long caseId, Long ownerId, String reason) {
        AdoptionCase adoptionCase = loadOwnedCase(caseId, ownerId);
        if ("COMPLETED".equalsIgnoreCase(adoptionCase.getStatus())) {
            throw new IllegalArgumentException("Cannot cancel a completed adoption");
        }
        LocalDateTime now = LocalDateTime.now(ZONE);
        adoptionCase.setStatus("CANCELLED");
        adoptionCase.setCancelledAt(now);
        adoptionCase.setUpdatedAt(now);
        caseRepository.save(adoptionCase);
        auditService.record("ADOPTION_CASE", adoptionCase.getId(), ownerId, "CANCELLED", reason);
        return toView(adoptionCase);
    }

    @Transactional(readOnly = true)
    public List<AdoptionCaseViewDto> listForOwner(Long ownerId) {
        return caseRepository.findByOwnerUserIdOrderByUpdatedAtDesc(ownerId).stream()
                .map(this::toView)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AdoptionCaseViewDto> listForAdopter(Long adopterUserId) {
        return caseRepository.findByAdopterUserIdOrderByUpdatedAtDesc(adopterUserId).stream()
                .map(this::toView)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AdoptionCaseViewDto getByInquiry(Long inquiryId, Long viewerUserId) {
        AdoptionCase adoptionCase = caseRepository.findByInquiryId(inquiryId)
                .orElseThrow(() -> new IllegalArgumentException("No adoption case for this inquiry"));
        if (!Objects.equals(adoptionCase.getOwnerUserId(), viewerUserId)
                && !Objects.equals(adoptionCase.getAdopterUserId(), viewerUserId)) {
            throw new IllegalArgumentException("Not authorized");
        }
        return toView(adoptionCase);
    }

    private void cancelCompetingCases(AdoptionCase winner, Long ownerId, LocalDateTime now) {
        List<AdoptionCase> others = caseRepository.findByAnimalIdOrderByUpdatedAtDesc(winner.getAnimalId());
        for (AdoptionCase other : others) {
            if (Objects.equals(other.getId(), winner.getId())) {
                continue;
            }
            String s = other.getStatus() == null ? "" : other.getStatus().toUpperCase();
            if ("COMPLETED".equals(s) || "CANCELLED".equals(s)) {
                continue;
            }
            other.setStatus("CANCELLED");
            other.setCancelledAt(now);
            other.setUpdatedAt(now);
            caseRepository.save(other);
            auditService.record("ADOPTION_CASE", other.getId(), ownerId, "AUTO_CANCELLED",
                    "winnerCase=" + winner.getId());
        }
    }

    private void closeOtherInquiries(Long animalId, Long winningAdopterId, LocalDateTime now) {
        for (ListingInquiry inquiry : inquiryRepository.findByAnimalId(animalId)) {
            if (Objects.equals(inquiry.getAdopterUserId(), winningAdopterId)) {
                continue;
            }
            if ("REJECTED".equalsIgnoreCase(inquiry.getStatus())) {
                continue;
            }
            inquiry.setStatus("REJECTED");
            inquiry.setUpdatedAt(now);
            inquiryRepository.save(inquiry);
        }
    }

    private AdoptionCase loadOwnedCase(Long caseId, Long ownerId) {
        AdoptionCase adoptionCase = caseRepository.findById(caseId)
                .orElseThrow(() -> new IllegalArgumentException("Adoption case not found"));
        if (!Objects.equals(adoptionCase.getOwnerUserId(), ownerId)) {
            throw new IllegalArgumentException("Not authorized for this adoption case");
        }
        return adoptionCase;
    }

    private ListingInquiry loadOwnedInquiry(Long inquiryId, Long ownerId) {
        ListingInquiry inquiry = inquiryRepository.findById(inquiryId)
                .orElseThrow(() -> new IllegalArgumentException("Inquiry not found"));
        if (!Objects.equals(inquiry.getOwnerUserId(), ownerId)) {
            throw new IllegalArgumentException("Not authorized for this inquiry");
        }
        return inquiry;
    }

    private AdoptionCaseViewDto toView(AdoptionCase adoptionCase) {
        AdoptionCaseViewDto dto = new AdoptionCaseViewDto();
        dto.setId(adoptionCase.getId());
        dto.setAnimalId(adoptionCase.getAnimalId());
        dto.setListingCode(ListingCodeUtil.format(adoptionCase.getAnimalId()));
        dto.setAdopterUserId(adoptionCase.getAdopterUserId());
        dto.setOwnerUserId(adoptionCase.getOwnerUserId());
        dto.setInquiryId(adoptionCase.getInquiryId());
        dto.setAdoptionRequestId(adoptionCase.getAdoptionRequestId());
        dto.setMatchPercentageSnapshot(adoptionCase.getMatchPercentageSnapshot());
        dto.setStatus(adoptionCase.getStatus());
        dto.setProposedAt(adoptionCase.getProposedAt());
        dto.setAcceptedAt(adoptionCase.getAcceptedAt());
        dto.setReservedAt(adoptionCase.getReservedAt());
        dto.setCompletedAt(adoptionCase.getCompletedAt());
        dto.setUpdatedAt(adoptionCase.getUpdatedAt());
        animalRepository.findById(adoptionCase.getAnimalId()).ifPresent(a -> dto.setAnimalName(a.getName()));
        userRepository.findById(adoptionCase.getAdopterUserId()).ifPresent(u -> {
            dto.setAdopterName(u.getFullName());
            dto.setAdopterEmail(u.getEmail());
        });
        return dto;
    }

    private void notifyAdopter(Long adopterUserId, String subject, String body) {
        userRepository.findById(adopterUserId).ifPresent(u -> {
            if (u.getEmail() != null && !u.getEmail().isBlank()) {
                emailService.sendAdoptionLifecycleNotice(u.getEmail(), subject, body);
            }
        });
    }

    private void notifyOwner(Long ownerUserId, String subject, String body) {
        userRepository.findById(ownerUserId).ifPresent(u -> {
            if (u.getEmail() != null && !u.getEmail().isBlank()) {
                emailService.sendAdoptionLifecycleNotice(u.getEmail(), subject, body);
            }
        });
    }
}
