package pavia;

import java.util.ArrayList;
import java.util.List;
import java.util.TreeSet;
import java.util.stream.Collectors;

public class AnimalImage {

    public static final TreeSet<String> SupportedFormats;

    static {
        SupportedFormats = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
        SupportedFormats.add(".jpg");
        SupportedFormats.add(".jpeg");
        SupportedFormats.add(".png");
        SupportedFormats.add(".webp");
        SupportedFormats.add(".gif");
    }

    private static final int MIN_IMAGES_PER_PROFILE = 3;

    private static int _nextId = 1;
    private static final List<AnimalImage> _store = new ArrayList<>();

    private int imageId;
    private String imageUrl = "";
    private String caption = "";
    private int parentAnimalId;

    public int getImageId() { return imageId; }
    public String getImageUrl() { return imageUrl; }
    public String getCaption() { return caption; }
    public void setCaption(String caption) { this.caption = caption; }
    public int getParentAnimalId() { return parentAnimalId; }

    public String uploadImage(String imagePath, AnimalProfile parentProfile, String caption) {
        if (imagePath == null || imagePath.trim().isEmpty())
            throw new IllegalArgumentException("Image path cannot be empty.");

        String ext = imagePath.contains(".") ? imagePath.substring(imagePath.lastIndexOf('.')) : "";

        if (ext == null || ext.trim().isEmpty())
            throw new IllegalArgumentException(
                "Could not determine file extension for '" + imagePath + "'. Accepted formats: " + String.join(", ", SupportedFormats) + ".");

        if (!SupportedFormats.contains(ext))
            throw new IllegalArgumentException(
                "Unsupported image format '" + ext + "' for '" + getFileName(imagePath) + "'. Accepted formats: " + String.join(", ", SupportedFormats) + ".");

        this.imageId = _nextId++;
        this.imageUrl = imagePath;
        this.caption = caption != null ? caption : "";
        this.parentAnimalId = parentProfile.getAnimalId();

        _store.add(this);

        String confirmation = "Image uploaded successfully — ID: " + imageId + ", file: '" + getFileName(imagePath) + "'.";
        System.out.println(confirmation);
        return confirmation;
    }

    public String uploadImage(String imagePath, AnimalProfile parentProfile) {
        return uploadImage(imagePath, parentProfile, "");
    }

    public void deleteImage(AnimalProfile parentProfile) {
        if (!parentProfile.getImages().contains(this))
            throw new IllegalStateException(
                "Image " + imageId + " does not belong to animal profile '" + parentProfile.getName() + "' (ID: " + parentProfile.getAnimalId() + ").");

        if (!parentProfile.getStatus().equals("Draft") && parentProfile.getImages().size() <= MIN_IMAGES_PER_PROFILE)
            throw new IllegalStateException(
                "Cannot delete image " + imageId + ": animal profile '" + parentProfile.getName() +
                "' must keep at least " + MIN_IMAGES_PER_PROFILE + " images while in '" + parentProfile.getStatus() + "' status.");

        parentProfile.getImages().remove(this);
        _store.remove(this);

        System.out.println("Image " + imageId + " ('" + getFileName(imageUrl) + "') deleted from profile '" + parentProfile.getName() + "'.");
    }

    public static AnimalImage getById(int id) {
        return _store.stream().filter(img -> img.imageId == id).findFirst().orElse(null);
    }

    public static List<AnimalImage> getByProfile(int animalId) {
        return _store.stream().filter(img -> img.parentAnimalId == animalId).collect(Collectors.toList());
    }

    private static String getFileName(String path) {
        return (path.contains("/") || path.contains("\\"))
            ? path.substring(path.lastIndexOf(java.io.File.separatorChar) + 1)
            : path;
    }
}
