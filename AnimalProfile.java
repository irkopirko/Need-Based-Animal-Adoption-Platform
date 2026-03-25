package pavia;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeSet;
import java.util.stream.Collectors;

public class AnimalProfile {

    private static final Map<String, TreeSet<String>> VALID_TRANSITIONS;

    static {
        VALID_TRANSITIONS = new HashMap<>();

        TreeSet<String> fromDraft = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
        fromDraft.add("PendingReview");
        VALID_TRANSITIONS.put("Draft", fromDraft);

        TreeSet<String> fromPendingReview = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
        fromPendingReview.add("Active");
        VALID_TRANSITIONS.put("PendingReview", fromPendingReview);

        TreeSet<String> fromActive = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
        fromActive.add("Matched");
        fromActive.add("Removed");
        VALID_TRANSITIONS.put("Active", fromActive);

        TreeSet<String> fromMatched = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
        fromMatched.add("InquiryInProgress");
        fromMatched.add("Removed");
        VALID_TRANSITIONS.put("Matched", fromMatched);

        TreeSet<String> fromInquiryInProgress = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
        fromInquiryInProgress.add("AdoptionPending");
        fromInquiryInProgress.add("Removed");
        VALID_TRANSITIONS.put("InquiryInProgress", fromInquiryInProgress);

        TreeSet<String> fromAdoptionPending = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
        fromAdoptionPending.add("Adopted");
        VALID_TRANSITIONS.put("AdoptionPending", fromAdoptionPending);

        VALID_TRANSITIONS.put("Adopted", new TreeSet<>(String.CASE_INSENSITIVE_ORDER));
        VALID_TRANSITIONS.put("Removed", new TreeSet<>(String.CASE_INSENSITIVE_ORDER));
    }

    private static int _nextId = 1;
    private static final List<AnimalProfile> _store = new ArrayList<>();

    private int animalId;
    private String name = "";
    private String species = "";
    private int age;
    private String gender = "";
    private String activityLevel = "";
    private String temperament = "";
    private String childCompatibility = "";
    private String animalCompatibility = "";
    private String vaccinationStatus = "";
    private String medicalConditions = "";
    private String neuteredStatus = "";
    private String indoorOutdoorSuitability = "";
    private String exerciseNeeds = "";
    private String status = "Draft";
    private int ownerId;

    private List<AnimalImage> images = new ArrayList<>();

    public int getAnimalId() { return animalId; }
    public String getName() { return name; }
    public String getSpecies() { return species; }
    public int getAge() { return age; }
    public String getGender() { return gender; }
    public String getActivityLevel() { return activityLevel; }
    public String getTemperament() { return temperament; }
    public String getChildCompatibility() { return childCompatibility; }
    public String getAnimalCompatibility() { return animalCompatibility; }
    public String getVaccinationStatus() { return vaccinationStatus; }
    public String getMedicalConditions() { return medicalConditions; }
    public String getNeuteredStatus() { return neuteredStatus; }
    public String getIndoorOutdoorSuitability() { return indoorOutdoorSuitability; }
    public String getExerciseNeeds() { return exerciseNeeds; }
    public String getStatus() { return status; }
    public int getOwnerId() { return ownerId; }
    public List<AnimalImage> getImages() { return images; }

    public AnimalProfile(String name, String species, int age, String gender,
            String activityLevel, String temperament,
            String childCompatibility, String animalCompatibility,
            String vaccinationStatus, String medicalConditions,
            String neuteredStatus, String indoorOutdoorSuitability,
            String exerciseNeeds, int ownerId) {
        this.name = name;
        this.species = species;
        this.age = age;
        this.gender = gender;
        this.activityLevel = activityLevel;
        this.temperament = temperament;
        this.childCompatibility = childCompatibility;
        this.animalCompatibility = animalCompatibility;
        this.vaccinationStatus = vaccinationStatus;
        this.medicalConditions = medicalConditions;
        this.neuteredStatus = neuteredStatus;
        this.indoorOutdoorSuitability = indoorOutdoorSuitability;
        this.exerciseNeeds = exerciseNeeds;
        this.ownerId = ownerId;
        this.status = "Draft";
    }

    public void registerAnimal(List<String> imagePaths) {
        validateRequiredFields();

        if (imagePaths == null || imagePaths.size() < 3)
            throw new IllegalArgumentException(
                "At least 3 images are required (provided: " + (imagePaths != null ? imagePaths.size() : 0) + ").");

        TreeSet<String> supported = AnimalImage.SupportedFormats;
        for (String path : imagePaths) {
            String ext = path.contains(".") ? path.substring(path.lastIndexOf('.')) : "";
            if (!supported.contains(ext))
                throw new IllegalArgumentException(
                    "Unsupported image format '" + ext + "' for '" + path + "'. Accepted: " + String.join(", ", supported) + ".");
        }

        for (String path : imagePaths) {
            AnimalImage img = new AnimalImage();
            img.uploadImage(path, this);
            images.add(img);
        }

        transitionTo("PendingReview");
        add(this);

        System.out.println("Animal '" + name + "' registered (ID: " + animalId + "). Status: " + status);
    }

