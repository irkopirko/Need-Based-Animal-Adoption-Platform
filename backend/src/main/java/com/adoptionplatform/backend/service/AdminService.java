package com.adoptionplatform.backend.service;

import com.adoptionplatform.backend.dto.admin.AdminAnimalDto;
import com.adoptionplatform.backend.dto.admin.AdminLoginLogDto;
import com.adoptionplatform.backend.dto.admin.AdminRequestDto;
import com.adoptionplatform.backend.dto.admin.AdminStatsDto;
import com.adoptionplatform.backend.dto.admin.AdminUserDto;
import com.adoptionplatform.backend.config.AdminConfig;
import com.adoptionplatform.backend.entity.AdoptionRequest;
import com.adoptionplatform.backend.entity.Animal;
import com.adoptionplatform.backend.entity.LoginLog;
import com.adoptionplatform.backend.entity.User;
import com.adoptionplatform.backend.repository.AdoptionCaseRepository;
import com.adoptionplatform.backend.repository.AdoptionRequestRepository;
import com.adoptionplatform.backend.repository.AnimalRepository;
import com.adoptionplatform.backend.repository.LoginLogRepository;
import com.adoptionplatform.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final AnimalRepository animalRepository;
    private final AdoptionRequestRepository adoptionRequestRepository;
    private final AdoptionCaseRepository adoptionCaseRepository;
    private final LoginLogRepository loginLogRepository;
    private final AdminConfig adminConfig;

    public AdminService(
            UserRepository userRepository,
            AnimalRepository animalRepository,
            AdoptionRequestRepository adoptionRequestRepository,
            AdoptionCaseRepository adoptionCaseRepository,
            LoginLogRepository loginLogRepository,
            AdminConfig adminConfig
    ) {
        this.userRepository = userRepository;
        this.animalRepository = animalRepository;
        this.adoptionRequestRepository = adoptionRequestRepository;
        this.adoptionCaseRepository = adoptionCaseRepository;
        this.loginLogRepository = loginLogRepository;
        this.adminConfig = adminConfig;
    }

    public AdminStatsDto getStats() {
        AdminStatsDto dto = new AdminStatsDto();
        dto.setTotalUsers(userRepository.count());
        dto.setTotalAnimals(animalRepository.count());
        dto.setTotalAdoptionRequests(adoptionRequestRepository.count());
        dto.setTotalCompletedAdoptions(
                adoptionCaseRepository.findAll().stream()
                        .filter(c -> "COMPLETED".equalsIgnoreCase(String.valueOf(c.getStatus())))
                        .count()
        );
        dto.setTotalSuccessfulLogins(loginLogRepository.countBySuccessful(true));
        dto.setTotalFailedLogins(loginLogRepository.countBySuccessful(false));
        return dto;
    }

    public List<AdminUserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toAdminUserDto)
                .collect(Collectors.toList());
    }

    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (adminConfig.isProtectedAdmin(user)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin accounts cannot be deleted");
        }
        userRepository.deleteById(id);
    }

    public AdminUserDto deactivateUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (adminConfig.isProtectedAdmin(user)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin accounts cannot be deactivated");
        }
        user.setActive(false);
        userRepository.save(user);
        return toAdminUserDto(user);
    }

    public List<AdminAnimalDto> getAllAnimals() {
        return animalRepository.findAll().stream()
                .map(this::toAdminAnimalDto)
                .collect(Collectors.toList());
    }

    public List<AdminRequestDto> getAllRequests() {
        return adoptionRequestRepository.findAll().stream()
                .map(this::toAdminRequestDto)
                .collect(Collectors.toList());
    }

    public List<AdminLoginLogDto> getAllLoginLogs() {
        return loginLogRepository.findAll().stream()
                .map(this::toAdminLoginLogDto)
                .collect(Collectors.toList());
    }

    private AdminUserDto toAdminUserDto(User user) {
        AdminUserDto dto = new AdminUserDto();
        dto.setId(user.getId());
        dto.setFullName(user.getFullName());
        dto.setEmail(user.getEmail());
        dto.setLocation(user.getLocation());
        dto.setPhone(user.getPhone());
        dto.setAddressLine(user.getAddressLine());
        dto.setBirthYear(user.getBirthYear());
        dto.setGender(user.getGender());
        dto.setRole(user.getRole().name());
        dto.setAdopterProfileCompleted(user.getAdopterProfileCompleted());
        dto.setOwnerProfileCompleted(user.getOwnerProfileCompleted());
        dto.setOwnerListingType(user.getOwnerListingType());
        dto.setEmailVerified(user.isEmailVerified());
        dto.setActive(user.isActive());
        dto.setRegistrationTime(user.getRegistrationTime());
        return dto;
    }

    private AdminAnimalDto toAdminAnimalDto(Animal animal) {
        AdminAnimalDto dto = new AdminAnimalDto();
        dto.setId(animal.getId());
        dto.setName(animal.getName());
        dto.setAnimalType(animal.getAnimalType());
        dto.setBreed(animal.getBreed());
        dto.setAgeGroup(animal.getAgeGroup());
        dto.setSize(animal.getSize());
        dto.setEnergyLevel(animal.getEnergyLevel());
        dto.setGroomingNeed(animal.getGroomingNeed());
        dto.setSpecialNeeds(animal.getSpecialNeeds());
        dto.setGoodWithChildren(animal.getGoodWithChildren());
        dto.setGoodWithPets(animal.getGoodWithPets());
        dto.setDescription(animal.getDescription());
        dto.setListingStatus(animal.getListingStatus());
        dto.setCompatibilityScore(animal.getCompatibilityScore());
        dto.setHousingLocation(animal.getHousingLocation());
        dto.setOwnerId(animal.getOwnerId());
        if (animal.getImages() != null) {
            dto.setImages(new ArrayList<>(animal.getImages()));
        }
        dto.setRegisterTime(animal.getRegisterTime());
        return dto;
    }

    private AdminRequestDto toAdminRequestDto(AdoptionRequest r) {
        AdminRequestDto dto = new AdminRequestDto();
        dto.setId(r.getId());
        dto.setUserId(r.getUserId());
        dto.setIndoorSpace(r.getIndoorSpace());
        dto.setLivingSpace(r.getLivingSpace());
        dto.setLivingSpaceOther(r.getLivingSpaceOther());
        dto.setHousingStatus(r.getHousingStatus());
        dto.setHasGarden(r.getHasGarden());
        dto.setOutdoorAccess(r.getOutdoorAccess());
        dto.setActivityLevel(r.getActivityLevel());
        dto.setWorkSchedule(r.getWorkSchedule());
        dto.setTimeAtHome(r.getTimeAtHome());
        dto.setHouseholdType(r.getHouseholdType());
        dto.setHasChildren(r.getHasChildren());
        dto.setChildrenAgeGroup(r.getChildrenAgeGroup());
        dto.setHasOtherPets(r.getHasOtherPets());
        dto.setOtherPetsType(r.getOtherPetsType());
        dto.setOtherPetsTypeOther(r.getOtherPetsTypeOther());
        dto.setPrimaryCaretaker(r.getPrimaryCaretaker());
        dto.setPrimaryCaretakerOther(r.getPrimaryCaretakerOther());
        dto.setHasPreviousExperience(r.getHasPreviousExperience());
        dto.setPreviousPetTypes(r.getPreviousPetTypes());
        dto.setPreviousPetTypesOther(r.getPreviousPetTypesOther());
        dto.setPreferredAnimalTypes(r.getPreferredAnimalTypes());
        dto.setPreferredEnergyLevels(r.getPreferredEnergyLevels());
        dto.setPreferredAgeRanges(r.getPreferredAgeRanges());
        dto.setPreferredSizes(r.getPreferredSizes());
        dto.setGroomingTolerance(r.getGroomingTolerance());
        dto.setSpecialNeedsAcceptance(r.getSpecialNeedsAcceptance());
        dto.setNotes(r.getNotes());
        dto.setRequestTime(r.getRequestTime());
        dto.setRequestPhase(r.getRequestPhase());
        return dto;
    }

    private AdminLoginLogDto toAdminLoginLogDto(LoginLog log) {
        AdminLoginLogDto dto = new AdminLoginLogDto();
        dto.setId(log.getId());
        dto.setUserId(log.getUserId());
        dto.setEmail(log.getEmail());
        dto.setRole(log.getRole());
        dto.setSuccessful(log.isSuccessful());
        dto.setMessage(log.getMessage());
        dto.setLoginTime(log.getLoginTime());
        return dto;
    }
}
