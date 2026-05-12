import React, { useEffect, useMemo, useState } from "react";
import "./AdoptionRequestPage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";
import { usePopup } from "../components/PopupProvider";
import {
  broadcastStoredUserRefresh,
  getApiBaseUrl,
  getStoredUser,
  normalizeRole
} from "../utils/auth";

function AdoptionRequestPage() {
  const navigate = useNavigate();
  const { showPopup } = usePopup();

  const defaultFormData = {
    indoorSpace: "",
    livingSpace: "",
    livingSpaceOther: "",
    housingStatus: "",
    hasGarden: "",
    outdoorAccess: "",
    activityLevel: "",
    workSchedule: "",
    timeAtHome: "",
    householdType: "",
    hasChildren: "",
    childrenAgeGroup: [],
    hasOtherPets: "",
    otherPetsType: [],
    otherPetsTypeOther: "",
    primaryCaretaker: "",
    primaryCaretakerOther: "",
    hasPreviousExperience: "",
    previousPetTypes: [],
    previousPetTypesOther: "",
    preferredAnimalTypes: [],
    preferredEnergyLevels: [],
    preferredAgeRanges: [],
    preferredSizes: [],
    groomingTolerance: [],
    specialNeedsAcceptance: "",
    notes: ""
  };

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(defaultFormData);
  const [errors, setErrors] = useState({});
  const [requestSaved, setRequestSaved] = useState(false);
  const [lastSavedRequestId, setLastSavedRequestId] = useState(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  const totalSteps = 6;

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const user = getStoredUser();
      if (!user?.userId) {
        navigate("/login", { replace: true });
        return;
      }

      if (normalizeRole(user.role) === "ADOPTER") {
        try {
          const response = await fetch(
            `${getApiBaseUrl()}/api/auth/profile/${user.userId}`
          );
          if (cancelled) {
            return;
          }
          if (response.ok) {
            const profile = await response.json();
            const prev = getStoredUser() || {};
            localStorage.setItem(
              "paviaUser",
              JSON.stringify({
                ...prev,
                adopterProfileCompleted: profile.adopterProfileCompleted
              })
            );
            broadcastStoredUserRefresh();
            if (!profile.adopterProfileCompleted) {
              navigate("/complete-adopter-profile", { replace: true });
              return;
            }
          }
        } catch (err) {
          console.error(err);
        }
      }

      if (cancelled) {
        return;
      }

      const editingId = localStorage.getItem("editingRequestId");
      const storedRequests = JSON.parse(localStorage.getItem("adoptionRequests")) || [];

      if (editingId) {
        const existingRequest = storedRequests.find(
          (item) => String(item.id) === String(editingId)
        );

        if (existingRequest) {
          setFormData(existingRequest);
        }
      }

      setBootstrapped(true);
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const applyDefaultValues = () => {
    return {
      ...formData,
      housingStatus: formData.housingStatus || "Not Specified",
      childrenAgeGroup:
        formData.hasChildren === "Yes" && formData.childrenAgeGroup.length === 0
          ? ["Not Specified"]
          : formData.childrenAgeGroup,
      otherPetsType:
        formData.hasOtherPets === "Yes" && formData.otherPetsType.length === 0
          ? ["Not Specified"]
          : formData.otherPetsType,
      otherPetsTypeOther:
        formData.otherPetsType.includes("Other") &&
        formData.otherPetsTypeOther.trim() === ""
          ? "Not Specified"
          : formData.otherPetsTypeOther,
      primaryCaretaker: formData.primaryCaretaker || "Me",
      primaryCaretakerOther:
        formData.primaryCaretaker === "Other" &&
        formData.primaryCaretakerOther.trim() === ""
          ? "Not Specified"
          : formData.primaryCaretakerOther,
      previousPetTypes:
        formData.hasPreviousExperience === "Yes" &&
        formData.previousPetTypes.length === 0
          ? ["Not Specified"]
          : formData.previousPetTypes,
      previousPetTypesOther:
        formData.previousPetTypes.includes("Other") &&
        formData.previousPetTypesOther.trim() === ""
          ? "Not Specified"
          : formData.previousPetTypesOther,
      notes: formData.notes.trim() === "" ? "No additional notes" : formData.notes
    };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: false
    }));

    if (step === 6) {
      setRequestSaved(false);
    }
  };

  const handleCheckboxArrayChange = (fieldName, value) => {
    const currentValues = formData[fieldName];

    if (currentValues.includes(value)) {
      setFormData((prev) => ({
        ...prev,
        [fieldName]: currentValues.filter((item) => item !== value)
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [fieldName]: [...currentValues, value]
      }));
    }

    setErrors((prev) => ({
      ...prev,
      [fieldName]: false
    }));

    if (step === 6) {
      setRequestSaved(false);
    }
  };

  const RequiredLabel = ({ children }) => (
    <label>
      {children}
      <span className="required-star">*</span>
    </label>
  );

  const showChildrenAge = formData.hasChildren === "Yes";
  const showOtherPetsType = formData.hasOtherPets === "Yes";
  const showPreviousPetTypes = formData.hasPreviousExperience === "Yes";
  const showLivingSpaceOther = formData.livingSpace === "Other";
  const showOtherPetsOther = formData.otherPetsType.includes("Other");
  const showPreviousPetTypesOther = formData.previousPetTypes.includes("Other");
  const showPrimaryCaretakerOther = formData.primaryCaretaker === "Other";

  const selectedAnimalTypes = formData.preferredAnimalTypes;

  const ageOptions = useMemo(() => {
    const options = [];

    if (selectedAnimalTypes.includes("Dog")) {
      options.push("Dog - Puppy / Young", "Dog - Adult", "Dog - Senior");
    }

    if (selectedAnimalTypes.includes("Cat")) {
      options.push("Cat - Kitten / Young", "Cat - Adult", "Cat - Senior");
    }

    return options;
  }, [selectedAnimalTypes]);

  const groomingOptions = useMemo(() => {
    const options = [];

    if (selectedAnimalTypes.includes("Dog")) {
      options.push(
        "Dog - Low Grooming",
        "Dog - Medium Grooming",
        "Dog - High Grooming"
      );
    }

    if (selectedAnimalTypes.includes("Cat")) {
      options.push(
        "Cat - Low Grooming",
        "Cat - Medium Grooming",
        "Cat - High Grooming"
      );
    }

    return options;
  }, [selectedAnimalTypes]);

  const sizeOptions = useMemo(() => {
    const options = [];

    if (selectedAnimalTypes.includes("Dog")) {
      options.push("Dog - Small", "Dog - Medium", "Dog - Large");
    }

    return options;
  }, [selectedAnimalTypes]);

  const getAnimalSpecificSelections = (animalType, values) => {
    return values.filter((item) => item.startsWith(`${animalType} -`));
  };

  const validateCurrentStep = () => {
    const newErrors = {};

    if (step === 1) {
      if (formData.indoorSpace === "") newErrors.indoorSpace = true;
      if (formData.livingSpace === "") newErrors.livingSpace = true;
      if (formData.hasGarden === "") newErrors.hasGarden = true;
      if (formData.outdoorAccess === "") newErrors.outdoorAccess = true;

      if (showLivingSpaceOther && formData.livingSpaceOther.trim() === "") {
        newErrors.livingSpaceOther = true;
      }
    }

    if (step === 2) {
      if (formData.activityLevel === "") newErrors.activityLevel = true;
      if (formData.workSchedule === "") newErrors.workSchedule = true;
      if (formData.timeAtHome === "") newErrors.timeAtHome = true;
    }

    if (step === 3) {
      if (formData.householdType === "") newErrors.householdType = true;
      if (formData.hasChildren === "") newErrors.hasChildren = true;
      if (formData.hasOtherPets === "") newErrors.hasOtherPets = true;
    }

    if (step === 4) {
      if (formData.hasPreviousExperience === "") {
        newErrors.hasPreviousExperience = true;
      }
    }

    if (step === 5) {
      if (formData.preferredAnimalTypes.length === 0) {
        newErrors.preferredAnimalTypes = true;
      }

      if (formData.preferredEnergyLevels.length === 0) {
        newErrors.preferredEnergyLevels = true;
      }

      if (formData.specialNeedsAcceptance === "") {
        newErrors.specialNeedsAcceptance = true;
      }

      if (selectedAnimalTypes.length > 0 && formData.preferredAgeRanges.length === 0) {
        newErrors.preferredAgeRanges = true;
      }

      if (selectedAnimalTypes.length > 0 && formData.groomingTolerance.length === 0) {
        newErrors.groomingTolerance = true;
      }

      if (sizeOptions.length > 0 && formData.preferredSizes.length === 0) {
        newErrors.preferredSizes = true;
      }

      for (const animalType of selectedAnimalTypes) {
        const ageSelections = getAnimalSpecificSelections(
          animalType,
          formData.preferredAgeRanges
        );

        const groomingSelections = getAnimalSpecificSelections(
          animalType,
          formData.groomingTolerance
        );

        if (ageSelections.length === 0) {
          newErrors[`age-${animalType}`] = true;
        }

        if (groomingSelections.length === 0) {
          newErrors[`groom-${animalType}`] = true;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goNext = () => {
    const valid = validateCurrentStep();

    if (!valid) {
      showPopup({
        type: "warning",
        title: "Required Fields",
        message: "Required fields must be completed."
      });
      return;
    }

    setErrors({});

    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setRequestSaved(false);
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  const valid = validateCurrentStep();

  if (!valid) {
    showPopup({
      type: "warning",
      title: "Required Fields",
      message: "Required fields must be completed."
    });
    return;
  }

  setErrors({});

  try {
    const user = getStoredUser();

    if (!user?.userId) {
      showPopup({
        type: "error",
        title: "User Error",
        message: "User information could not be found. Please log in again."
      });
      return;
    }

    const response = await fetch(`${getApiBaseUrl()}/api/adoption-requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...formData,
        userId: user?.userId
      })
    });

    if (!response.ok) {
      throw new Error("Adoption request could not be saved to database.");
    }

    const savedRequest = await response.json();
    console.log("Saved adoption request:", savedRequest);

    if (savedRequest?.id != null) {
      setLastSavedRequestId(Number(savedRequest.id));
    }

    const storedRequests = JSON.parse(localStorage.getItem("adoptionRequests")) || [];
    const editingId = localStorage.getItem("editingRequestId");

    let updatedRequests;

    if (editingId) {
      updatedRequests = storedRequests.map((item) =>
        String(item.id) === String(editingId)
          ? { ...formData, id: item.id, createdAt: item.createdAt }
          : item
      );
    } else {
      updatedRequests = [
        ...storedRequests,
        {
          ...formData,
          id: savedRequest.id || Date.now(),
          createdAt: savedRequest.createdAt || new Date().toISOString()
        }
      ];
    }

    localStorage.setItem("adoptionRequests", JSON.stringify(updatedRequests));
    localStorage.setItem("adoptionRequest", JSON.stringify(formData));
    localStorage.removeItem("editingRequestId");

    setRequestSaved(true);
    showPopup({
      type: "success",
      title: "Request Saved",
      message: "Adoption request saved successfully."
    });
  } catch (error) {
    console.error(error);
    showPopup({
      type: "critical",
      title: "Save Failed",
      message: "Backend connection failed. Request was not saved."
    });
  }
};

  const getStepClass = (stepNumber) => {
    if (stepNumber < step) {
      return "step-item step-completed";
    }

    if (stepNumber === step) {
      return "step-item step-current";
    }

    return "step-item step-upcoming";
  };

  const finalizeAndGoToMatches = async () => {
    try {
      const user = getStoredUser();
      let requestId = lastSavedRequestId;
      if (!requestId && user?.userId) {
        const listRes = await fetch(
          `${getApiBaseUrl()}/api/adoption-requests/user/${user.userId}`
        );
        if (listRes.ok) {
          const list = await listRes.json();
          const draft = [...(list || [])]
            .reverse()
            .find((r) => !r.requestPhase || r.requestPhase === "DRAFT");
          if (draft?.id != null) {
            requestId = Number(draft.id);
          }
        }
      }

      if (requestId && user?.userId) {
        const res = await fetch(
          `${getApiBaseUrl()}/api/adoption-requests/${requestId}/submit`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.userId })
          }
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          showPopup({
            type: "error",
            title: "Submit failed",
            message: err.error || "Could not finalize your adoption request."
          });
          return;
        }
        if (typeof window !== "undefined") {
          window.localStorage.setItem("adoptionRequestCompleted", "true");
        }
        navigate(`/compatible-animals?requestId=${encodeURIComponent(String(requestId))}`);
      } else {
        navigate("/compatible-animals");
      }
    } catch (err) {
      console.error(err);
      showPopup({
        type: "error",
        title: "Error",
        message: "Could not submit adoption request."
      });
    }
  };

  const CheckboxGroup = ({ options, fieldName }) => (
    <div className="checkbox-grid">
      {options.map((option) => {
        const isSelected = formData[fieldName].includes(option);

        return (
          <label
            key={option}
            className={`check-card ${isSelected ? "check-card-selected" : ""}`}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => handleCheckboxArrayChange(fieldName, option)}
            />
            <span>{option}</span>
          </label>
        );
      })}
    </div>
  );

  if (!bootstrapped) {
    return (
      <div className="adoption-request-page">
        <Navbar />
        <main className="adoption-request-main">
          <p className="adoption-request-subtitle" style={{ padding: "32px 24px" }}>
            Loading…
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="adoption-request-page">
      <Navbar />

      <main className="adoption-request-main">
        <section className="adoption-request-hero">
          <p className="adoption-request-tag">Adopter Step 1</p>
          <h1>Adoption Request Form</h1>
          <p>
            Complete this form step by step so the system can evaluate compatibility
            and only show animals that fit your lifestyle and home conditions.
          </p>
        </section>

        <section className="adoption-request-card">
          <div className="adoption-request-top">
            <div>
              <h2>Create Adoption Request</h2>
              <p className="adoption-request-subtitle">
                Step {step} of {totalSteps}
              </p>
            </div>

            <div className="adoption-request-progress-wrap">
              <div className="adoption-request-progress-bar">
                <div
                  className="adoption-request-progress-fill"
                  style={{ width: `${(step / totalSteps) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="adoption-step-row">
            <div className={getStepClass(1)}>
              <div className="step-circle">1</div>
              <span>Home</span>
            </div>

            <div className={getStepClass(2)}>
              <div className="step-circle">2</div>
              <span>Lifestyle</span>
            </div>

            <div className={getStepClass(3)}>
              <div className="step-circle">3</div>
              <span>Household</span>
            </div>

            <div className={getStepClass(4)}>
              <div className="step-circle">4</div>
              <span>Experience</span>
            </div>

            <div className={getStepClass(5)}>
              <div className="step-circle">5</div>
              <span>Preferences</span>
            </div>

            <div className={getStepClass(6)}>
              <div className="step-circle">6</div>
              <span>Review</span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="adoption-step-section">
                <h3>Home Information</h3>

                <div className="adoption-request-grid">
                  <div className="adoption-request-group">
                    <RequiredLabel>Indoor Space</RequiredLabel>
                    <select
                      name="indoorSpace"
                      value={formData.indoorSpace}
                      onChange={handleChange}
                      className={errors.indoorSpace ? "error-input" : ""}
                    >
                      <option value="">Select</option>
                      <option value="Small">Small (50-100 m²)</option>
                      <option value="Medium">Medium (120-180 m²)</option>
                      <option value="Large">Large (180+ m²)</option>
                    </select>
                  </div>

                  <div className="adoption-request-group">
                    <RequiredLabel>Living Space</RequiredLabel>
                    <select
                      name="livingSpace"
                      value={formData.livingSpace}
                      onChange={handleChange}
                      className={errors.livingSpace ? "error-input" : ""}
                    >
                      <option value="">Select</option>
                      <option value="House">House</option>
                      <option value="Villa">Villa</option>
                      <option value="Apartment">Apartment</option>
                      <option value="Studio">Studio</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {showLivingSpaceOther && (
                    <div className="adoption-request-group adoption-request-full">
                      <RequiredLabel>Please Specify Your Living Space</RequiredLabel>
                      <input
                        type="text"
                        name="livingSpaceOther"
                        value={formData.livingSpaceOther}
                        onChange={handleChange}
                        placeholder="Write your living space type"
                        className={`adoption-text-input ${errors.livingSpaceOther ? "error-input" : ""}`}
                      />
                    </div>
                  )}

                  <div className="adoption-request-group">
                    <label>Housing Status</label>
                    <select
                      name="housingStatus"
                      value={formData.housingStatus}
                      onChange={handleChange}
                    >
                      <option value="">Select</option>
                      <option value="Owner">Owner</option>
                      <option value="Renter">Renter</option>
                      <option value="Family Home">Family Home</option>
                    </select>
                  </div>

                  <div className="adoption-request-group">
                    <RequiredLabel>Do You Have a Garden?</RequiredLabel>
                    <select
                      name="hasGarden"
                      value={formData.hasGarden}
                      onChange={handleChange}
                      className={errors.hasGarden ? "error-input" : ""}
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>

                  <div className="adoption-request-group adoption-request-full">
                    <RequiredLabel>What kind of outdoor access do you have?</RequiredLabel>
                    <select
                      name="outdoorAccess"
                      value={formData.outdoorAccess}
                      onChange={handleChange}
                      className={errors.outdoorAccess ? "error-input" : ""}
                    >
                      <option value="">Select</option>
                      <option value="Private Yard">Private Yard</option>
                      <option value="Balcony">Balcony</option>
                      <option value="Terrace">Terrace</option>
                      <option value="Shared Outdoor Area">Shared Outdoor Area</option>
                      <option value="None">None</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="adoption-step-section">
                <h3>Lifestyle Information</h3>

                <div className="adoption-request-grid">
                  <div className="adoption-request-group">
                    <RequiredLabel>Activity Level</RequiredLabel>
                    <select
                      name="activityLevel"
                      value={formData.activityLevel}
                      onChange={handleChange}
                      className={errors.activityLevel ? "error-input" : ""}
                    >
                      <option value="">Select</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  <div className="adoption-request-group">
                    <RequiredLabel>Work / School Schedule</RequiredLabel>
                    <select
                      name="workSchedule"
                      value={formData.workSchedule}
                      onChange={handleChange}
                      className={errors.workSchedule ? "error-input" : ""}
                    >
                      <option value="">Select</option>
                      <option value="Mostly Remote">Mostly Remote</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="Mostly Outside">Mostly Outside</option>
                      <option value="Flexible">Flexible</option>
                    </select>
                  </div>

                  <div className="adoption-request-group adoption-request-full">
                    <RequiredLabel>Average Time Spent at Home</RequiredLabel>
                    <select
                      name="timeAtHome"
                      value={formData.timeAtHome}
                      onChange={handleChange}
                      className={errors.timeAtHome ? "error-input" : ""}
                    >
                      <option value="">Select</option>
                      <option value="Most of the day">Most of the day</option>
                      <option value="About half the day">About half the day</option>
                      <option value="Mostly evenings">Mostly evenings</option>
                      <option value="Mostly weekends">Mostly weekends</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="adoption-step-section">
                <h3>Household Information</h3>

                <div className="adoption-request-grid">
                  <div className="adoption-request-group">
                    <RequiredLabel>Household Type</RequiredLabel>
                    <select
                      name="householdType"
                      value={formData.householdType}
                      onChange={handleChange}
                      className={errors.householdType ? "error-input" : ""}
                    >
                      <option value="">Select</option>
                      <option value="Single Person">Single Person</option>
                      <option value="Couple">Couple</option>
                      <option value="Family">Family</option>
                      <option value="Shared Household">Shared Household</option>
                    </select>
                  </div>

                  <div className="adoption-request-group">
                    <RequiredLabel>Children in Home</RequiredLabel>
                    <select
                      name="hasChildren"
                      value={formData.hasChildren}
                      onChange={handleChange}
                      className={errors.hasChildren ? "error-input" : ""}
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>

                  {showChildrenAge && (
                    <div className="adoption-request-group adoption-request-full">
                      <label>Children Age Group</label>
                      <CheckboxGroup
                        fieldName="childrenAgeGroup"
                        options={["0-5", "6-12", "13+"]}
                      />
                    </div>
                  )}

                  <div className="adoption-request-group">
                    <RequiredLabel>Other Pets in Home</RequiredLabel>
                    <select
                      name="hasOtherPets"
                      value={formData.hasOtherPets}
                      onChange={handleChange}
                      className={errors.hasOtherPets ? "error-input" : ""}
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>

                  {showOtherPetsType && (
                    <div className="adoption-request-group adoption-request-full">
                      <label>Other Pets Type</label>
                      <CheckboxGroup
                        fieldName="otherPetsType"
                        options={["Dog", "Cat", "Other"]}
                      />
                    </div>
                  )}

                  {showOtherPetsOther && (
                    <div className="adoption-request-group adoption-request-full">
                      <label>Please Specify Other Pet Type</label>
                      <input
                        type="text"
                        name="otherPetsTypeOther"
                        value={formData.otherPetsTypeOther}
                        onChange={handleChange}
                        placeholder="Write the other pet type"
                        className="adoption-text-input"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="adoption-step-section">
                <h3>Experience Information</h3>

                <div className="adoption-request-grid">
                  <div className="adoption-request-group">
                    <label>Who Will Be the Primary Caretaker of the Animal?</label>
                    <select
                      name="primaryCaretaker"
                      value={formData.primaryCaretaker}
                      onChange={handleChange}
                    >
                      <option value="">Select</option>
                      <option value="Me">Me</option>
                      <option value="My Spouse">My Spouse</option>
                      <option value="Shared Responsibility">Shared Responsibility</option>
                      <option value="Another Family Member">Another Family Member</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {showPrimaryCaretakerOther && (
                    <div className="adoption-request-group">
                      <label>Please Specify the Primary Caretaker</label>
                      <input
                        type="text"
                        name="primaryCaretakerOther"
                        value={formData.primaryCaretakerOther}
                        onChange={handleChange}
                        placeholder="Write who will be the caretaker"
                        className="adoption-text-input"
                      />
                    </div>
                  )}

                  <div className="adoption-request-group adoption-request-full">
                    <RequiredLabel>Do You Have Previous Experience Caring for a Pet?</RequiredLabel>
                    <select
                      name="hasPreviousExperience"
                      value={formData.hasPreviousExperience}
                      onChange={handleChange}
                      className={errors.hasPreviousExperience ? "error-input" : ""}
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>

                  {showPreviousPetTypes && (
                    <div className="adoption-request-group adoption-request-full">
                      <label>What Type of Pet Did You Have Before?</label>
                      <CheckboxGroup
                        fieldName="previousPetTypes"
                        options={["Dog", "Cat", "Other"]}
                      />
                    </div>
                  )}

                  {showPreviousPetTypesOther && (
                    <div className="adoption-request-group adoption-request-full">
                      <label>Please Specify the Other Pet Type</label>
                      <input
                        type="text"
                        name="previousPetTypesOther"
                        value={formData.previousPetTypesOther}
                        onChange={handleChange}
                        placeholder="Write the other pet type"
                        className="adoption-text-input"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="adoption-step-section">
                <h3>Animal Preferences</h3>

                <div className={`adoption-request-group adoption-request-full ${errors.preferredAnimalTypes ? "error-group" : ""}`}>
                  <RequiredLabel>Preferred Animal Type</RequiredLabel>
                  <div className="animal-choice-grid">
                    {["Dog", "Cat"].map((animal) => {
                      const isSelected = formData.preferredAnimalTypes.includes(animal);

                      return (
                        <label
                          key={animal}
                          className={`animal-card ${isSelected ? "animal-card-selected" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() =>
                              handleCheckboxArrayChange("preferredAnimalTypes", animal)
                            }
                          />
                          <div className="animal-card-icon">
                            <span className="animal-card-dot"></span>
                          </div>
                          <span>{animal}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className={`adoption-request-group adoption-request-full ${errors.preferredEnergyLevels ? "error-group" : ""}`}>
                  <RequiredLabel>Preferred Energy Level</RequiredLabel>
                  <CheckboxGroup
                    fieldName="preferredEnergyLevels"
                    options={["Calm", "Balanced", "Active"]}
                  />
                </div>

                {selectedAnimalTypes.length > 0 && (
                  <div className={`adoption-request-group adoption-request-full ${errors.preferredAgeRanges ? "error-group" : ""}`}>
                    <RequiredLabel>Preferred Age Range</RequiredLabel>
                    <CheckboxGroup
                      fieldName="preferredAgeRanges"
                      options={ageOptions}
                    />
                  </div>
                )}

                {sizeOptions.length > 0 && (
                  <div className={`adoption-request-group adoption-request-full ${errors.preferredSizes ? "error-group" : ""}`}>
                    <RequiredLabel>Preferred Size</RequiredLabel>
                    <CheckboxGroup
                      fieldName="preferredSizes"
                      options={sizeOptions}
                    />
                  </div>
                )}

                {selectedAnimalTypes.length > 0 && (
                  <div className={`adoption-request-group adoption-request-full ${errors.groomingTolerance ? "error-group" : ""}`}>
                    <RequiredLabel>Grooming Tolerance</RequiredLabel>
                    <CheckboxGroup
                      fieldName="groomingTolerance"
                      options={groomingOptions}
                    />
                  </div>
                )}

                <div className="adoption-request-group adoption-request-full">
                  <RequiredLabel>Special Needs Acceptance</RequiredLabel>
                  <select
                    name="specialNeedsAcceptance"
                    value={formData.specialNeedsAcceptance}
                    onChange={handleChange}
                    className={errors.specialNeedsAcceptance ? "error-input" : ""}
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Depends on the case">Depends on the case</option>
                  </select>
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="adoption-step-section">
                <div className="review-head">
                  <div className="review-title-wrap">
                    <div className="review-icon">▣</div>
                    <div>
                      <h3>Review Your Request</h3>
                      <p className="review-subtitle">
                        Check your details before saving the adoption request.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="review-grid">
                  <div className="review-box">
                    <h4>Home</h4>
                    <p><strong>Indoor Space:</strong> {formData.indoorSpace || "-"}</p>
                    <p><strong>Living Space:</strong> {formData.livingSpace === "Other" ? formData.livingSpaceOther || "Other" : formData.livingSpace || "-"}</p>
                    <p><strong>Housing Status:</strong> {formData.housingStatus || "Not Specified"}</p>
                    <p><strong>Garden:</strong> {formData.hasGarden || "-"}</p>
                    <p><strong>Outdoor Access:</strong> {formData.outdoorAccess || "-"}</p>
                  </div>

                  <div className="review-box">
                    <h4>Lifestyle</h4>
                    <p><strong>Activity Level:</strong> {formData.activityLevel || "-"}</p>
                    <p><strong>Work Schedule:</strong> {formData.workSchedule || "-"}</p>
                    <p><strong>Time at Home:</strong> {formData.timeAtHome || "-"}</p>
                  </div>

                  <div className="review-box">
                    <h4>Household</h4>
                    <p><strong>Household Type:</strong> {formData.householdType || "-"}</p>
                    <p><strong>Children:</strong> {formData.hasChildren || "-"}</p>
                    <p><strong>Children Age Group:</strong> {formData.childrenAgeGroup.join(", ") || "Not Specified"}</p>
                    <p><strong>Other Pets:</strong> {formData.hasOtherPets || "-"}</p>
                    <p><strong>Other Pets Type:</strong> {formData.otherPetsType.join(", ") || "Not Specified"}</p>
                    {formData.otherPetsType.includes("Other") && (
                      <p><strong>Other Pet Description:</strong> {formData.otherPetsTypeOther || "Not Specified"}</p>
                    )}
                  </div>

                  <div className="review-box">
                    <h4>Experience</h4>
                    <p><strong>Primary Caretaker:</strong> {formData.primaryCaretaker || "Me"}</p>
                    <p><strong>Previous Experience:</strong> {formData.hasPreviousExperience || "-"}</p>
                    <p><strong>Previous Pet Types:</strong> {formData.previousPetTypes.join(", ") || "Not Specified"}</p>
                    {formData.previousPetTypes.includes("Other") && (
                      <p><strong>Other Previous Pet:</strong> {formData.previousPetTypesOther || "Not Specified"}</p>
                    )}
                  </div>

                  <div className="review-box review-box-full">
                    <h4>Preferences</h4>
                    <p><strong>Animal Types:</strong> {formData.preferredAnimalTypes.join(", ") || "-"}</p>
                    <p><strong>Energy Levels:</strong> {formData.preferredEnergyLevels.join(", ") || "-"}</p>
                    <p><strong>Age Ranges:</strong> {formData.preferredAgeRanges.join(", ") || "-"}</p>
                    <p><strong>Sizes:</strong> {formData.preferredSizes.join(", ") || "-"}</p>
                    <p><strong>Grooming:</strong> {formData.groomingTolerance.join(", ") || "-"}</p>
                    <p><strong>Special Needs Acceptance:</strong> {formData.specialNeedsAcceptance || "-"}</p>
                  </div>
                </div>

                <div className="adoption-request-group adoption-request-full">
                  <label>Additional Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Write any extra details, expectations, or important notes here..."
                  />
                </div>
              </div>
            )}

            <div className="adoption-request-actions">
              {step < totalSteps ? (
                <>
                  <button
                    type="button"
                    className="adoption-back-btn"
                    onClick={goBack}
                    disabled={step === 1}
                  >
                    Back
                  </button>

                  <button
                    type="button"
                    className="adoption-next-btn"
                    onClick={goNext}
                  >
                    Next
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="adoption-back-btn"
                    onClick={goBack}
                  >
                    Go Back to Edit
                  </button>

                  {!requestSaved ? (
                    <button type="submit" className="adoption-submit-btn">
                      Save Adoption Request
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="adoption-submit-btn"
                      onClick={finalizeAndGoToMatches}
                    >
                      Submit and Go to Matches
                    </button>
                  )}
                </>
              )}
            </div>
          </form>
        </section>
      </main>

      <div className="required-field-note">
        <span className="required-star">*</span> indicates required fields
      </div>

      <Footer />

    </div>
  );
}

export default AdoptionRequestPage;