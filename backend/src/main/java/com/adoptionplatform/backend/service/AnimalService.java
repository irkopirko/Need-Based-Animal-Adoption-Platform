package com.adoptionplatform.backend.service;

import com.adoptionplatform.backend.dto.AnimalRequest;
import com.adoptionplatform.backend.entity.Animal;
import com.adoptionplatform.backend.entity.Role;
import com.adoptionplatform.backend.entity.User;
import com.adoptionplatform.backend.repository.AnimalRepository;
import com.adoptionplatform.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class AnimalService {

    private final AnimalRepository animalRepository;
    private final UserRepository userRepository;

    public AnimalService(AnimalRepository animalRepository, UserRepository userRepository) {
        this.animalRepository = animalRepository;
        this.userRepository = userRepository;
    }

    public List<Animal> getAllAnimals() {
        return animalRepository.findAll();
    }

    public Animal getAnimalById(Long id) {
        return animalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Animal not found with id: " + id));
    }

    public Animal saveAnimal(Animal animal) {
        animal.setRegisterTime(LocalDateTime.now(ZoneId.of("Europe/Istanbul")));
        return animalRepository.save(animal);
    }

    /**
     * Strong matches : animals whose compatibility score is greater than or equal to the threshold

     */
    public List<Animal> getCompatibleAnimals(Double threshold) {
        return animalRepository.findByCompatibilityScoreGreaterThanEqual(threshold);
    }

    public Animal updateAnimal(Long id, Animal updatedAnimal) {
        Animal existingAnimal = getAnimalById(id);

        existingAnimal.setName(updatedAnimal.getName());
        existingAnimal.setAnimalType(updatedAnimal.getAnimalType());
        existingAnimal.setBreed(updatedAnimal.getBreed());
        existingAnimal.setAgeGroup(updatedAnimal.getAgeGroup());
        existingAnimal.setSize(updatedAnimal.getSize());
        existingAnimal.setEnergyLevel(updatedAnimal.getEnergyLevel());
        existingAnimal.setGroomingNeed(updatedAnimal.getGroomingNeed());
        existingAnimal.setSpecialNeeds(updatedAnimal.getSpecialNeeds());
        existingAnimal.setGoodWithChildren(updatedAnimal.getGoodWithChildren());
        existingAnimal.setGoodWithPets(updatedAnimal.getGoodWithPets());
        existingAnimal.setDescription(updatedAnimal.getDescription());
        existingAnimal.setListingStatus(updatedAnimal.getListingStatus());
        existingAnimal.setCompatibilityScore(updatedAnimal.getCompatibilityScore());
        existingAnimal.setImages(updatedAnimal.getImages());

        return animalRepository.save(existingAnimal);
    }

    public Animal createAnimal(AnimalRequest request) {
        Long ownerId = request.getOwnerId();
        if (ownerId == null) {
            throw new IllegalArgumentException("Owner id is required");
        }
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new IllegalArgumentException("Owner not found"));
        if (owner.getRole() != Role.OWNER) {
            throw new IllegalArgumentException("Only owner accounts can list animals");
        }
        if (Boolean.FALSE.equals(owner.getOwnerProfileCompleted())) {
            throw new IllegalStateException("Complete your owner profile before listing animals");
        }

        Animal animal = new Animal();
        animal.setOwnerId(ownerId);
        animal.setName(request.getName());
        animal.setAnimalType(request.getAnimalType());
        animal.setBreed(request.getBreed());
        animal.setSize(request.getSize());
        animal.setAgeGroup(request.getAgeGroup());
        animal.setEnergyLevel(request.getEnergyLevel());
        animal.setGoodWithChildren(request.getGoodWithChildren());
        animal.setGoodWithPets(request.getGoodWithPets());
        animal.setGroomingNeed(request.getGroomingNeed());
        animal.setSpecialNeeds(request.getSpecialNeeds());
        animal.setDescription(request.getDescription());
        animal.setHousingLocation(request.getHousingLocation());

        return animalRepository.save(animal);
    }

    public Animal createAnimalWithImages(AnimalRequest request, List<MultipartFile> images) {
        Animal animal = createAnimal(request);

        List<String> imageUrls = new ArrayList<>();

        try {
            Path uploadPath = Paths.get("uploads/animals");

            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            for (MultipartFile image : images) {
                String fileName = UUID.randomUUID() + "_" + image.getOriginalFilename();
                Path filePath = uploadPath.resolve(fileName);

                Files.copy(image.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

                imageUrls.add("/uploads/animals/" + fileName);
            }

            animal.setImages(imageUrls);
            return animalRepository.save(animal);

        } catch (IOException e) {
            throw new RuntimeException("Image upload failed", e);
        }
    }

    public void deleteAnimal(Long id) {
        animalRepository.deleteById(id);
    }
}
