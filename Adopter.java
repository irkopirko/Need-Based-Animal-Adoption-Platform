package pavia;

import java.util.List;
import java.util.NoSuchElementException;

public class Adopter extends User {

    private AdoptionProfile adoptionProfile;

    public Adopter(String fullName,String email,String password,String location,String phoneNumber) {
    super(fullName,email,password,location,phoneNumber,"adopter");
    }

    public AdoptionProfile getAdoptionProfile(){return adoptionProfile;}

    public void setAdoptionProfile(AdoptionProfile profile){
        this.adoptionProfile =profile;
    }

    public List<CompatibilityMatch> viewCompatibleAnimals(){
        if (adoptionProfile==null)
            throw new IllegalStateException(
                "You must create an Adoption Profile before viewing compatible animals.");

        return CompatibilityMatch.getMatchesForAdopter(adoptionProfile);
    }

    public AnimalProfile viewAnimalProfile(int animalId) {
        AnimalProfile profile= AnimalProfile.getById(animalId);
        if (profile==null)
            throw new NoSuchElementException("No animal profile found with ID " + animalId + ".");

        System.out.println("--- Animal Profile: " + profile.getName() + " ---");
        System.out.println("Species       : " + profile.getSpecies());
        System.out.println("Age           : " + profile.getAge());
        System.out.println("Gender        : " + profile.getGender());
        System.out.println("Activity Level: " + profile.getActivityLevel());
        System.out.println("Temperament   : " + profile.getTemperament());
        System.out.println("Status        : " + profile.getStatus());

        return profile;
    }

    public Conversation contactOwner(int animalId) {
        if (!isLoggedIn()){
            throw new SecurityException("You must be logged in to contact an owner.");}

        AnimalProfile animalProfile=AnimalProfile.getById(animalId);
        if (animalProfile==null){
            throw new NoSuchElementException("No animal profile found with ID " + animalId + ".");}

        Conversation conversation=Conversation.getOrCreate(this,animalProfile);
        System.out.println("Conversation thread opened for animal '" + animalProfile.getName() + "' (ID: " + animalId + ").");
        return conversation;
    }
}
