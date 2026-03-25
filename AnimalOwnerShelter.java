package pavia;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

public class AnimalOwnerShelter extends User {

    private static final Set<String> SUPPORTED_IMAGE_FORMATS =
        new TreeSet<>(String.CASE_INSENSITIVE_ORDER) {{
            add(".jpg");
            add(".jpeg");
            add(".png");
            add(".webp");
            add(".gif");
        }};

    private final List<AnimalProfile> _listings = new ArrayList<>();

    public AnimalOwnerShelter(String fullName, String email, String password, String location, String phoneNumber) {
        super(fullName, email, password, location, phoneNumber, "owner_shelter");
    }

    public AnimalProfile registerAnimal(
            String name, String species, int age, String gender,
            String activityLevel, String temperament,
            String childCompatibility, String animalCompatibility,
            String vaccinationStatus, String medicalConditions,
            String neuteredStatus, String indoorOutdoorSuitability,
            String exerciseNeeds, List<String> imagePaths) {

        if (!isLoggedIn())
            throw new SecurityException("You must be logged in to register an animal.");

        validateNotBlank(name, "name");
        validateNotBlank(species, "species");
        validateNotBlank(gender, "gender");
        validateNotBlank(activityLevel, "activityLevel");
        validateNotBlank(temperament, "temperament");
        validateNotBlank(childCompatibility, "childCompatibility");
        validateNotBlank(animalCompatibility, "animalCompatibility");
        validateNotBlank(vaccinationStatus, "vaccinationStatus");
        validateNotBlank(neuteredStatus, "neuteredStatus");
        validateNotBlank(indoorOutdoorSuitability, "indoorOutdoorSuitability");
        validateNotBlank(exerciseNeeds, "exerciseNeeds");

        if (age < 0)
            throw new IllegalArgumentException("Age must be a non-negative number.");

        AnimalProfile profile = new AnimalProfile(
            name, species, age, gender,
            activityLevel, temperament,
            childCompatibility, animalCompatibility,
            vaccinationStatus, medicalConditions,
            neuteredStatus, indoorOutdoorSuitability,
            exerciseNeeds, getUserId());

        profile.registerAnimal(imagePaths);
        _listings.add(profile);

        System.out.println("Animal '" + name + "' registered successfully. Status: " + profile.getStatus());
        return profile;
    }

    public List<AnimalProfile> manageAnimalListings() {
        if (!isLoggedIn())
            throw new SecurityException("You must be logged in to manage listings.");

        System.out.println("--- Listings for " + fullName + " (" + _listings.size() + " total) ---");
        for (AnimalProfile listing : _listings)
            System.out.println("  [" + listing.getAnimalId() + "] " + listing.getName() + " \u2014 " + listing.getStatus());

        return new ArrayList<>(_listings);
    }

    public void updateListing(int animalId,
            String activityLevel, String temperament,
            String medicalConditions, String indoorOutdoorSuitability,
            String exerciseNeeds) {

        AnimalProfile profile = getOwnedProfile(animalId);
        profile.updateAnimal(activityLevel, temperament, medicalConditions, indoorOutdoorSuitability, exerciseNeeds);
        System.out.println("Listing '" + profile.getName() + "' (ID: " + animalId + ") updated successfully.");
    }

    public void uploadImageToListing(int animalId, String imagePath, String caption) {
        AnimalProfile profile = getOwnedProfile(animalId);
        AnimalImage image = new AnimalImage();
        image.uploadImage(imagePath, profile, caption);
        profile.getImages().add(image);
    }

    public void markListingAsAdopted(int animalId) {
        AnimalProfile profile = getOwnedProfile(animalId);
        profile.markAsAdopted(getUserId());
        System.out.println("Listing '" + profile.getName() + "' (ID: " + animalId + ") marked as Adopted.");
    }

    public void removeListing(int animalId) {
        AnimalProfile profile = getOwnedProfile(animalId);
        profile.removeListing(getUserId());
        System.out.println("Listing '" + profile.getName() + "' (ID: " + animalId + ") has been removed.");
    }

    public List<Inquiry> viewAdoptionInquiries() {
        if (!isLoggedIn())
            throw new SecurityException("You must be logged in to view inquiries.");

        Set<Integer> ownerAnimalIds = new HashSet<>(
            _listings.stream().map(l -> l.getAnimalId()).collect(Collectors.toList()));
        List<Inquiry> inquiries = Inquiry.getByAnimalIds(ownerAnimalIds);

        System.out.println("--- Adoption Inquiries for " + fullName + " (" + inquiries.size() + " total) ---");
        for (Inquiry inq : inquiries)
            System.out.println("  [Inquiry " + inq.getInquiryId() + "] Animal ID: " + inq.getAnimalId()
                + " \u2014 Status: " + inq.getInquiryStatus()
                + "  (created " + inq.getCreatedAt().toLocalDate() + ")");

        return inquiries;
    }

    public void respondToInquiry(int inquiryId, String messageContent) {
        if (!isLoggedIn())
            throw new SecurityException("You must be logged in to respond to inquiries.");

        Inquiry inquiry = Inquiry.getById(inquiryId);
        if (inquiry == null)
            throw new NoSuchElementException("Inquiry " + inquiryId + " not found.");

        if (_listings.stream().noneMatch(l -> l.getAnimalId() == inquiry.getAnimalId()))
            throw new SecurityException("You are not the owner of the animal linked to this inquiry.");

        Conversation conversation = Conversation.getById(inquiry.getConversationId());
        if (conversation == null)
            throw new IllegalStateException("No conversation thread found for inquiry " + inquiryId + ".");

        Message msg = new Message();
        msg.sendMessage(conversation.getConversationId(), messageContent, "owner_shelter");

        System.out.println("Reply sent on inquiry " + inquiryId + ".");
    }

    private AnimalProfile getOwnedProfile(int animalId) {
        AnimalProfile profile = _listings.stream()
            .filter(l -> l.getAnimalId() == animalId)
            .findFirst()
            .orElse(null);
        if (profile == null)
            throw new NoSuchElementException(
                "No listing with ID " + animalId + " found for owner " + fullName + ".");
        return profile;
    }

    private static void validateNotBlank(String value, String fieldName) {
        if (value == null || value.trim().isEmpty())
            throw new IllegalArgumentException("'" + fieldName + "' is required and cannot be blank.");
    }
}
