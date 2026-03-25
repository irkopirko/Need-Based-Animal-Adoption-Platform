package pavia;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

public class CompatibilityCriteria {

    public static final CompatibilityCriteria Default = new CompatibilityCriteria(
            0.20f, 0.25f, 0.25f, 0.20f, 0.10f);

    private int criteriaId;
    private float environmentWeight;
    private float lifestyleWeight;
    private float householdWeight;
    private float behaviorWeight;
    private float healthPreferenceWeight;

    private static int _nextId = 1;

    public CompatibilityCriteria(float environmentWeight, float lifestyleWeight,
            float householdWeight, float behaviorWeight, float healthPreferenceWeight) {
        float total = environmentWeight + lifestyleWeight + householdWeight + behaviorWeight + healthPreferenceWeight;
        if (total <= 0f) throw new IllegalArgumentException("At least one weight must be positive.");

        this.environmentWeight      = environmentWeight      / total;
        this.lifestyleWeight        = lifestyleWeight        / total;
        this.householdWeight        = householdWeight        / total;
        this.behaviorWeight         = behaviorWeight         / total;
        this.healthPreferenceWeight = healthPreferenceWeight / total;
        this.criteriaId = _nextId++;
    }

    public int getCriteriaId()             { return criteriaId; }
    public float getEnvironmentWeight()    { return environmentWeight; }
    public float getLifestyleWeight()      { return lifestyleWeight; }
    public float getHouseholdWeight()      { return householdWeight; }
    public float getBehaviorWeight()       { return behaviorWeight; }
    public float getHealthPreferenceWeight() { return healthPreferenceWeight; }

    public float evaluateCompatibility(AdoptionProfile adopter, AnimalProfile animal) {
        float env       = scoreEnvironment(adopter, animal);
        float lifestyle = scoreLifestyle(adopter, animal);
        float household = scoreHousehold(adopter, animal);
        float behavior  = scoreBehavior(adopter, animal);
        float health    = scoreHealthPreference(adopter, animal);

        float total = (env * environmentWeight) + (lifestyle * lifestyleWeight)
                    + (household * householdWeight) + (behavior * behaviorWeight)
                    + (health * healthPreferenceWeight);

        return Math.max(0f, Math.min(1f, total));
    }

    private static float scoreEnvironment(AdoptionProfile a, AnimalProfile p) {
        float score = 0f; int checks = 0;
        score += keywordOverlap(a.getHousingType(), p.getIndoorOutdoorSuitability()); checks++;
        score += keywordOverlap(a.getOutdoorSpaceSize(), p.getExerciseNeeds()); checks++;
        score += keywordOverlap(a.getIndoorSpaceSize(), p.getIndoorOutdoorSuitability()); checks++;
        return score / checks;
    }

    private static float scoreLifestyle(AdoptionProfile a, AnimalProfile p) {
        float score = 0f; int checks = 0;
        score += keywordOverlap(a.getActivityLevel(), p.getActivityLevel()); checks++;
        score += keywordOverlap(a.getDailyRoutine(), p.getExerciseNeeds()); checks++;
        score += scoreWorkingHours(a.getWorkingHours(), p.getActivityLevel()); checks++;
        score += keywordOverlap(a.getWeekendRoutine(), p.getActivityLevel()); checks++;
        return score / checks;
    }

    private static float scoreHousehold(AdoptionProfile a, AnimalProfile p) {
        float score = 0f; int checks = 0;
        score += scoreChildCompatibility(a.getChildrenInfo(), p.getChildCompatibility()); checks++;
        score += scoreAnimalCompatibility(a.getOtherPetsInfo(), p.getAnimalCompatibility()); checks++;
        score += scoreHouseholdSize(a.getHouseholdMembers(), p.getTemperament()); checks++;
        return score / checks;
    }

    private static float scoreBehavior(AdoptionProfile a, AnimalProfile p) {
        return keywordOverlap(a.getPreferredBehaviorTraits(), p.getTemperament());
    }

