package pavia;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

public class CompatibilityMatch {

    public static final float DefaultThreshold = 0.50f;

    private static int _nextId = 1;
    private static final List<CompatibilityMatch> _store = new ArrayList<>();

    private int matchId;
    private float compatibilityScore;
    private float matchPercentage;
    private String thresholdStatus = "";
    private int rankOrder;
    private int adoptionProfileId;
    private int animalId;

    public int getMatchId()            { return matchId; }
    public float getCompatibilityScore() { return compatibilityScore; }
    public float getMatchPercentage()  { return matchPercentage; }
    public String getThresholdStatus() { return thresholdStatus; }
    public int getRankOrder()          { return rankOrder; }
    public int getAdoptionProfileId()  { return adoptionProfileId; }
    public int getAnimalId()           { return animalId; }

    public static List<CompatibilityMatch> generateForProfile(
            AdoptionProfile adoptionProfile, CompatibilityCriteria criteria) {
        if (adoptionProfile == null)
            throw new IllegalArgumentException(
                    "No adoption profile found. Please create an adoption profile before generating matches.");

        if (criteria == null) criteria = CompatibilityCriteria.Default;

        final int profileId = adoptionProfile.getProfileId();
        _store.removeIf(m -> m.adoptionProfileId == profileId);

        List<AnimalProfile> activeAnimals = AnimalProfile.getAllActive();

        if (activeAnimals.isEmpty()) {
            System.out.println("No active animal listings available for matching at this time.");
            return new ArrayList<>();
        }

        List<CompatibilityMatch> raw = new ArrayList<>();
        for (AnimalProfile animal : activeAnimals) {
            CompatibilityMatch match = new CompatibilityMatch();
            match.calculateScore(adoptionProfile, animal, criteria);
            raw.add(match);
        }

        List<CompatibilityMatch> ranked = rankMatches(filterMatches(raw));
        _store.addAll(ranked);

        System.out.println("Generated " + ranked.size() + " match(es) above threshold for adoption profile " + adoptionProfile.getProfileId() + ".");
        return ranked;
    }

    public static List<CompatibilityMatch> generateForProfile(AdoptionProfile adoptionProfile) {
        return generateForProfile(adoptionProfile, null);
    }

    public static List<CompatibilityMatch> getMatchesForAdopter(AdoptionProfile profile) {
        List<CompatibilityMatch> matches = _store.stream()
                .filter(m -> m.adoptionProfileId == profile.getProfileId()
                        && "above_threshold".equals(m.thresholdStatus))
                .sorted(Comparator.comparingInt(m -> m.rankOrder))
                .collect(Collectors.toList());

        if (matches.isEmpty())
            System.out.println("No compatibility matches found. Make sure your adoption profile is submitted and animal listings are active.");

        return matches;
    }

    public float calculateScore(AdoptionProfile adoptionProfile, AnimalProfile animalProfile,
            CompatibilityCriteria criteria) {
        if (criteria == null) criteria = CompatibilityCriteria.Default;

        float score = criteria.evaluateCompatibility(adoptionProfile, animalProfile);

        matchId           = _nextId++;
        adoptionProfileId = adoptionProfile.getProfileId();
        animalId          = animalProfile.getAnimalId();
        compatibilityScore = score;
        matchPercentage   = Math.round(score * 1000f) / 10.0f;
        thresholdStatus   = score >= DefaultThreshold ? "above_threshold" : "below_threshold";
        rankOrder         = 0;

        return score;
    }

    public static List<CompatibilityMatch> filterMatches(List<CompatibilityMatch> matches) {
        return matches.stream()
                .filter(m -> "above_threshold".equals(m.thresholdStatus))
                .collect(Collectors.toList());
    }

    public static List<CompatibilityMatch> rankMatches(List<CompatibilityMatch> matches) {
        List<CompatibilityMatch> sorted = matches.stream()
                .sorted(Comparator.comparingDouble(CompatibilityMatch::getCompatibilityScore).reversed())
                .collect(Collectors.toList());
        for (int i = 0; i < sorted.size(); i++) sorted.get(i).rankOrder = i + 1;
        return sorted;
    }

    public static List<CompatibilityMatch> filterByPreference(
            List<CompatibilityMatch> matches, String species, String size) {
        return matches.stream().filter(m -> {
            AnimalProfile animal = AnimalProfile.getById(m.animalId);
            if (animal == null) return false;
            if (species != null && !animal.getSpecies().toLowerCase().contains(species.toLowerCase())) return false;
            if (size != null && !animal.getActivityLevel().toLowerCase().contains(size.toLowerCase())) return false;
            return true;
        }).collect(Collectors.toList());
    }

    @Override
    public String toString() {
        AnimalProfile animal = AnimalProfile.getById(animalId);
        String animalName = animal != null ? animal.getName() : "Animal #" + animalId;
        return "[Rank " + rankOrder + "] " + animalName + " \u2014 " + matchPercentage + "% compatible (" + thresholdStatus + ")";
    }
}
