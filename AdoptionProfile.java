package pavia;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class AdoptionProfile {

    private static int _nextId = 1;
    private static final List<AdoptionProfile> _store = new ArrayList<>();

    private int profileId;

    private String housingType= "";
    private String indoorSpaceSize="";
    private String outdoorSpaceSize ="";
    private String workingHours = "";
    private String dailyRoutine ="";
    private String activityLevel = "";
    private String weekendRoutine= "";
    private String childrenInfo="";
    private String otherPetsInfo= "";
    private int householdMembers;
    private String primaryCaretaker="";
    private String previousPetExperience ="";
    private String preferredSpecies="";
    private String preferredSize= "";
    private String preferredAgeRange ="";
    private String preferredHealthConditions="";
    private String preferredBehaviorTraits = "";
    private int adopterId;

    public int getProfileId(){return profileId; }
    public String getHousingType(){return housingType; }
    public String getIndoorSpaceSize(){ return indoorSpaceSize; }
    public String getOutdoorSpaceSize(){ return outdoorSpaceSize;}
    public String getWorkingHours(){return workingHours; }
    public String getDailyRoutine(){return dailyRoutine;}
    public String getActivityLevel(){ return activityLevel;}
    public String getWeekendRoutine(){return weekendRoutine;}
    public String getChildrenInfo(){ return childrenInfo; }
    public String getOtherPetsInfo(){return otherPetsInfo;}
    public int getHouseholdMembers(){ return householdMembers; }
    public String getPrimaryCaretaker(){ return primaryCaretaker; }
    public String getPreviousPetExperience(){ return previousPetExperience;}
    public String getPreferredSpecies(){ return preferredSpecies;}
    public String getPreferredSize(){ return preferredSize; }
    public String getPreferredAgeRange(){ return preferredAgeRange; }
    public String getPreferredHealthConditions(){ return preferredHealthConditions; }
    public String getPreferredBehaviorTraits(){ return preferredBehaviorTraits; }
    public int getAdopterId(){return adopterId;}

    public AdoptionProfile(int adopterId,
            String housingType,String indoorSpaceSize, String outdoorSpaceSize,
            String workingHours,String dailyRoutine, String activityLevel,String weekendRoutine,
            String childrenInfo, String otherPetsInfo,int householdMembers,
            String primaryCaretaker, String previousPetExperience,
            String preferredSpecies, String preferredSize,String preferredAgeRange,
            String preferredHealthConditions,String preferredBehaviorTraits) {
        this.adopterId= adopterId;
        this.housingType= housingType;
        this.indoorSpaceSize =indoorSpaceSize;
        this.outdoorSpaceSize=outdoorSpaceSize;
        this.workingHours=workingHours;
        this.dailyRoutine= dailyRoutine;
        this.activityLevel= activityLevel;
        this.weekendRoutine= weekendRoutine;
        this.childrenInfo= childrenInfo;
        this.otherPetsInfo =otherPetsInfo;
        this.householdMembers =householdMembers;
        this.primaryCaretaker =primaryCaretaker;
        this.previousPetExperience= previousPetExperience;
        this.preferredSpecies= preferredSpecies;
        this.preferredSize = preferredSize;
        this.preferredAgeRange =preferredAgeRange;
        this.preferredHealthConditions=preferredHealthConditions;
        this.preferredBehaviorTraits=preferredBehaviorTraits;
    }

    public String createProfile() {
        List<String> errors=validate();
        if (!errors.isEmpty())
            throw new IllegalArgumentException("Adoption profile validation failed:\n  • " + String.join("\n  • ", errors));

        profileId = _nextId++;
        _store.add(this);

        String summary=reviewProfile();
        System.out.println(summary);

        CompatibilityMatch.generateForProfile(this);

        System.out.println("Adoption profile created (ID: " + profileId + ").");
        return summary;
    }

    public String updateProfile(
            String housingType, String indoorSpaceSize, String outdoorSpaceSize,
            String workingHours, String dailyRoutine, String activityLevel, String weekendRoutine,
            String childrenInfo, String otherPetsInfo, Integer householdMembers,
            String primaryCaretaker, String previousPetExperience,
            String preferredSpecies, String preferredSize, String preferredAgeRange,
            String preferredHealthConditions, String preferredBehaviorTraits) {
        if (housingType!= null) this.housingType=housingType;
        if (indoorSpaceSize!= null)this.indoorSpaceSize=indoorSpaceSize;
        if (outdoorSpaceSize!= null) this.outdoorSpaceSize =outdoorSpaceSize;
        if (workingHours!= null)this.workingHours= workingHours;
        if (dailyRoutine!= null)this.dailyRoutine=dailyRoutine;
        if (activityLevel!= null) this.activityLevel=activityLevel;
        if (weekendRoutine !=null) this.weekendRoutine=weekendRoutine;
        if (childrenInfo !=null) this.childrenInfo=childrenInfo;
        if (otherPetsInfo !=null) this.otherPetsInfo= otherPetsInfo;
        if (householdMembers !=null) this.householdMembers=householdMembers;
        if (primaryCaretaker!=null) this.primaryCaretaker=primaryCaretaker;
        if (previousPetExperience!=null)this.previousPetExperience =previousPetExperience;
        if (preferredSpecies!= null) this.preferredSpecies= preferredSpecies;
        if (preferredSize!= null) this.preferredSize= preferredSize;
        if (preferredAgeRange!= null) this.preferredAgeRange= preferredAgeRange;
        if (preferredHealthConditions!= null) this.preferredHealthConditions= preferredHealthConditions;
        if (preferredBehaviorTraits!= null) this.preferredBehaviorTraits=preferredBehaviorTraits;

        List<String> errors =validate();
        if (!errors.isEmpty())
            throw new IllegalArgumentException("Updated adoption profile is invalid:\n  • " + String.join("\n  • ", errors));

        String summary=reviewProfile();
        System.out.println(summary);

        CompatibilityMatch.generateForProfile(this);

        System.out.println("Adoption profile " + profileId + " updated successfully.");
        return summary;
    }

    public String reviewProfile() {
        return 
        //"╔══════════════════════════════════════════════╗\n" +
               " ADOPTION PROFILE REVIEW  (ID: " + profileId + ")\n" +
               //"╚══════════════════════════════════════════════╝\n" +
               "\n" +
               "Section 1: Home Environment\n" +
               "  Housing Type        : " + housingType + "\n" +
               "  Indoor Space        : " + indoorSpaceSize + "\n" +
               "  Outdoor Space       : " + outdoorSpaceSize + "\n" +
               "\n" +
               "Section 2: Routine & Lifestyle n" +
               "  Working Hours/Day   : " + workingHours + "\n" +
               "  Daily Routine       : " + dailyRoutine + "\n" +
               "  Activity Level      : " + activityLevel + "\n" +
               "  Weekend Routine     : " + weekendRoutine + "\n" +
               "\n" +
               "Section 3: Household Information\n" +
               "  Household Members   : " + householdMembers + "\n" +
               "  Children Info       : " + childrenInfo + "\n" +
               "  Other Pets          : " + otherPetsInfo + "\n" +
               "  Primary Caretaker   : " + primaryCaretaker + "\n" +
               "  Pet Experience      : " + previousPetExperience + "\n" +
               "\n" +
               "Section 4: Animal Preferences\n" +
               "  Preferred Species   : " + preferredSpecies + "\n" +
               "  Preferred Size      : " + preferredSize + "\n" +
               "  Preferred Age Range : " + preferredAgeRange + "\n" +
               "  Health Conditions   : " + preferredHealthConditions + "\n" +
               "  Behavior Traits     : " + preferredBehaviorTraits;
    }

    public static AdoptionProfile getById(int id) {
        return _store.stream().filter(p -> p.profileId == id).findFirst().orElse(null);
    }

    public static AdoptionProfile getByAdopter(int adopterId) {
        return _store.stream().filter(p -> p.adopterId == adopterId).findFirst().orElse(null);
    }

    private List<String> validate() {
        List<String> errors = new ArrayList<>();
        requireField(housingType, "Housing Type", errors);
        requireField(indoorSpaceSize, "Indoor Space Size", errors);
        requireField(outdoorSpaceSize, "Outdoor Space Size", errors);
        requireField(workingHours, "Working Hours", errors);
        requireField(dailyRoutine, "Daily Routine", errors);
        requireField(activityLevel, "Activity Level", errors);
        requireField(weekendRoutine, "Weekend Routine", errors);
        requireField(childrenInfo, "Children Info", errors);
        requireField(otherPetsInfo, "Other Pets Info", errors);
        requireField(primaryCaretaker, "Primary Caretaker", errors);
        requireField(previousPetExperience, "Previous Pet Experience", errors);
        if (householdMembers < 1) errors.add("Household Members must be at least 1.");
        requireField(preferredSpecies, "Preferred Species", errors);
        requireField(preferredSize, "Preferred Size", errors);
        requireField(preferredAgeRange, "Preferred Age Range", errors);
        requireField(preferredHealthConditions, "Preferred Health Conditions", errors);
        requireField(preferredBehaviorTraits, "Preferred Behavior Traits", errors);
        return errors;
    }

    private static void requireField(String value, String label, List<String> errors) {
        if (value == null || value.trim().isEmpty()) errors.add("'" + label + "' is required.");
    }
}