    private static float scoreHealthPreference(AdoptionProfile a, AnimalProfile p) {
        float score = 0f; int checks = 0;
        score += keywordOverlap(a.getPreferredHealthConditions(), p.getVaccinationStatus()); checks++;
        score += keywordOverlap(a.getPreferredHealthConditions(), p.getMedicalConditions()); checks++;
        score += keywordOverlap(a.getPreferredHealthConditions(), p.getNeuteredStatus()); checks++;
        return score / checks;
    }

    private static float keywordOverlap(String a, String b) {
        Set<String> setA = tokenize(a);
        Set<String> setB = tokenize(b);
        if (setA.isEmpty() && setB.isEmpty()) return 1f;
        if (setA.isEmpty() || setB.isEmpty()) return 0f;

        Set<String> intersection = new HashSet<>(setA);
        intersection.retainAll(setB);

        Set<String> union = new HashSet<>(setA);
        union.addAll(setB);

        return union.isEmpty() ? 1f : (float) intersection.size() / union.size();
    }

    private static Set<String> tokenize(String value) {
        if (value == null || value.trim().isEmpty()) return new HashSet<>();
        return Arrays.stream(value.split("[\\s,;/\\-_]+"))
                .map(t -> t.trim().toLowerCase())
                .filter(t -> !t.isEmpty())
                .collect(Collectors.toCollection(HashSet::new));
    }

    private static float scoreWorkingHours(String workingHours, String animalActivityLevel) {
        float hours;
        StringBuilder digits = new StringBuilder();
        for (char c : workingHours.toCharArray()) {
            if (Character.isDigit(c)) digits.append(c);
        }
        try {
            hours = digits.length() > 0 ? Float.parseFloat(digits.toString()) : 8f;
        } catch (NumberFormatException e) {
            hours = 8f;
        }
        boolean isHighEnergy = keywordOverlap(animalActivityLevel, "high active energetic") > 0.1f;
        if (!isHighEnergy) return 1f;
        return Math.max(0f, Math.min(1f, 1f - hours / 10f));
    }

    private static float scoreChildCompatibility(String childrenInfo, String childCompatibility) {
        boolean hasChildren  = containsAny(childrenInfo,      "has", "children", "kids", "toddler", "baby");
        boolean noChildren   = containsAny(childrenInfo,      "no", "none", "without");
        boolean goodWithKids = containsAny(childCompatibility, "good", "great", "yes", "friendly", "compatible");
        boolean notGoodKids  = containsAny(childCompatibility, "no", "not", "bad", "incompatible", "avoid");
        if (hasChildren && goodWithKids) return 1f;
        if (noChildren  && notGoodKids)  return 1f;
        if (hasChildren && notGoodKids)  return 0f;
        return 0.5f;
    }

    private static float scoreAnimalCompatibility(String otherPetsInfo, String animalCompatibility) {
        boolean hasPets      = containsAny(otherPetsInfo,       "has", "dog", "cat", "pet", "animal", "other");
        boolean noPets       = containsAny(otherPetsInfo,       "no", "none", "without", "only");
        boolean goodWithPets = containsAny(animalCompatibility, "good", "great", "yes", "friendly", "compatible");
        boolean notGoodPets  = containsAny(animalCompatibility, "no", "not", "bad", "incompatible", "avoid");
        if (hasPets && goodWithPets) return 1f;
        if (noPets  && notGoodPets)  return 1f;
        if (hasPets && notGoodPets)  return 0f;
        return 0.5f;
    }

    private static float scoreHouseholdSize(int members, String temperament) {
        boolean isSocial = containsAny(temperament, "social", "friendly", "affectionate", "playful");
        if (!isSocial) return 1f;
        if (members == 1) return 0.6f;
        if (members == 2) return 0.8f;
        return 1.0f;
    }

    private static boolean containsAny(String source, String... keywords) {
        if (source == null || source.trim().isEmpty()) return false;
        String lower = source.toLowerCase();
        for (String k : keywords) {
            if (lower.contains(k.toLowerCase())) return true;
        }
        return false;
    }
}
