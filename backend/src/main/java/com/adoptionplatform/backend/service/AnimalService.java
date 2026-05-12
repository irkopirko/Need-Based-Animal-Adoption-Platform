package com.adoptionplatform.backend.service;

import com.adoptionplatform.backend.config.UploadRootHolder;
import com.adoptionplatform.backend.dto.AnimalRequest;
import com.adoptionplatform.backend.entity.Animal;
import com.adoptionplatform.backend.entity.Role;
import com.adoptionplatform.backend.entity.SavedAnimal;
import com.adoptionplatform.backend.entity.User;
import com.adoptionplatform.backend.repository.AnimalRepository;
import com.adoptionplatform.backend.repository.SavedAnimalRepository;
import com.adoptionplatform.backend.repository.UserRepository;
import org.hibernate.Hibernate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Service
public class AnimalService {

    private static final String SQL_ANIMAL_IDS_BY_OWNER = "SELECT id FROM animals WHERE owner_id = ?";

    private final AnimalRepository animalRepository;
    private final UserRepository userRepository;
    private final SavedAnimalRepository savedAnimalRepository;
    private final JdbcTemplate jdbcTemplate;
    private final UploadRootHolder uploadRootHolder;
    private final String publicBaseUrl;

    public AnimalService(
            AnimalRepository animalRepository,
            UserRepository userRepository,
            SavedAnimalRepository savedAnimalRepository,
            JdbcTemplate jdbcTemplate,
            UploadRootHolder uploadRootHolder,
            @Value("${app.public-base-url:}") String publicBaseUrl
    ) {
        this.animalRepository = animalRepository;
        this.userRepository = userRepository;
        this.savedAnimalRepository = savedAnimalRepository;
        this.jdbcTemplate = jdbcTemplate;
        this.uploadRootHolder = uploadRootHolder;
        this.publicBaseUrl = publicBaseUrl != null ? publicBaseUrl.trim() : "";
    }

    /**image URL stored in DB / returned in JSON */
    private String publishedAssetUrl(String relativePath) {
        String rel = relativePath.startsWith("/") ? relativePath : "/" + relativePath;
        if (publicBaseUrl.isEmpty()) {
            return rel;
        }
        return publicBaseUrl.replaceAll("/+$", "") + rel;
    }

    public List<Animal> getAllAnimals() {
        return animalRepository.findAll();
    }


    @Transactional(readOnly = true)
    public List<Animal> listAnimalsForOwner(Long ownerId, Long viewerId) {
        if (ownerId == null || viewerId == null) {
            throw new IllegalArgumentException("Owner id and viewer id are required");
        }
        if (!ownerId.equals(viewerId)) {
            throw new IllegalArgumentException("You can only load your own listings");
        }
        userRepository.findById(ownerId)
                .orElseThrow(() -> new IllegalArgumentException("Owner not found"));
        List<Long> ids = jdbcTemplate.query(
                SQL_ANIMAL_IDS_BY_OWNER,
                (rs, rowNum) -> rs.getLong("id"),
                ownerId);
        if (ids.isEmpty()) {
            return List.of();
        }
        List<Animal> list = new ArrayList<>(animalRepository.findAllById(ids));
        for (Animal a : list) {
            if (a.getOwner() != null) {
                Hibernate.initialize(a.getOwner());
            }
        }
        list.sort(Comparator.comparing(Animal::getRegisterTime, Comparator.nullsLast(Comparator.reverseOrder())));
        return list;
    }

    public Animal getAnimalById(Long id) {
        return animalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Animal not found with id: " + id));
    }

    public Animal saveAnimal(Animal animal) {
        if (animal.getOwner() == null) {
            throw new IllegalArgumentException("Animal must reference an owner (users.id) via owner");
        }
        if (animal.getRegisterTime() == null) {
            animal.setRegisterTime(LocalDateTime.now(ZoneId.of("Europe/Istanbul")));
        }
        return animalRepository.save(animal);
    }

    /**
     * Strong matches : animals whose compatibility score is greater than or equal to the threshold

     */
    public List<Animal> getCompatibleAnimals(Double threshold) {
        return animalRepository.findByCompatibilityScoreGreaterThanEqual(threshold);
    }

    private Animal assertAnimalOwnedBy(Long id, Long viewerId) {
        if (viewerId == null) {
            throw new IllegalArgumentException("Viewer id is required");
        }
        Animal existingAnimal = getAnimalById(id);
        Long ownerId = existingAnimal.getOwnerId();
        if (ownerId == null || !ownerId.equals(viewerId)) {
            throw new IllegalArgumentException("You can only modify your own listings");
        }
        return existingAnimal;
    }

