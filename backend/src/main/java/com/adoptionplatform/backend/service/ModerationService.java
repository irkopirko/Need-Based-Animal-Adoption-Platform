package com.adoptionplatform.backend.service;

import com.adoptionplatform.backend.config.AdminConfig;
import com.adoptionplatform.backend.entity.Animal;
import com.adoptionplatform.backend.entity.User;
import com.adoptionplatform.backend.repository.AnimalRepository;
import com.adoptionplatform.backend.repository.ListingReportRepository;
import com.adoptionplatform.backend.repository.SavedAnimalRepository;
import com.adoptionplatform.backend.repository.UserRepository;
import com.adoptionplatform.backend.util.ListingCodeUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ModerationService {

    private final AdminConfig adminConfig;
    private final AnimalRepository animalRepository;
    private final UserRepository userRepository;
    private final SavedAnimalRepository savedAnimalRepository;
    private final ListingReportRepository listingReportRepository;
    private final EmailService emailService;
    private final ListingReportService listingReportService;

    public ModerationService(
            AdminConfig adminConfig,
            AnimalRepository animalRepository,
            UserRepository userRepository,
            SavedAnimalRepository savedAnimalRepository,
            ListingReportRepository listingReportRepository,
            EmailService emailService,
            ListingReportService listingReportService
    ) {
        this.adminConfig = adminConfig;
        this.animalRepository = animalRepository;
        this.userRepository = userRepository;
        this.savedAnimalRepository = savedAnimalRepository;
        this.listingReportRepository = listingReportRepository;
        this.emailService = emailService;
        this.listingReportService = listingReportService;
    }

    public void assertAdmin(String adminEmail) {
        if (!adminConfig.isAdminEmail(adminEmail)) {
            throw new IllegalArgumentException("Not authorized as admin");
        }
    }

    @Transactional
    public Animal adminArchiveListing(Long animalId, String adminEmail, String reason) {
        assertAdmin(adminEmail);
        Animal animal = animalRepository.findById(animalId)
                .orElseThrow(() -> new IllegalArgumentException("Listing not found"));
        animal.setListingStatus("ARCHIVED");
        Animal saved = animalRepository.save(animal);
        notifyOwner(saved, "archived", reason);
        resolveReportsForAnimal(animalId);
        return saved;
    }

    @Transactional
    public void adminDeleteListing(Long animalId, String adminEmail, String reason) {
        assertAdmin(adminEmail);
        Animal animal = animalRepository.findById(animalId)
                .orElseThrow(() -> new IllegalArgumentException("Listing not found"));
        notifyOwner(animal, "deleted", reason);
        resolveReportsForAnimal(animalId);
        savedAnimalRepository.deleteByAnimalIdIn(List.of(animalId));
        animalRepository.deleteById(animalId);
    }

    private void resolveReportsForAnimal(Long animalId) {
        listingReportRepository.findByAnimalId(animalId).forEach(r -> {
            if ("PENDING".equalsIgnoreCase(r.getStatus())) {
                listingReportService.markResolved(r.getId());
            }
        });
    }

    private void notifyOwner(Animal animal, String action, String reason) {
        Long ownerId = animal.getOwnerId();
        if (ownerId == null) {
            return;
        }
        User owner = userRepository.findById(ownerId).orElse(null);
        if (owner == null || owner.getEmail() == null || owner.getEmail().isBlank()) {
            return;
        }
        String listingCode = ListingCodeUtil.format(animal.getId());
        emailService.sendListingModerationNotice(
                owner.getEmail(),
                listingCode,
                animal.getId(),
                action,
                reason
        );
    }
}
