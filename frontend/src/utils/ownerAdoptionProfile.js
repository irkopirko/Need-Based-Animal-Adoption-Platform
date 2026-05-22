/** Build readable rows from an adoption request payload for owner review. */

function val(v) {
  if (v == null || v === "") {
    return "—";
  }
  return String(v);
}

function listVal(v) {
  if (v == null || v === "") {
    return "—";
  }
  const s = String(v);
  if (s.includes(",")) {
    return s
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .join(", ");
  }
  return s;
}

export function isSubmittedAdoptionRequest(request) {
  if (!request || request.found === false) {
    return false;
  }
  return String(request.requestPhase || "").toUpperCase() === "SUBMITTED";
}

export function buildAdoptionProfileSections(request) {
  if (!request || request.found === false) {
    return [];
  }

  return [
    {
      title: "Home & environment",
      rows: [
        ["Indoor space", val(request.indoorSpace)],
        ["Living space", val(request.livingSpace)],
        ["Living space (other)", val(request.livingSpaceOther)],
        ["Housing status", val(request.housingStatus)],
        ["Garden", val(request.hasGarden)],
        ["Outdoor access", val(request.outdoorAccess)]
      ]
    },
    {
      title: "Lifestyle",
      rows: [
        ["Activity level", val(request.activityLevel)],
        ["Work schedule", val(request.workSchedule)],
        ["Time at home", val(request.timeAtHome)]
      ]
    },
    {
      title: "Household",
      rows: [
        ["Household type", val(request.householdType)],
        ["Children", val(request.hasChildren)],
        ["Children age group", val(request.childrenAgeGroup)],
        ["Other pets", val(request.hasOtherPets)],
        ["Other pet types", listVal(request.otherPetsType)],
        ["Other pets (other)", val(request.otherPetsTypeOther)],
        ["Primary caretaker", val(request.primaryCaretaker)],
        ["Caretaker (other)", val(request.primaryCaretakerOther)]
      ]
    },
    {
      title: "Experience",
      rows: [
        ["Previous pet experience", val(request.hasPreviousExperience)],
        ["Previous pet types", listVal(request.previousPetTypes)],
        ["Previous types (other)", val(request.previousPetTypesOther)]
      ]
    },
    {
      title: "Preferences",
      rows: [
        ["Preferred animal types", listVal(request.preferredAnimalTypes)],
        ["Preferred energy", listVal(request.preferredEnergyLevels)],
        ["Preferred age ranges", listVal(request.preferredAgeRanges)],
        ["Preferred sizes", listVal(request.preferredSizes)],
        ["Grooming tolerance", val(request.groomingTolerance)],
        ["Special needs acceptance", val(request.specialNeedsAcceptance)]
      ]
    },
    {
      title: "Notes",
      rows: [["Additional notes", val(request.notes)]]
    }
  ];
}
