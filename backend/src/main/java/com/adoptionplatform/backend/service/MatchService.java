package com.adoptionplatform.backend.service;

import com.adoptionplatform.backend.dto.MatchResultDto;
import com.adoptionplatform.backend.entity.AdoptionRequest;
import com.adoptionplatform.backend.entity.Animal;
import com.adoptionplatform.backend.repository.AdoptionRequestRepository;
import com.adoptionplatform.backend.repository.AnimalRepository;
import com.adoptionplatform.backend.repository.SavedAnimalRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class MatchService {

    public static final double STRONG_MATCH_THRESHOLD = 75.0;

    private final AdoptionRequestRepository adoptionRequestRepository;
    private final AnimalRepository animalRepository;
    private final SavedAnimalRepository savedRepo;

    public MatchService(
            AdoptionRequestRepository adoptionRequestRepository,
            AnimalRepository animalRepository,
            SavedAnimalRepository savedAnimalRepository
    ) {
        this.adoptionRequestRepository = adoptionRequestRepository;
        this.animalRepository = animalRepository;
        this.savedRepo = savedAnimalRepository;
    }

    public List<MatchResultDto> getMatches(Long userId) {
        return getMatches(userId, null, null);
    }

    /**
     * same as the {@link #getMatches(Long, Long, Double)} with no post-filter (all scored listings, highest first).
     */
    public List<MatchResultDto> getMatches(Long userId, Long requestId) {
        return getMatches(userId, requestId, null);
    }


    public List<MatchResultDto> getMatches(Long userId, Long requestId, Double minOverlapPercent) {
        List<AdoptionRequest> requests = adoptionRequestRepository.findByUserId(userId);

        if (requests == null || requests.isEmpty()) {
            return new ArrayList<>();
        }

        AdoptionRequest latestRequest = selectRequestForMatching(requests, userId, requestId);
        if (latestRequest == null) {
            return new ArrayList<>();
        }

        List<Animal> animals = animalRepository.findAll();
        List<MatchResultDto> results = new ArrayList<>();

        for (Animal animal : animals) {
            if (!isListedForPublicMatching(animal)) {
                continue;
            }
            DetailedScore detailed = calculateDetailedScore(latestRequest, animal);

            MatchResultDto dto = new MatchResultDto(
                    animal.getId(),
                    animal.getName(),
                    animal.getAnimalType(),
                    animal.getBreed(),
                    animal.getSize(),
                    animal.getAgeGroup(),
                    animal.getEnergyLevel(),
                    animal.getHousingLocation(),
                    detailed.percentage,
                    detailed.reasons
            );

            dto.setCoverImageUrl(getCoverImageUrl(animal));
            List<String> imgs = animal.getImages();
            if (imgs != null && !imgs.isEmpty()) {
                dto.setListingImageUrls(new ArrayList<>(imgs));
            }
            dto.setHighlightTags(getHighlightTags(animal));
            dto.setSaved(savedRepo.existsByUserIdAndAnimalId(userId, animal.getId()));

            results.add(dto);
        }

        results.sort(Comparator.comparingDouble(MatchResultDto::getMatchPercentage).reversed());
        if (minOverlapPercent != null && minOverlapPercent > 0) {
            return results.stream()
                    .filter(d -> d.getMatchPercentage() >= minOverlapPercent)
                    .collect(Collectors.toCollection(ArrayList::new));
        }
        return results;
    }

    private AdoptionRequest selectRequestForMatching(List<AdoptionRequest> requests, Long userId, Long requestId) {
        if (requestId != null) {
            Optional<AdoptionRequest> exact = requests.stream()
                    .filter(r -> Objects.equals(requestId, r.getId()) && Objects.equals(userId, r.getUserId()))
                    .findFirst();
            if (exact.isPresent()) {
                return exact.get();
            }
            // Stale or wrong ?requestId= — fall back to latest submitted instead of returning no listings.
        }
        Optional<AdoptionRequest> submitted = requests.stream()
                .filter(r -> "SUBMITTED".equalsIgnoreCase(String.valueOf(r.getRequestPhase())))
                .max(Comparator.comparing(
                        AdoptionRequest::getRequestTime,
                        Comparator.nullsLast(Comparator.naturalOrder())
                ));
        if (submitted.isPresent()) {
            return submitted.get();
        }
        return requests.stream()
                .max(Comparator.comparing(
                        AdoptionRequest::getRequestTime,
                        Comparator.nullsLast(Comparator.naturalOrder())
                ))
                .orElse(null);
    }

    public boolean isListedForPublicMatching(Animal animal) {
        String s = animal.getListingStatus();
        if (s == null || s.isBlank()) {
            return true;
        }
        String t = s.trim().toUpperCase(java.util.Locale.ROOT);
        return !"ARCHIVED".equals(t)
                && !"DELETED".equals(t)
                && !"ADOPTED".equals(t)
                && !"RESERVED".equals(t);
    }

    /**
     * Score one animal against an adoption request (same engine as {@link #getMatches}).
     */
    public AnimalMatchScore scoreAnimal(AdoptionRequest request, Animal animal) {
        DetailedScore detailed = calculateDetailedScore(request, animal);
        return new AnimalMatchScore(detailed.percentage, detailed.reasons);
    }

    public record AnimalMatchScore(double percentage, List<String> reasons) {}

    private DetailedScore calculateDetailedScore(AdoptionRequest request, Animal animal) {
        List<String> reasons = new ArrayList<>();

        double earned = 0;
        double applicable = 0;

        CategoryOutcome type = animalTypeCategory(request, animal, reasons);
        earned += type.earned;
        applicable += type.maxWeight;

        CategoryOutcome age = ageCategory(request, animal, reasons);
        earned += age.earned;
        applicable += age.maxWeight;

        CategoryOutcome size = sizeCategory(request, animal, reasons);
        earned += size.earned;
        applicable += size.maxWeight;

        CategoryOutcome energy = energyCategory(request, animal, reasons);
        earned += energy.earned;
        applicable += energy.maxWeight;

        CategoryOutcome home = homeCategory(request, animal, reasons);
        earned += home.earned;
        applicable += home.maxWeight;

        CategoryOutcome children = childrenCategory(request, animal, reasons);
        earned += children.earned;
        applicable += children.maxWeight;

        CategoryOutcome pets = otherPetsCategory(request, animal, reasons);
        earned += pets.earned;
        applicable += pets.maxWeight;

        CategoryOutcome grooming = groomingCategory(request, animal, reasons);
        earned += grooming.earned;
        applicable += grooming.maxWeight;

        CategoryOutcome special = specialNeedsCategory(request, animal, reasons);
        earned += special.earned;
        applicable += special.maxWeight;

        CategoryOutcome experience = experienceCategory(request, animal, reasons);
        earned += experience.earned;
        applicable += experience.maxWeight;

        double percentage = applicable > 0
                ? Math.max(0, Math.min(100, Math.round(100.0 * earned / applicable)))
                : 0;

        if (reasons.isEmpty()) {
            reasons.add("This animal has limited compatibility based on the overlapping fields in the current request.");
        }

        return new DetailedScore(percentage, reasons);
    }

    private CategoryOutcome animalTypeCategory(
            AdoptionRequest request,
            Animal animal,
            List<String> reasons
    ) {
        if (!hasText(animal.getAnimalType()) || !hasText(request.getPreferredAnimalTypes())) {
            return CategoryOutcome.skip();
        }
        double max = 18;
        if (contains(request.getPreferredAnimalTypes(), animal.getAnimalType())) {
            reasons.add("Animal type matches the adopter's preference.");
            return new CategoryOutcome(max, max);
        }
        return new CategoryOutcome(0, max);
    }

    private CategoryOutcome ageCategory(
            AdoptionRequest request,
            Animal animal,
            List<String> reasons
    ) {
        String animalType = safe(animal.getAnimalType());
        String age = safe(animal.getAgeGroup());
        if (animalType.isEmpty() || age.isEmpty() || !hasText(request.getPreferredAgeRanges())) {
            return CategoryOutcome.skip();
        }
        double max = 10;
        String expected = animalTypeTitle(animalType) + " - " + normalizeAgeForRequest(age);

        if (contains(request.getPreferredAgeRanges(), expected)) {
            reasons.add("Age range matches the adopter's preference.");
            return new CategoryOutcome(max, max);
        }
        if (contains(request.getPreferredAgeRanges(), animalTypeTitle(animalType))) {
            return new CategoryOutcome(5, max);
        }
        return new CategoryOutcome(0, max);
    }

    private CategoryOutcome sizeCategory(
            AdoptionRequest request,
            Animal animal,
            List<String> reasons
    ) {
        if (!isDog(animal)) {
            double max = 8;
            reasons.add("Size preference is less restrictive for cats.");
            return new CategoryOutcome(max, max);
        }
        if (!hasText(animal.getSize()) || !hasText(request.getPreferredSizes())) {
            return CategoryOutcome.skip();
        }
        double max = 10;
        String expected = "Dog - " + title(safe(animal.getSize()));

        if (contains(request.getPreferredSizes(), expected) || contains(request.getPreferredSizes(), animal.getSize())) {
            reasons.add("Size matches the adopter's preference.");
            return new CategoryOutcome(max, max);
        }
        if (isMedium(animal.getSize())) {
            return new CategoryOutcome(5, max);
        }
        return new CategoryOutcome(0, max);
    }

    private CategoryOutcome energyCategory(
            AdoptionRequest request,
            Animal animal,
            List<String> reasons
    ) {
        String animalEnergy = safe(animal.getEnergyLevel());
        if (animalEnergy.isEmpty()) {
            return CategoryOutcome.skip();
        }
        boolean requestSide =
                hasText(request.getPreferredEnergyLevels())
                        || hasText(request.getActivityLevel())
                        || hasText(request.getTimeAtHome())
                        || hasText(request.getWorkSchedule());
        if (!requestSide) {
            return CategoryOutcome.skip();
        }
        double max = 15;
        double points = energyLifestyleRawPoints(request, animal);
        if (points >= 10) {
            reasons.add("Energy level fits the adopter's lifestyle and time availability.");
        }
        return new CategoryOutcome(points, max);
    }

    private double energyLifestyleRawPoints(AdoptionRequest request, Animal animal) {
        String preferredEnergy = safe(request.getPreferredEnergyLevels());
        String activity = safe(request.getActivityLevel());
        String timeAtHome = safe(request.getTimeAtHome());
        String workSchedule = safe(request.getWorkSchedule());
        String animalEnergy = safe(animal.getEnergyLevel());

        double points = 0;

        if (contains(preferredEnergy, animalEnergy)) {
            points += 6;
        }

        if (activity.equals("HIGH") && animalEnergy.equals("ACTIVE")) {
            points += 5;
        } else if (activity.equals("MEDIUM") && (animalEnergy.equals("BALANCED") || animalEnergy.equals("CALM"))) {
            points += 5;
        } else if (activity.equals("LOW") && animalEnergy.equals("CALM")) {
            points += 5;
        } else if (activity.equals("LOW") && animalEnergy.equals("ACTIVE")) {
            points -= 4;
        } else {
            points += 2;
        }

        if (animalEnergy.equals("ACTIVE")) {
            if (timeAtHome.contains("MOST OF THE DAY") || workSchedule.contains("REMOTE") || workSchedule.contains("FLEXIBLE")) {
                points += 4;
            } else if (workSchedule.contains("MOSTLY OUTSIDE")) {
                points -= 4;
            }
        } else {
            points += 2;
        }

        return clamp(points, 0, 15);
    }

    private CategoryOutcome homeCategory(
            AdoptionRequest request,
            Animal animal,
            List<String> reasons
    ) {
        boolean animalSide = hasText(animal.getSize()) || hasText(animal.getEnergyLevel());
        boolean requestSide =
                hasText(request.getIndoorSpace())
                        || hasText(request.getLivingSpace())
                        || hasText(request.getHasGarden())
                        || hasText(request.getOutdoorAccess());
        if (!animalSide || !requestSide) {
            return CategoryOutcome.skip();
        }
        double max = 15;
        double points = homeEnvironmentRawPoints(request, animal);
        if (points >= 10) {
            reasons.add("Home environment is suitable for this animal.");
        }
        return new CategoryOutcome(points, max);
    }

    private double homeEnvironmentRawPoints(AdoptionRequest request, Animal animal) {
        String indoorSpace = safe(request.getIndoorSpace());
        String livingSpace = safe(request.getLivingSpace());
        String hasGarden = safe(request.getHasGarden());
        String outdoorAccess = safe(request.getOutdoorAccess());
        String size = safe(animal.getSize());
        String energy = safe(animal.getEnergyLevel());

        double points = 0;

        if (livingSpace.contains("HOUSE") || livingSpace.contains("VILLA")) {
            points += 5;
        } else if (livingSpace.contains("APARTMENT") || livingSpace.contains("STUDIO")) {
            if (size.equals("SMALL") || size.equals("MEDIUM") || !isDog(animal)) {
                points += 4;
            } else {
                points -= 3;
            }
        }

        if (indoorSpace.contains("LARGE")) {
            points += 4;
        } else if (indoorSpace.contains("MEDIUM")) {
            points += 3;
        } else if (indoorSpace.contains("SMALL")) {
            if (size.equals("SMALL") || !isDog(animal)) {
                points += 3;
            } else if (energy.equals("ACTIVE")) {
                points -= 3;
            }
        }

        if (hasGarden.contains("YES")) {
            points += isDog(animal) ? 4 : 2;
        } else if (isDog(animal) && energy.equals("ACTIVE")) {
            points -= 3;
        }

        if (outdoorAccess.contains("PRIVATE YARD") || outdoorAccess.contains("TERRACE") || outdoorAccess.contains("SHARED OUTDOOR")) {
            points += 2;
        } else if (outdoorAccess.contains("NONE") && isDog(animal) && energy.equals("ACTIVE")) {
            points -= 3;
        }

        return clamp(points, 0, 15);
    }

    private CategoryOutcome childrenCategory(
            AdoptionRequest request,
            Animal animal,
            List<String> reasons
    ) {
        if (!hasText(animal.getGoodWithChildren()) || !hasText(request.getHasChildren())) {
            return CategoryOutcome.skip();
        }
        double max = 10;
        String hasChildren = safe(request.getHasChildren());
        String goodWithChildren = safe(animal.getGoodWithChildren());

        if (hasChildren.contains("NO")) {
            return new CategoryOutcome(max, max);
        }

        if (hasChildren.contains("YES") && goodWithChildren.equals("YES")) {
            reasons.add("Animal is suitable for a household with children.");
            return new CategoryOutcome(max, max);
        }

        if (hasChildren.contains("YES") && goodWithChildren.equals("NO")) {
            return new CategoryOutcome(0, max);
        }

        return new CategoryOutcome(5, max);
    }

    private CategoryOutcome otherPetsCategory(
            AdoptionRequest request,
            Animal animal,
            List<String> reasons
    ) {
        if (!hasText(animal.getGoodWithPets()) || !hasText(request.getHasOtherPets())) {
            return CategoryOutcome.skip();
        }
        double max = 8;
        String hasOtherPets = safe(request.getHasOtherPets());
        String goodWithPets = safe(animal.getGoodWithPets());

        if (hasOtherPets.contains("NO")) {
            return new CategoryOutcome(max, max);
        }

        if (hasOtherPets.contains("YES") && goodWithPets.equals("YES")) {
            reasons.add("Animal is compatible with homes that already have pets.");
            return new CategoryOutcome(max, max);
        }

        if (hasOtherPets.contains("YES") && goodWithPets.equals("NO")) {
            return new CategoryOutcome(0, max);
        }

        return new CategoryOutcome(4, max);
    }

    private CategoryOutcome groomingCategory(
            AdoptionRequest request,
            Animal animal,
            List<String> reasons
    ) {
        String animalType = animalTypeTitle(safe(animal.getAnimalType()));
        String groomingNeed = title(safe(animal.getGroomingNeed()));

        if (animalType.isEmpty() || groomingNeed.isEmpty() || !hasText(request.getGroomingTolerance())) {
            return CategoryOutcome.skip();
        }
        double max = 5;
        String expected = animalType + " - " + groomingNeed + " Grooming";

        if (contains(request.getGroomingTolerance(), expected)) {
            reasons.add("Grooming needs match the adopter's tolerance.");
            return new CategoryOutcome(max, max);
        }

        if (safe(animal.getGroomingNeed()).equals("LOW")) {
            return new CategoryOutcome(3, max);
        }

        return new CategoryOutcome(0, max);
    }

    private CategoryOutcome specialNeedsCategory(
            AdoptionRequest request,
            Animal animal,
            List<String> reasons
    ) {
        if (!hasText(animal.getSpecialNeeds()) || !hasText(request.getSpecialNeedsAcceptance())) {
            return CategoryOutcome.skip();
        }
        double max = 6;
        String acceptance = safe(request.getSpecialNeedsAcceptance());
        String specialNeeds = safe(animal.getSpecialNeeds());

        if (specialNeeds.equals("NO")) {
            return new CategoryOutcome(max, max);
        }

        if (specialNeeds.equals("YES") && acceptance.contains("YES")) {
            reasons.add("Adopter accepts animals with special needs.");
            return new CategoryOutcome(max, max);
        }

        if (specialNeeds.equals("YES") && acceptance.contains("DEPENDS")) {
            return new CategoryOutcome(3, max);
        }

        return new CategoryOutcome(0, max);
    }

    private CategoryOutcome experienceCategory(
            AdoptionRequest request,
            Animal animal,
            List<String> reasons
    ) {
        double max = 3;
        String hasExperience = safe(request.getHasPreviousExperience());
        String previousTypes = safe(request.getPreviousPetTypes());
        String animalType = safe(animal.getAnimalType());
        String specialNeeds = safe(animal.getSpecialNeeds());
        String grooming = safe(animal.getGroomingNeed());
        String energy = safe(animal.getEnergyLevel());

        boolean highCareAnimal =
                specialNeeds.equals("YES")
                        || grooming.equals("HIGH")
                        || energy.equals("ACTIVE");

        if (!highCareAnimal) {
            return new CategoryOutcome(max, max);
        }

        if (!hasText(request.getHasPreviousExperience())) {
            return CategoryOutcome.skip();
        }

        if (hasExperience.contains("YES") && previousTypes.contains(animalType)) {
            reasons.add("Previous pet experience supports this match.");
            return new CategoryOutcome(max, max);
        }

        if (hasExperience.contains("YES")) {
            return new CategoryOutcome(2, max);
        }

        return new CategoryOutcome(0, max);
    }

    private boolean hasText(String s) {
        return s != null && !s.trim().isEmpty();
    }

    private boolean contains(String source, String value) {
        if (source == null || value == null) {
            return false;
        }
        return source.toUpperCase().contains(value.toUpperCase());
    }

    private boolean isDog(Animal animal) {
        return safe(animal.getAnimalType()).equals("DOG");
    }

    private boolean isMedium(String value) {
        return safe(value).equals("MEDIUM");
    }

    private String safe(String value) {
        return value == null ? "" : value.trim().toUpperCase();
    }

    private String title(String value) {
        String clean = safe(value).toLowerCase();
        if (clean.isEmpty()) {
            return "";
        }
        return clean.substring(0, 1).toUpperCase() + clean.substring(1);
    }

    private String animalTypeTitle(String animalType) {
        if (animalType.equals("DOG")) {
            return "Dog";
        }
        if (animalType.equals("CAT")) {
            return "Cat";
        }
        return title(animalType);
    }

    private String normalizeAgeForRequest(String ageGroup) {
        String age = safe(ageGroup);

        if (age.equals("YOUNG") || age.equals("PUPPY") || age.equals("KITTEN")) {
            return "Puppy / Young";
        }

        if (age.equals("ADULT")) {
            return "Adult";
        }

        if (age.equals("SENIOR")) {
            return "Senior";
        }

        return title(ageGroup);
    }

    private double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }

    private static final class CategoryOutcome {
        private final double earned;
        private final double maxWeight;

        private CategoryOutcome(double earned, double maxWeight) {
            this.earned = earned;
            this.maxWeight = maxWeight;
        }

        private static CategoryOutcome skip() {
            return new CategoryOutcome(0, 0);
        }
    }

    private static final class DetailedScore {
        private final double percentage;
        private final List<String> reasons;

        private DetailedScore(double percentage, List<String> reasons) {
            this.percentage = percentage;
            this.reasons = reasons;
        }
    }

    private String getCoverImageUrl(Animal animal) {
        if (animal.getImages() != null && !animal.getImages().isEmpty()) {
            return animal.getImages().get(0);
        }

        return null;
    }

    private String toDisplayText(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }

        String clean = value.toLowerCase().replace("_", " ").trim();
        return clean.substring(0, 1).toUpperCase() + clean.substring(1);
    }

    private List<String> getHighlightTags(Animal animal) {
        List<String> tags = new ArrayList<>();

        if (animal.getEnergyLevel() != null && !animal.getEnergyLevel().isBlank()) {
            tags.add(toDisplayText(animal.getEnergyLevel()));
        }

        if (animal.getSize() != null && !animal.getSize().isBlank()) {
            tags.add(toDisplayText(animal.getSize()));
        }

        if ("YES".equalsIgnoreCase(animal.getGoodWithChildren())) {
            tags.add("Kid Friendly");
        }

        if ("YES".equalsIgnoreCase(animal.getGoodWithPets())) {
            tags.add("Pet Friendly");
        }

        if (animal.getHousingLocation() != null && !animal.getHousingLocation().isBlank()) {
            tags.add(toDisplayText(animal.getHousingLocation()));
        }

        if (animal.getGroomingNeed() != null && !animal.getGroomingNeed().isBlank()) {
            tags.add(toDisplayText(animal.getGroomingNeed()) + " Grooming");
        }

        if ("YES".equalsIgnoreCase(animal.getSpecialNeeds())) {
            tags.add("Special Needs");
        }

        return tags.size() > 2 ? tags.subList(0, 2) : tags;
    }
}
