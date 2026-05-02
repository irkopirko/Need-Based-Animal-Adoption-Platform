package com.adoptionplatform.backend.service;

import com.adoptionplatform.backend.dto.AnimalRequest;
import com.adoptionplatform.backend.entity.Animal;
import com.adoptionplatform.backend.repository.AnimalRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@Service
public class AnimalService {

    private final AnimalRepository animalRepository;

    public AnimalService(AnimalRepository animalRepository) {
        this.animalRepository = animalRepository;
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
        Animal animal = new Animal();
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

        return animalRepository.save(animal);
    }

    public void deleteAnimal(Long id) {
        animalRepository.deleteById(id);
    }
}