    /**
     * Saves JPEG uploads under the animals folder and returns published URLs
     */
    private List<String> persistJpegUploads(List<MultipartFile> images) throws IOException {
        if (images == null || images.isEmpty()) {
            return List.of();
        }
        Path uploadPath = uploadRootHolder.getAnimalsUploadDir();
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        List<String> imageUrls = new ArrayList<>();
        for (MultipartFile image : images) {
            if (image == null || image.isEmpty()) {
                continue;
            }
            if (!isAllowedJpegUpload(image)) {
                throw new IllegalArgumentException(
                        "Only JPEG images are allowed (.jpg or .jpeg file extension, or image/jpeg)."
                );
            }
            String fileName = UUID.randomUUID() + ".jpg";
            Path filePath = uploadPath.resolve(fileName);
            Files.copy(image.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            imageUrls.add(publishedAssetUrl("/uploads/animals/" + fileName));
        }
        return imageUrls;
    }

    @Transactional
    public List<String> uploadJpegImagesForOwner(Long viewerId, List<MultipartFile> files) {
        if (viewerId == null) {
            throw new IllegalArgumentException("Viewer id is required");
        }
        User u = userRepository.findById(viewerId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (u.getRole() != Role.OWNER) {
            throw new IllegalArgumentException("Only owner accounts can upload listing images");
        }
        try {
            return persistJpegUploads(files != null ? files : List.of());
        } catch (IOException e) {
            throw new RuntimeException("Image upload failed", e);
        }
    }

    public Animal updateAnimal(Long id, Long viewerId, Animal updatedAnimal) {
        Animal existingAnimal = assertAnimalOwnedBy(id, viewerId);
        User ownerKeep = existingAnimal.getOwner();

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
        existingAnimal.setHousingLocation(updatedAnimal.getHousingLocation());
        existingAnimal.setListingStatus(updatedAnimal.getListingStatus());
        existingAnimal.setCompatibilityScore(updatedAnimal.getCompatibilityScore());
        existingAnimal.setImages(updatedAnimal.getImages());
        existingAnimal.setOwner(ownerKeep);

        return animalRepository.save(existingAnimal);
    }

    @Transactional
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
        animal.setOwner(owner);
        animal.setRegisterTime(LocalDateTime.now(ZoneId.of("Europe/Istanbul")));
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

        Animal saved = animalRepository.save(animal);
        ensureOwnerListingInSavedAnimals(saved);
        return saved;
    }

    /**
     * Each new listing is linked to the owner in {@code saved_animals} ({@code user_id} = owner id,
     * {@code animal_id} = new row)
     */
    private void ensureOwnerListingInSavedAnimals(Animal animal) {
        Long ownerId = animal.getOwnerId();
        Long animalId = animal.getId();
        if (ownerId == null || animalId == null) {
            return;
        }
        if (savedAnimalRepository.existsByUserIdAndAnimalId(ownerId, animalId)) {
            return;
        }
        SavedAnimal row = new SavedAnimal();
        row.setUserId(ownerId);
        row.setAnimalId(animalId);
        row.setSavedAt(LocalDateTime.now(ZoneId.of("Europe/Istanbul")));
        savedAnimalRepository.save(row);
    }

    @Transactional
    public Animal createAnimalWithImages(AnimalRequest request, List<MultipartFile> images) {
        Animal animal = createAnimal(request);
        try {
            if (images == null || images.isEmpty()) {
                throw new IllegalArgumentException("At least one image is required.");
            }
            List<String> imageUrls = persistJpegUploads(images);
            if (imageUrls.isEmpty()) {
                throw new IllegalArgumentException("No valid image files were uploaded.");
            }
            animal.setImages(imageUrls);
            return animalRepository.save(animal);
        } catch (IOException e) {
            throw new RuntimeException("Image upload failed", e);
        }
    }

    private static boolean isAllowedJpegUpload(MultipartFile file) {
        String name = Optional.ofNullable(file.getOriginalFilename())
                .orElse("")
                .trim()
                .toLowerCase(Locale.ROOT);
        boolean extOk = name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".jpe");
        String ct = Optional.ofNullable(file.getContentType())
                .orElse("")
                .trim()
                .toLowerCase(Locale.ROOT);
        boolean mimeOk = ct.contains("jpeg") || "image/jpg".equals(ct);
        return extOk || mimeOk;
    }

    @Transactional
    public void deleteAnimal(Long id, Long viewerId) {
        assertAnimalOwnedBy(id, viewerId);
        savedAnimalRepository.deleteByAnimalIdIn(List.of(id));
        animalRepository.deleteById(id);
    }
}
