import React, { useMemo, useState } from "react";
import "./AdoptionRequestPage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function AdoptionRequestPage() {
  const [step, setStep] = useState(1);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [errors, setErrors] = useState({});

  const totalSteps = 6;

  const [formData, setFormData] = useState({
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
  });

  const triggerToast = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);

    setTimeout(() => {
      setShowToast(false);
    }, 2600);
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
  };

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
      options.push(
        "Dog - Puppy / Young",
        "Dog - Adult",
        "Dog - Senior (Small dogs often 10-12+, larger dogs often 8+)"
      );
    }

    if (selectedAnimalTypes.includes("Cat")) {
      options.push(
        "Cat - Kitten / Young",
        "Cat - Adult",
        "Cat - Senior (10+)"
      );
    }

    if (selectedAnimalTypes.includes("Rabbit")) {
      options.push(
        "Rabbit - Young",
        "Rabbit - Adult",
        "Rabbit - Senior (Around 5-8+)"
      );
    }

    if (selectedAnimalTypes.includes("Hamster")) {
      options.push(
        "Hamster - Young",
        "Hamster - Adult",
        "Hamster - Senior (Around 1.5+)"
      );
    }

    if (selectedAnimalTypes.includes("Bird")) {
      options.push(
        "Bird - Young",
        "Bird - Adult",
        "Bird - Senior (Depends on bird species)"
      );
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
        "Cat - Short Coat / Lower Grooming",
        "Cat - Medium Grooming",
        "Cat - Long Coat / Higher Grooming"
      );
    }

    if (selectedAnimalTypes.includes("Rabbit")) {
      options.push(
        "Rabbit - Lower Grooming",
        "Rabbit - Medium Grooming",
        "Rabbit - Long-Haired / Higher Grooming"
      );
    }

    if (selectedAnimalTypes.includes("Hamster")) {
      options.push("Hamster - Minimal Grooming");
    }

    if (selectedAnimalTypes.includes("Bird")) {
      options.push("Bird - Regular Habitat Cleaning And Feather Care");
    }

    return options;
  }, [selectedAnimalTypes]);

  const sizeOptions = useMemo(() => {
    const options = [];

    if (selectedAnimalTypes.includes("Dog")) {
      options.push(
        "Dog - Small",
        "Dog - Medium",
        "Dog - Large"
      );
    }

    if (selectedAnimalTypes.includes("Bird")) {
      options.push(
        "Bird - Small",
        "Bird - Medium",
        "Bird - Large"
      );
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
      if (formData.housingStatus === "") newErrors.housingStatus = true;
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

      if (showChildrenAge && formData.childrenAgeGroup.length === 0) {
        newErrors.childrenAgeGroup = true;
      }

      if (showOtherPetsType && formData.otherPetsType.length === 0) {
        newErrors.otherPetsType = true;
      }

      if (showOtherPetsOther && formData.otherPetsTypeOther.trim() === "") {
        newErrors.otherPetsTypeOther = true;
      }
    }

    if (step === 4) {
      if (formData.primaryCaretaker === "") newErrors.primaryCaretaker = true;
      if (formData.hasPreviousExperience === "") newErrors.hasPreviousExperience = true;

      if (showPrimaryCaretakerOther && formData.primaryCaretakerOther.trim() === "") {
        newErrors.primaryCaretakerOther = true;
      }

      if (showPreviousPetTypes && formData.previousPetTypes.length === 0) {
        newErrors.previousPetTypes = true;
      }

      if (showPreviousPetTypesOther && formData.previousPetTypesOther.trim() === "") {
        newErrors.previousPetTypesOther = true;
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

      if (ageOptions.length > 0 && formData.preferredAgeRanges.length === 0) {
        newErrors.preferredAgeRanges = true;
      }

      if (groomingOptions.length > 0 && formData.groomingTolerance.length === 0) {
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
      triggerToast("Required fields must be completed.", "error");
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
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const valid = validateCurrentStep();

    if (!valid) {
      triggerToast("Required fields must be completed.", "error");
      return;
    }

    setErrors({});
    triggerToast("Adoption request saved successfully.", "success");
    console.log("Adoption request data:", formData);
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
                    <label>Indoor Space</label>
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
                    <label>Living Space</label>
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
                      <label>Please Specify Your Living Space</label>
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
                      className={errors.housingStatus ? "error-input" : ""}
                    >
                      <option value="">Select</option>
                      <option value="Owner">Owner</option>
                      <option value="Renter">Renter</option>
                      <option value="Family Home">Family Home</option>
                    </select>
                  </div>

                  <div className="adoption-request-group">
                    <label>Do You Have a Garden?</label>
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
                    <label>Outdoor Access</label>
                    <select
                      name="outdoorAccess"
                      value={formData.outdoorAccess}
                      onChange={handleChange}
                      className={errors.outdoorAccess ? "error-input" : ""}
                    >
                      <option value="">Select</option>
                      <option value="Yard">Yard</option>
                      <option value="Balcony">Balcony</option>
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
                    <label>Activity Level</label>
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
                    <label>Work / School Schedule</label>
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
                    <label>Average Time Spent at Home</label>
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
                    <label>Household Type</label>
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
                    <label>Children in Home</label>
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

                  {showChildrenAge&& (
                    <div className={`adoption-request-group adoption-request-full ${errors.childrenAgeGroup ? "error-group" : ""}`}>
                      <label>Children Age Group</label>
                      <CheckboxGroup
                        fieldName="childrenAgeGroup"
                        options={["0-5", "6-12", "13+"]}
                      />
                    </div>
                  )}

                  <div className="adoption-request-group">
                    <label>Other Pets in Home</label>
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
                    <div className={`adoption-request-group adoption-request-full ${errors.otherPetsType ? "error-group" : ""}`}>
                      <label>Other Pets Type</label>
                      <CheckboxGroup
                        fieldName="otherPetsType"
                        options={["Dog", "Cat", "Bird", "Rabbit", "Hamster", "Other"]}
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
                        className={`adoption-text-input ${errors.otherPetsTypeOther ? "error-input" : ""}`}
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
                      className={errors.primaryCaretaker ? "error-input" : ""}
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
                        className={`adoption-text-input ${errors.primaryCaretakerOther ? "error-input" : ""}`}
                      />
                    </div>
                  )}

                  <div className="adoption-request-group adoption-request-full">
                    <label>Do You Have Previous Experience Caring for a Pet?</label>
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
                    <div className={`adoption-request-group adoption-request-full ${errors.previousPetTypes ? "error-group" : ""}`}>
                      <label>What Type of Pet Did You Have Before?</label>
                      <CheckboxGroup
                        fieldName="previousPetTypes"
                        options={["Dog", "Cat", "Bird", "Rabbit", "Hamster", "Other"]}
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
                        className={`adoption-text-input ${errors.previousPetTypesOther ? "error-input" : ""}`}
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
                  <label>Preferred Animal Type</label>
                  <div className="animal-choice-grid">
                    {["Dog", "Cat", "Bird", "Hamster", "Rabbit"].map((animal)=> {
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
                  <label>Preferred Energy Level</label>
                  <CheckboxGroup
                    fieldName="preferredEnergyLevels"
                    options={["Calm", "Balanced", "Active"]}
                  />
                </div>

                {selectedAnimalTypes.length > 0 && (
                  <div
                    className={`adoption-request-group adoption-request-full ${
                      errors.preferredAgeRanges ||
                      selectedAnimalTypes.some((animal) => errors[`age-${animal}`])
                        ? "error-group"
                        : ""
                    }`}
                  >
                    <label>Preferred Age Range</label>
                    <CheckboxGroup
                      fieldName="preferredAgeRanges"
                      options={ageOptions}
                    />
                  </div>
                )}

                {sizeOptions.length > 0 && (
                  <div className={`adoption-request-group adoption-request-full ${errors.preferredSizes ? "error-group" : ""}`}>
                    <label>Preferred Size</label>
                    <CheckboxGroup
                      fieldName="preferredSizes"
                      options={sizeOptions}
                    />
                  </div>
                )}

                {selectedAnimalTypes.length>0 && (
                  <div
                    className={`adoption-request-group adoption-request-full ${
                      errors.groomingTolerance ||
                      selectedAnimalTypes.some((animal) => errors[`groom-${animal}`])
                        ? "error-group"
                        : ""
                    }`}
                  >
                    <label>Grooming Tolerance</label>
                    <CheckboxGroup
                      fieldName="groomingTolerance"
                      options={groomingOptions}
                    />
                  </div>
                )}

                <div className="adoption-request-group adoption-request-full">
                  <label>Special Needs Acceptance</label>
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
                    <p><strong>Housing Status:</strong> {formData.housingStatus || "-"}</p>
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
                    <p><strong>Children Age Group:</strong> {formData.childrenAgeGroup.join(", ") || "-"}</p>
                    <p><strong>Other Pets:</strong> {formData.hasOtherPets || "-"}</p>
                    <p><strong>Other Pets Type:</strong> {formData.otherPetsType.join(", ") || "-"}</p>
                    {formData.otherPetsType.includes("Other") && (
                      <p><strong>Other Pet Description:</strong> {formData.otherPetsTypeOther || "-"}</p>
                    )}
                  </div>

                  <div className="review-box">
                    <h4>Experience</h4>
                    <p><strong>Primary Caretaker:</strong> {formData.primaryCaretaker === "Other" ? formData.primaryCaretakerOther || "Other" : formData.primaryCaretaker || "-"}</p>
                    <p><strong>Previous Experience:</strong> {formData.hasPreviousExperience || "-"}</p>
                    <p><strong>Previous Pet Types:</strong> {formData.previousPetTypes.join(", ") || "-"}</p>
                    {formData.previousPetTypes.includes("Other") && (
                      <p><strong>Other Previous Pet:</strong> {formData.previousPetTypesOther || "-"}</p>
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
              <button
                type="button"
                className="adoption-back-btn"
                onClick={goBack}
                disabled={step === 1}
              >
                Back
              </button>

              {step < totalSteps ? (
                <button
                  type="button"
                  className="adoption-next-btn"
                  onClick={goNext}
                >
                  Next
                </button>
              ) : (
                <button type="submit" className="adoption-submit-btn">
                  Save Adoption Request
                </button>
              )}
            </div>
          </form>
        </section>
      </main>
      <Footer />

      {showToast && (
        <div className={`toast ${toastType}`}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default AdoptionRequestPage;