    public void updateAnimal(
            String name, String species, Integer age,
            String gender, String activityLevel,
            String temperament, String childCompatibility,
            String animalCompatibility, String vaccinationStatus,
            String medicalConditions, String neuteredStatus,
            String indoorOutdoorSuitability, String exerciseNeeds) {
        if (status.equals("Adopted") || status.equals("Removed"))
            throw new IllegalStateException("Cannot update a profile with status '" + status + "'.");

        if (name != null) this.name = name;
        if (species != null) this.species = species;
        if (age != null) this.age = age;
        if (gender != null) this.gender = gender;
        if (activityLevel != null) this.activityLevel = activityLevel;
        if (temperament != null) this.temperament = temperament;
        if (childCompatibility != null) this.childCompatibility = childCompatibility;
        if (animalCompatibility != null) this.animalCompatibility = animalCompatibility;
        if (vaccinationStatus != null) this.vaccinationStatus = vaccinationStatus;
        if (medicalConditions != null) this.medicalConditions = medicalConditions;
        if (neuteredStatus != null) this.neuteredStatus = neuteredStatus;
        if (indoorOutdoorSuitability != null) this.indoorOutdoorSuitability = indoorOutdoorSuitability;
        if (exerciseNeeds != null) this.exerciseNeeds = exerciseNeeds;

        validateRequiredFields();
        System.out.println("Animal '" + this.name + "' (ID: " + animalId + ") updated successfully.");
    }

    public void markAsAdopted(int requestingOwnerId) {
        assertOwner(requestingOwnerId);
        transitionTo("Adopted");
        System.out.println("Animal '" + name + "' (ID: " + animalId + ") marked as Adopted.");
    }

    public void removeListing(int requestingOwnerId) {
        assertOwner(requestingOwnerId);
        transitionTo("Removed");
        System.out.println("Animal '" + name + "' (ID: " + animalId + ") listing removed.");
    }

    public void advanceStatus(String newStatus) {
        transitionTo(newStatus);
    }

    void submitForReview() {
        transitionTo("PendingReview");
    }

    public static AnimalProfile getById(int id) {
        return _store.stream().filter(p -> p.animalId == id).findFirst().orElse(null);
    }

    public static List<AnimalProfile> getAllActive() {
        return _store.stream().filter(p -> "Active".equals(p.status)).collect(Collectors.toList());
    }

    public static List<AnimalProfile> getByOwner(int ownerId) {
        return _store.stream().filter(p -> p.ownerId == ownerId).collect(Collectors.toList());
    }

    public static void add(AnimalProfile profile) {
        if (profile.animalId == 0) profile.animalId = _nextId++;
        if (!_store.contains(profile)) _store.add(profile);
    }

    private void transitionTo(String newStatus) {
        TreeSet<String> allowed = VALID_TRANSITIONS.get(status);
        if (allowed == null || !allowed.contains(newStatus))
            throw new IllegalStateException("Invalid status transition: '" + status + "' → '" + newStatus + "'.");
        this.status = newStatus;
    }

    private void assertOwner(int requestingOwnerId) {
        if (ownerId != requestingOwnerId)
            throw new SecurityException("Only the owning user can perform this action.");
    }

    private void validateRequiredFields() {
        List<String> errors = new ArrayList<>();
        check(name, "Name", errors);
        check(species, "Species", errors);
        check(gender, "Gender", errors);
        check(activityLevel, "ActivityLevel", errors);
        check(temperament, "Temperament", errors);
        check(childCompatibility, "ChildCompatibility", errors);
        check(animalCompatibility, "AnimalCompatibility", errors);
        check(vaccinationStatus, "VaccinationStatus", errors);
        check(neuteredStatus, "NeuteredStatus", errors);
        check(indoorOutdoorSuitability, "IndoorOutdoorSuitability", errors);
        check(exerciseNeeds, "ExerciseNeeds", errors);
        if (age < 0) errors.add("Age must be a non-negative number.");
        if (!errors.isEmpty())
            throw new IllegalArgumentException("Animal profile validation failed:\n  • " + String.join("\n  • ", errors));
    }

    private static void check(String value, String field, List<String> errors) {
        if (value == null || value.trim().isEmpty()) errors.add("'" + field + "' is required.");
    }
}
