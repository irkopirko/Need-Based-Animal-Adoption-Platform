package com.adoptionplatform.backend.service;

import com.adoptionplatform.backend.config.UploadRootHolder;
import com.adoptionplatform.backend.dto.AnimalRequest;
import com.adoptionplatform.backend.entity.Animal;
import com.adoptionplatform.backend.entity.AnimalImage;
import com.adoptionplatform.backend.entity.Role;
import com.adoptionplatform.backend.entity.SavedAnimal;
import com.adoptionplatform.backend.entity.User;
import com.adoptionplatform.backend.repository.AnimalImageRepository;
import com.adoptionplatform.backend.repository.AnimalRepository;
import com.adoptionplatform.backend.repository.MatchSnapshotRepository;
import com.adoptionplatform.backend.repository.SavedAnimalRepository;
import com.adoptionplatform.backend.repository.UserRepository;
import com.adoptionplatform.backend.util.ListingCodeUtil;
import jakarta.persistence.EntityManager;
import org.hibernate.Hibernate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AnimalService {

    private static final String SQL_ANIMAL_IDS_BY_OWNER = "SELECT id FROM animals WHERE owner_id = ?";
    private static final Pattern API_IMAGE_PATH =
            Pattern.compile("/api/animals/(\\d+)/images/(\\d+)");
    private static final Pattern DESCRIPTION_SENTENCE_START =
            Pattern.compile("(^|[.!?]\\s+)(\\p{L})");
    private static final Locale TEXT_LOCALE = Locale.forLanguageTag("tr-TR");
    private static final int MAX_JPEG_BYTES = 5 * 1024 * 1024;

    private final AnimalRepository animalRepository;
    private final AnimalImageRepository animalImageRepository;
    private final UserRepository userRepository;
    private final SavedAnimalRepository savedAnimalRepository;
    private final MatchSnapshotRepository matchSnapshotRepository;
    private final EmailService emailService;
    private final JdbcTemplate jdbcTemplate;
    private final EntityManager entityManager;
    private final UploadRootHolder uploadRootHolder;
    private final String publicBaseUrl;

    public AnimalService(
            AnimalRepository animalRepository,
            AnimalImageRepository animalImageRepository,
            UserRepository userRepository,
            SavedAnimalRepository savedAnimalRepository,
            MatchSnapshotRepository matchSnapshotRepository,
            EmailService emailService,
            JdbcTemplate jdbcTemplate,
            EntityManager entityManager,
            UploadRootHolder uploadRootHolder,
            @Value("${app.public-base-url:}") String publicBaseUrl
    ) {
        this.animalRepository = animalRepository;
        this.animalImageRepository = animalImageRepository;
        this.userRepository = userRepository;
        this.savedAnimalRepository = savedAnimalRepository;
        this.matchSnapshotRepository = matchSnapshotRepository;
        this.emailService = emailService;
        this.jdbcTemplate = jdbcTemplate;
        this.entityManager = entityManager;
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
        return animalRepository.findByCompatibilityScoreGreaterThanEqual(threshold).stream()
                .filter(this::isVisibleForCompatibility)
                .toList();
    }

    public boolean isVisibleForCompatibility(Animal animal) {
        String status = animal.getListingStatus();
        if (status == null || status.isBlank()) {
            return true;
        }
        String t = status.trim().toUpperCase(Locale.ROOT);
        return !"ARCHIVED".equals(t)
                && !"DELETED".equals(t)
                && !"ADOPTED".equals(t)
                && !"RESERVED".equals(t);
    }

    @Transactional
    public Animal markListingReserved(Long id, Long viewerId) {
        Animal animal = assertAnimalOwnedBy(id, viewerId);
        if ("ADOPTED".equalsIgnoreCase(String.valueOf(animal.getListingStatus()))) {
            throw new IllegalArgumentException("This listing is already adopted");
        }
        animal.setListingStatus("RESERVED");
        return animalRepository.save(animal);
    }

    @Transactional
    public Animal markListingAdopted(Long id, Long viewerId) {
        Animal animal = assertAnimalOwnedBy(id, viewerId);
        animal.setListingStatus("ADOPTED");
        return animalRepository.save(animal);
    }

    @Transactional
    public Animal archiveListing(Long id, Long viewerId) {
        Animal animal = assertAnimalOwnedBy(id, viewerId);
        String status = animal.getListingStatus() == null ? "" : animal.getListingStatus().trim().toUpperCase(Locale.ROOT);
        if ("ADOPTED".equals(status)) {
            throw new IllegalArgumentException("Adopted listings cannot be archived");
        }
        if ("ARCHIVED".equals(status)) {
            return animal;
        }
        animal.setListingStatus("ARCHIVED");
        animal.setCompatibilityScore(null);
        Animal saved = animalRepository.save(animal);
        matchSnapshotRepository.deleteByAnimalId(saved.getId());
        notifyOwnerListingArchived(saved, viewerId);
        return saved;
    }

    @Transactional
    public Animal unarchiveListing(Long id, Long viewerId) {
        Animal animal = assertAnimalOwnedBy(id, viewerId);
        String status = animal.getListingStatus() == null ? "" : animal.getListingStatus().trim().toUpperCase(Locale.ROOT);
        if ("ADOPTED".equals(status)) {
            throw new IllegalArgumentException("Adopted listings cannot be unarchived. They stay in your adopted list.");
        }
        animal.setListingStatus("ACTIVE");
        return animalRepository.save(animal);
    }

    private void notifyOwnerListingArchived(Animal animal, Long ownerUserId) {
        userRepository.findById(ownerUserId).ifPresent(owner -> {
            String email = owner.getEmail();
            if (email == null || email.isBlank()) {
                return;
            }
            try {
                emailService.sendOwnerListingArchivedNotice(
                        email.trim(),
                        animal.getName(),
                        ListingCodeUtil.format(animal.getId()),
                        animal.getId()
                );
            } catch (RuntimeException ex) {
                // Archive succeeds even if email delivery fails.
            }
        });
    }

    static String requireAnimalGender(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("Animal gender is required (Male or Female)");
        }
        String g = raw.trim().toUpperCase(Locale.ROOT);
        if ("MALE".equals(g) || "M".equals(g)) {
            return "MALE";
        }
        if ("FEMALE".equals(g) || "F".equals(g)) {
            return "FEMALE";
        }
        throw new IllegalArgumentException("Animal gender must be Male or Female");
    }

    static String capitalizeWords(String value) {
        if (value == null || value.isBlank()) {
            return value;
        }
        String[] parts = value.trim().split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < parts.length; i++) {
            if (i > 0) {
                sb.append(' ');
            }
            String word = parts[i];
            if (word.isEmpty()) {
                continue;
            }
            String lower = word.toLowerCase(TEXT_LOCALE);
            sb.append(Character.toUpperCase(lower.charAt(0)));
            if (lower.length() > 1) {
                sb.append(lower.substring(1));
            }
        }
        return sb.toString();
    }

    static String capitalizeDescription(String value) {
        if (value == null || value.isBlank()) {
            return value;
        }
        String trimmed = value.trim();
        Matcher matcher = DESCRIPTION_SENTENCE_START.matcher(trimmed);
        StringBuilder out = new StringBuilder();
        while (matcher.find()) {
            matcher.appendReplacement(
                    out,
                    matcher.group(1)
                            + matcher.group(2).toUpperCase(TEXT_LOCALE));
        }
        matcher.appendTail(out);
        return out.toString();
    }

    static String normalizeListingStatus(String raw) {
        if (raw == null || raw.isBlank()) {
            return "ACTIVE";
        }
        String t = raw.trim().toUpperCase(Locale.ROOT);
        if (t.startsWith("ARCHIV")) {
            return "ARCHIVED";
        }
        if ("ADOPTED".equals(t)) {
            return "ADOPTED";
        }
        if ("RESERVED".equals(t)) {
            return "RESERVED";
        }
        if ("DELETED".equals(t)) {
            return "DELETED";
        }
        if ("DRAFT".equals(t)) {
            return "ACTIVE";
        }
        return "ACTIVE";
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

    public String imageApiPath(Long animalId, int sortOrder) {
        return "/api/animals/" + animalId + "/images/" + sortOrder;
    }

    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> serveAnimalImage(Long animalId, int sortOrder) {
        if (animalId == null) {
            return ResponseEntity.notFound().build();
        }
        AnimalImage row = animalImageRepository.findByAnimal_IdAndSortOrder(animalId, sortOrder)
                .orElse(null);
        if (row == null) {
            return ResponseEntity.notFound().build();
        }
        if (row.hasStoredBytes()) {
            MediaType type = MediaType.parseMediaType(
                    row.getContentType() != null ? row.getContentType() : "image/jpeg");
            return ResponseEntity.ok()
                    .contentType(type)
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                    .header("Cross-Origin-Resource-Policy", "cross-origin")
                    .body(row.getImageData());
        }
        return serveLegacyUploadFile(row.getImageUrl());
    }

    private ResponseEntity<byte[]> serveLegacyUploadFile(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return ResponseEntity.notFound().build();
        }
        String path = imageUrl.trim();
        try {
            if (path.startsWith("http://") || path.startsWith("https://")) {
                path = URI.create(path).getPath();
            }
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
        if (!path.startsWith("/uploads/")) {
            return ResponseEntity.notFound().build();
        }
        String relative = path.substring("/uploads/".length());
        Path uploadRoot = uploadRootHolder.getUploadRoot().normalize();
        Path file = uploadRoot.resolve(relative).normalize();
        if (!file.startsWith(uploadRoot) || !Files.isRegularFile(file) || !Files.isReadable(file)) {
            return ResponseEntity.notFound().build();
        }
        try {
            byte[] bytes = Files.readAllBytes(file);
            MediaType contentType = MediaType.IMAGE_JPEG;
            String probe = Files.probeContentType(file);
            if (probe != null && probe.startsWith("image/")) {
                contentType = MediaType.parseMediaType(probe);
            }
            return ResponseEntity.ok()
                    .contentType(contentType)
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                    .header("Cross-Origin-Resource-Policy", "cross-origin")
                    .body(bytes);
        } catch (IOException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Transactional
    public List<String> appendJpegImagesToListing(Long animalId, Long viewerId, List<MultipartFile> files) {
        Animal animal = assertAnimalOwnedBy(animalId, viewerId);
        if (files == null || files.isEmpty()) {
            return List.of();
        }
        try {
            List<String> urls = new ArrayList<>();
            int order = animal.getAnimalImages() != null ? animal.getAnimalImages().size() : 0;
            for (MultipartFile file : files) {
                if (file == null || file.isEmpty()) {
                    continue;
                }
                AnimalImage row = buildImageRow(animal, order, readJpegBytes(file), file.getContentType());
                animal.getAnimalImages().add(row);
                urls.add(row.getImageUrl());
                order++;
            }
            if (urls.isEmpty()) {
                throw new IllegalArgumentException("No valid image files were uploaded.");
            }
            animalRepository.save(animal);
            return urls;
        } catch (IOException e) {
            throw new RuntimeException("Image upload failed", e);
        }
    }

    @Transactional
    public List<String> uploadJpegImagesForOwner(Long animalId, Long viewerId, List<MultipartFile> files) {
        if (animalId == null) {
            throw new IllegalArgumentException("Listing id (animalId) is required for image upload");
        }
        if (viewerId == null) {
            throw new IllegalArgumentException("Viewer id is required");
        }
        User u = userRepository.findById(viewerId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (u.getRole() != Role.OWNER) {
            throw new IllegalArgumentException("Only owner accounts can upload listing images");
        }
        return appendJpegImagesToListing(animalId, viewerId, files);
    }

    private void attachJpegImages(Animal animal, List<MultipartFile> images) throws IOException {
        if (images == null || images.isEmpty()) {
            return;
        }
        List<AnimalImage> rows = new ArrayList<>();
        int order = 0;
        for (MultipartFile image : images) {
            if (image == null || image.isEmpty()) {
                continue;
            }
            rows.add(buildImageRow(animal, order, readJpegBytes(image), image.getContentType()));
            order++;
        }
        if (rows.isEmpty()) {
            throw new IllegalArgumentException("No valid image files were uploaded.");
        }
        animal.replaceAnimalImages(rows);
    }

    private AnimalImage buildImageRow(Animal animal, int sortOrder, byte[] data, String contentType) {
        AnimalImage row = new AnimalImage();
        row.setAnimal(animal);
        row.setSortOrder(sortOrder);
        row.setImageData(data);
        row.setContentType(normalizeContentType(contentType));
        row.setImageUrl(publishedAssetUrl(imageApiPath(animal.getId(), sortOrder)));
        return row;
    }

    private byte[] readJpegBytes(MultipartFile file) throws IOException {
        if (!isAllowedJpegUpload(file)) {
            throw new IllegalArgumentException(
                    "Only JPEG images are allowed (.jpg or .jpeg file extension, or image/jpeg)."
            );
        }
        byte[] data = file.getBytes();
        if (data.length > MAX_JPEG_BYTES) {
            throw new IllegalArgumentException("Each image must be 5 MB or smaller.");
        }
        return data;
    }

    private static String normalizeContentType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return "image/jpeg";
        }
        String ct = contentType.trim().toLowerCase(Locale.ROOT);
        if (ct.contains("jpeg") || "image/jpg".equals(ct)) {
            return "image/jpeg";
        }
        return contentType.trim();
    }

    /**
     * Reorders / filters images from URL list without dropping stored BLOB rows.
     */
    private void reconcileImageUrls(Animal animal, List<String> urls) {
        Long animalId = animal.getId();
        List<AnimalImage> current = animal.getAnimalImages() != null
                ? new ArrayList<>(animal.getAnimalImages())
                : new ArrayList<>();
        Map<Integer, AnimalImage> bySort = new HashMap<>();
        Map<String, AnimalImage> byUrl = new LinkedHashMap<>();
        for (AnimalImage row : current) {
            byUrl.put(row.getImageUrl(), row);
            Integer parsed = parseSortOrderFromImageUrl(row.getImageUrl(), animalId);
            if (parsed != null) {
                bySort.put(parsed, row);
            }
        }

        List<AnimalImage> next = new ArrayList<>();
        if (urls == null) {
            animal.replaceAnimalImages(next);
            return;
        }
        int order = 0;
        for (String raw : urls) {
            if (raw == null || raw.isBlank()) {
                continue;
            }
            String url = raw.trim();
            AnimalImage row = null;
            Integer parsed = parseSortOrderFromImageUrl(url, animalId);
            if (parsed != null && bySort.containsKey(parsed)) {
                row = bySort.get(parsed);
            } else if (byUrl.containsKey(url)) {
                row = byUrl.get(url);
            } else {
                row = new AnimalImage();
                row.setAnimal(animal);
                row.setImageUrl(url);
                row.setContentType("image/jpeg");
            }
            row.setAnimal(animal);
            row.setSortOrder(order);
            if (row.hasStoredBytes()) {
                row.setImageUrl(publishedAssetUrl(imageApiPath(animalId, order)));
            }
            next.add(row);
            order++;
        }
        animal.replaceAnimalImages(next);
    }

    private static Integer parseSortOrderFromImageUrl(String url, Long animalId) {
        if (url == null || animalId == null) {
            return null;
        }
        String path = url.trim();
        try {
            if (path.startsWith("http://") || path.startsWith("https://")) {
                path = URI.create(path).getPath();
            }
        } catch (Exception e) {
            return null;
        }
        Matcher m = API_IMAGE_PATH.matcher(path);
        if (!m.find()) {
            return null;
        }
        try {
            long id = Long.parseLong(m.group(1));
            if (id != animalId) {
                return null;
            }
            return Integer.parseInt(m.group(2));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    @Transactional
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
        existingAnimal.setDescription(capitalizeDescription(updatedAnimal.getDescription()));
        existingAnimal.setHousingLocation(updatedAnimal.getHousingLocation());
        if (updatedAnimal.getGender() != null && !updatedAnimal.getGender().isBlank()) {
            existingAnimal.setGender(requireAnimalGender(updatedAnimal.getGender()));
        }
        existingAnimal.setListingStatus(normalizeListingStatus(updatedAnimal.getListingStatus()));
        existingAnimal.setCompatibilityScore(updatedAnimal.getCompatibilityScore());
        reconcileImageUrls(existingAnimal, updatedAnimal.getImages());
        existingAnimal.setOwner(ownerKeep);

        return animalRepository.save(existingAnimal);
    }

    @Transactional
    public Animal createAnimal(AnimalRequest request) {
        Animal saved = persistNewAnimal(request);
        notifyOwnerListingPublished(saved, request.getOwnerId());
        return saved;
    }

    private Animal persistNewAnimal(AnimalRequest request) {
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
        animal.setDescription(capitalizeDescription(request.getDescription()));
        animal.setHousingLocation(request.getHousingLocation());
        animal.setGender(requireAnimalGender(request.getGender()));

        Animal saved = animalRepository.save(animal);
        ensureOwnerListingInSavedAnimals(saved);
        return saved;
    }

    private void notifyOwnerListingPublished(Animal animal, Long ownerUserId) {
        if (ownerUserId == null || animal == null) {
            return;
        }
        userRepository.findById(ownerUserId).ifPresent(owner -> {
            String email = owner.getEmail();
            if (email == null || email.isBlank()) {
                return;
            }
            try {
                emailService.sendOwnerListingPublishedNotice(
                        email.trim(),
                        animal.getName(),
                        ListingCodeUtil.format(animal.getId()),
                        animal.getId()
                );
            } catch (RuntimeException ex) {
                // Listing is saved even if email delivery fails.
            }
        });
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
        Animal animal = persistNewAnimal(request);
        try {
            if (images == null || images.isEmpty()) {
                throw new IllegalArgumentException("At least one image is required.");
            }
            attachJpegImages(animal, images);
            Animal saved = animalRepository.save(animal);
            notifyOwnerListingPublished(saved, request.getOwnerId());
            return saved;
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
        Animal animal = assertAnimalOwnedBy(id, viewerId);
        Long animalId = animal.getId();
        String animalName = animal.getName() != null ? animal.getName() : "Listing";
        Long ownerUserId = animal.getOwnerId();
        entityManager.detach(animal);
        removeListingFromDatabase(animalId);
        scheduleOwnerListingDeletedEmail(ownerUserId, animalName);
    }

    /**
     * Hard-deletes a listing and all dependent rows. Used by owner delete and admin moderation.
     */
    @Transactional
    public void removeListingFromDatabase(Long animalId) {
        if (animalId == null) {
            throw new IllegalArgumentException("Listing id is required");
        }
        purgeListingDependents(animalId);
        int removed = jdbcTemplate.update("DELETE FROM animals WHERE id = ?", animalId);
        if (removed == 0) {
            throw new RuntimeException("Animal not found with id: " + animalId);
        }
    }

    private void purgeListingDependents(Long animalId) {
        jdbcTemplate.update(
                "DELETE FROM inquiry_messages WHERE inquiry_id IN ("
                        + "SELECT id FROM (SELECT id FROM listing_inquiries WHERE animal_id = ?) AS li_ids"
                        + ")",
                animalId
        );
        jdbcTemplate.update("DELETE FROM adoption_cases WHERE animal_id = ?", animalId);
        jdbcTemplate.update("DELETE FROM listing_inquiries WHERE animal_id = ?", animalId);
        jdbcTemplate.update("DELETE FROM listing_reports WHERE animal_id = ?", animalId);
        jdbcTemplate.update("DELETE FROM match_snapshots WHERE animal_id = ?", animalId);
        jdbcTemplate.update("DELETE FROM saved_animals WHERE animal_id = ?", animalId);
        jdbcTemplate.update("DELETE FROM animal_images WHERE animal_id = ?", animalId);
    }

    private void scheduleOwnerListingDeletedEmail(Long ownerUserId, String animalName) {
        if (ownerUserId == null) {
            return;
        }
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            notifyOwnerListingDeleted(ownerUserId, animalName);
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                notifyOwnerListingDeleted(ownerUserId, animalName);
            }
        });
    }

    private void notifyOwnerListingDeleted(Long ownerUserId, String animalName) {
        if (ownerUserId == null) {
            return;
        }
        userRepository.findById(ownerUserId).ifPresent(owner -> {
            String email = owner.getEmail();
            if (email == null || email.isBlank()) {
                return;
            }
            try {
                emailService.sendOwnerListingDeletedNotice(email.trim(), animalName);
            } catch (RuntimeException ex) {
                // deletion succeeds even if the email delivery fails.
            }
        });
    }
}
