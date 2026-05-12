import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./AdoptionRequestPage.css";
import "./RegisterAnimalPage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { usePopup } from "../components/PopupProvider";
import { getApiBaseUrl, getStoredUser, getResolvedUserId, normalizeRole } from "../utils/auth";
import { resolveMediaUrl } from "../utils/adopterJourney";
import { normalizeAnimalFromApi, ownerListingImageUrls } from "../utils/ownerJourney";

const TOTAL_STEPS = 3;

function ageLabelToGroup(label) {
  if (!label) return "";
  if (/Senior/i.test(label)) return "SENIOR";
  if (/Adult/i.test(label)) return "ADULT";
  return "YOUNG";
}

function groomingLabelToNeed(label) {
  if (!label) return "";
  if (/High/i.test(label)) return "HIGH";
  if (/Medium/i.test(label)) return "MEDIUM";
  return "LOW";
}

function sizeLabelToCode(label) {
  if (!label) return "";
  if (/Large/i.test(label)) return "LARGE";
  if (/Medium/i.test(label)) return "MEDIUM";
  return "SMALL";
}

function energyLabelToApi(label) {
  if (!label) return "";
  const map = { Calm: "CALM", Balanced: "BALANCED", Active: "ACTIVE" };
  return map[label] || String(label).toUpperCase();
}

function energyApiToLabel(api) {
  const u = String(api || "").toUpperCase();
  if (u === "ACTIVE" || u === "HIGH") return "Active";
  if (u === "CALM" || u === "LOW") return "Calm";
  return "Balanced";
}

function mapApiAnimalToForm(animal) {
  const typeRaw = (animal.animalType || "").toUpperCase();
  const animalType = typeRaw === "CAT" ? "Cat" : "Dog";
  const ageGroup = String(animal.ageGroup || "").toUpperCase();
  let ageRange = "";
  if (animalType === "Dog") {
    if (ageGroup === "SENIOR") ageRange = "Dog - Senior";
    else if (ageGroup === "ADULT") ageRange = "Dog - Adult";
    else ageRange = "Dog - Puppy / Young";
  } else {
    if (ageGroup === "SENIOR") ageRange = "Cat - Senior";
    else if (ageGroup === "ADULT") ageRange = "Cat - Adult";
    else ageRange = "Cat - Kitten / Young";
  }
  const groomU = String(animal.groomingNeed || "").toUpperCase();
  const groomLevel =
    groomU === "HIGH" ? "High" : groomU === "MEDIUM" ? "Medium" : "Low";
  const grooming =
    animalType === "Dog"
      ? `Dog - ${groomLevel} Grooming`
      : `Cat - ${groomLevel} Grooming`;
  const sizeU = String(animal.size || "").toUpperCase();
  let size = "Dog - Medium";
  if (sizeU === "SMALL") size = "Dog - Small";
  else if (sizeU === "LARGE") size = "Dog - Large";
  else if (sizeU === "MEDIUM") size = "Dog - Medium";
  const yn = (v) => {
    const u = String(v || "").toUpperCase();
    if (u === "YES" || u === "Y") return "Yes";
    if (u === "NO" || u === "N") return "No";
    return v ? String(v) : "";
  };
  const housingRaw = String(animal.housingLocation || "").trim();
  const housingLocation =
    housingRaw.toLowerCase().includes("shelter") || housingRaw === "Shelter"
      ? "Shelter"
      : "Home";
  return {
    name: animal.name || "",
    breed: animal.breed || "",
    description: animal.description || "",
    animalType,
    energyLevel: energyApiToLabel(animal.energyLevel),
    ageRange,
    size: animalType === "Dog" ? size : "",
    grooming,
    specialNeeds: yn(animal.specialNeeds),
    goodWithChildren: yn(animal.goodWithChildren),
    goodWithPets: yn(animal.goodWithPets),
    housingLocation
  };
}

/** Only .jpg / .jpeg (or image/jpeg MIME) — matches backend rules. */
function isJpegFile(file) {
  if (!file || !file.name) return false;
  const n = file.name.trim().toLowerCase();
  const extOk = n.endsWith(".jpg") || n.endsWith(".jpeg") || n.endsWith(".jpe");
  const t = (file.type || "").toLowerCase();
  const mimeOk = t === "image/jpeg" || t === "image/jpg";
  return extOk || mimeOk;
}

function RegisterAnimalPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editParam = searchParams.get("edit");
  const editAnimalId =
    editParam != null && editParam !== "" ? Number(editParam) : null;
  const isEditMode = Number.isFinite(editAnimalId) && editAnimalId > 0;

  const { showPopup } = usePopup();
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loadedAnimal, setLoadedAnimal] = useState(null);
  const [existingImageUrls, setExistingImageUrls] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [archiveBusy, setArchiveBusy] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    breed: "",
    description: "",
    animalType: "",
    energyLevel: "",
    ageRange: "",
    size: "",
    grooming: "",
    specialNeeds: "",
    goodWithChildren: "",
    goodWithPets: "",
    housingLocation: ""
  });

  const selectedAnimalType = formData.animalType;

  const ageOptions = useMemo(() => {
    const options = [];
    if (selectedAnimalType === "Dog") {
      options.push("Dog - Puppy / Young", "Dog - Adult", "Dog - Senior");
    }
    if (selectedAnimalType === "Cat") {
      options.push("Cat - Kitten / Young", "Cat - Adult", "Cat - Senior");
    }
    return options;
  }, [selectedAnimalType]);

  const groomingOptions = useMemo(() => {
    const options = [];
    if (selectedAnimalType === "Dog") {
      options.push("Dog - Low Grooming", "Dog - Medium Grooming", "Dog - High Grooming");
    }
    if (selectedAnimalType === "Cat") {
      options.push("Cat - Low Grooming", "Cat - Medium Grooming", "Cat - High Grooming");
    }
    return options;
  }, [selectedAnimalType]);

  const sizeOptions = useMemo(() => {
    if (selectedAnimalType !== "Dog") return [];
    return ["Dog - Small", "Dog - Medium", "Dog - Large"];
  }, [selectedAnimalType]);

  useEffect(() => {
    const stored = getStoredUser();
    const uid = getResolvedUserId(stored);
    if (!uid || normalizeRole(stored?.role) !== "OWNER") {
      return;
    }
    const apiBaseUrl = getApiBaseUrl();
    fetch(`${apiBaseUrl}/api/auth/profile/${uid}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((profile) => {
        if (profile && profile.ownerProfileCompleted === false) {
          navigate("/complete-owner-profile", { replace: true });
        }
      })
      .catch(() => {});
  }, [navigate]);

  useEffect(() => {
    if (!isEditMode || !editAnimalId) {
      setLoadedAnimal(null);
      setExistingImageUrls([]);
      return undefined;
    }
    const user = getStoredUser();
    const uid = getResolvedUserId(user);
    if (!uid || normalizeRole(user?.role) !== "OWNER") {
      return undefined;
    }
    let cancelled = false;
    const api = getApiBaseUrl();
    (async () => {
      try {
        const res = await fetch(`${api}/api/animals/${editAnimalId}`);
        if (!res.ok) {
          showPopup({
            type: "error",
            title: "Not found",
            message: "This listing could not be loaded."
          });
          navigate("/owner-listings", { replace: true });
          return;
        }
        const data = normalizeAnimalFromApi(await res.json());
        if (cancelled) {
          return;
        }
        if (Number(data.ownerId) !== Number(uid)) {
          showPopup({
            type: "error",
            title: "Access denied",
            message: "You can only edit your own listings."
          });
          navigate("/owner-listings", { replace: true });
          return;
        }
        setLoadedAnimal(data);
        setFormData(mapApiAnimalToForm(data));
        setExistingImageUrls(ownerListingImageUrls(data));
        setImages([]);
        setImagePreviews([]);
        setStep(1);
        setErrors({});
      } catch {
        if (!cancelled) {
          showPopup({
            type: "error",
            title: "Error",
            message: "Could not load listing."
          });
          navigate("/owner-listings", { replace: true });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEditMode, editAnimalId, navigate, showPopup]);

  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: false }));
  };

  const setField = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: false }));
  };

  const handleImageUpload = (e) => {
    const picked = Array.from(e.target.files || []);
    const allowed = [];
    const rejected = [];
    picked.forEach((f) => {
      if (isJpegFile(f)) {
        allowed.push(f);
      } else {
        rejected.push(f.name || "(unnamed)");
      }
    });
    if (rejected.length > 0) {
      showPopup({
        type: "warning",
        title: "JPEG only",
        message: `Only .jpg or .jpeg files are accepted. Skipped: ${rejected.join(", ")}`
      });
    }
    const merged = [...images, ...allowed].slice(0, 5);
    setImages(merged);
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setImagePreviews(merged.map((file) => URL.createObjectURL(file)));
    e.target.value = "";
  };

  const removeExistingImageAt = (index) => {
    setExistingImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const removeImageAt = (index) => {
    const next = images.filter((_, i) => i !== index);
    setImages(next);
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setImagePreviews(next.map((file) => URL.createObjectURL(file)));
  };

  const RequiredLabel = ({ children }) => (
    <label>
      {children}
      <span className="required-star">*</span>
    </label>
  );

  const validateStep = (s) => {
    const e = {};
    if (s === 1) {
      if (!formData.name.trim()) e.name = true;
      if (!formData.breed.trim()) e.breed = true;
      if (!formData.description.trim() || formData.description.trim().length < 20) {
        e.description = true;
      }
    }
    if (s === 2) {
      if (!formData.animalType) e.animalType = true;
      if (!formData.energyLevel) e.energyLevel = true;
      if (!formData.ageRange) e.ageRange = true;
      if (selectedAnimalType === "Dog" && !formData.size) e.size = true;
      if (!formData.grooming) e.grooming = true;
      if (!formData.specialNeeds) e.specialNeeds = true;
      if (!formData.goodWithChildren) e.goodWithChildren = true;
      if (!formData.goodWithPets) e.goodWithPets = true;
      if (!formData.housingLocation) e.housingLocation = true;
    }
    if (s === 3) {
      if (isEditMode) {
        if (existingImageUrls.length + images.length < 3) {
          e.images = true;
        } else if (images.some((f) => !isJpegFile(f))) {
          e.images = true;
        }
      } else if (images.length < 3) {
        e.images = true;
      } else if (images.some((f) => !isJpegFile(f))) {
        e.images = true;
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) {
      showPopup({
        type: "warning",
        title: "Required fields",
        message:
          step === 1
            ? "Please enter name, breed, and a short description (at least 20 characters)."
            : step === 2
              ? "Please complete all compatibility fields so adopters can be matched fairly."
              : isEditMode
                ? "Keep at least 3 photos in total (existing + new JPEG uploads)."
                : "Please add at least 3 JPEG photos (.jpg or .jpeg) of the animal."
      });
      return;
    }
    setErrors({});
    if (step < TOTAL_STEPS) setStep(step + 1);
  };

  const goBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleAnimalTypeSelect = (type) => {
    setFormData((prev) => ({
      ...prev,
      animalType: type,
      ageRange: "",
      grooming: "",
      size: ""
    }));
    setErrors((prev) => ({ ...prev, animalType: false, ageRange: false, grooming: false, size: false }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(3)) {
      showPopup({
        type: "warning",
        title: "Photos required",
        message: isEditMode
          ? "Keep at least 3 JPEG photos total (existing gallery + new uploads)."
          : "Please upload at least 3 JPEG images (.jpg or .jpeg) before publishing."
      });
      return;
    }

    const user = getStoredUser();
    const ownerId = getResolvedUserId(user);
    if (!ownerId || normalizeRole(user.role) !== "OWNER") {
      showPopup({
        type: "warning",
        title: "Owner account required",
        message: "Please log in as an owner to register an animal."
      });
      return;
    }

    const ageGroup = ageLabelToGroup(formData.ageRange);
    const groomingNeed = groomingLabelToNeed(formData.grooming);
    const size =
      selectedAnimalType === "Dog" ? sizeLabelToCode(formData.size) : "MEDIUM";
    const apiBaseUrl = getApiBaseUrl();

    try {
      if (isEditMode && !loadedAnimal) {
        showPopup({
          type: "warning",
          title: "Please wait",
          message: "Listing is still loading."
        });
        return;
      }

      if (isEditMode && loadedAnimal) {
        let mergedUrls = [...existingImageUrls];
        if (images.length > 0) {
          const formPayloadUp = new FormData();
          images.forEach((image) => formPayloadUp.append("images", image));
          const upRes = await fetch(
            `${apiBaseUrl}/api/animals/owner-upload-images?viewerId=${encodeURIComponent(ownerId)}`,
            { method: "POST", body: formPayloadUp }
          );
          const upJson = await upRes.json().catch(() => ({}));
          if (!upRes.ok) {
            showPopup({
              type: "error",
              title: "Upload failed",
              message: upJson.error || "Could not upload new photos."
            });
            return;
          }
          const extra = Array.isArray(upJson.urls) ? upJson.urls : [];
          mergedUrls = [...mergedUrls, ...extra];
        }

        const putBody = {
          name: formData.name.trim(),
          animalType: formData.animalType.toUpperCase(),
          breed: formData.breed.trim(),
          ageGroup,
          size,
          energyLevel: energyLabelToApi(formData.energyLevel),
          groomingNeed,
          specialNeeds: formData.specialNeeds.toUpperCase(),
          goodWithChildren: formData.goodWithChildren.toUpperCase(),
          goodWithPets: formData.goodWithPets.toUpperCase(),
          description: formData.description.trim(),
          housingLocation: formData.housingLocation === "Shelter" ? "Shelter" : "Home",
          listingStatus: loadedAnimal.listingStatus || "Active",
          compatibilityScore: loadedAnimal.compatibilityScore ?? null,
          images: mergedUrls
        };

        const putRes = await fetch(
          `${apiBaseUrl}/api/animals/${editAnimalId}?viewerId=${encodeURIComponent(ownerId)}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(putBody)
          }
        );
        const putJson = await putRes.json().catch(() => ({}));
        if (!putRes.ok) {
          showPopup({
            type: "error",
            title: "Could not save",
            message: putJson.error || "The listing was not updated."
          });
          return;
        }

        showPopup({
          type: "success",
          title: "Listing updated",
          message: "Changes were saved."
        });
        const updated = normalizeAnimalFromApi(putJson);
        setLoadedAnimal(updated);
        setExistingImageUrls(ownerListingImageUrls(updated));
        setImages([]);
        imagePreviews.forEach((url) => URL.revokeObjectURL(url));
        setImagePreviews([]);
        navigate(`/animal/${editAnimalId}`);
        return;
      }

      const payload = {
        name: formData.name.trim(),
        animalType: formData.animalType.toUpperCase(),
        breed: formData.breed.trim(),
        ageGroup,
        size,
        energyLevel: energyLabelToApi(formData.energyLevel),
        groomingNeed,
        specialNeeds: formData.specialNeeds.toUpperCase(),
        goodWithChildren: formData.goodWithChildren.toUpperCase(),
        goodWithPets: formData.goodWithPets.toUpperCase(),
        description: formData.description.trim(),
        housingLocation: formData.housingLocation,
        ownerId
      };

      const formPayload = new FormData();
      formPayload.append(
        "animal",
        new Blob([JSON.stringify(payload)], { type: "application/json" })
      );
      images.forEach((image) => {
        formPayload.append("images", image);
      });

      const response = await fetch(`${apiBaseUrl}/api/animals/create-with-images`, {
        method: "POST",
        body: formPayload
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const msg =
          result.error ||
          (response.status === 403
            ? "Complete your owner profile before listing animals."
            : "Animal could not be saved.");
        showPopup({ type: "error", title: "Could not save", message: msg });
        if (response.status === 403) {
          navigate("/complete-owner-profile", { replace: true });
        }
        return;
      }

      showPopup({
        type: "success",
        title: "Listing published",
        message: "The animal profile was saved successfully."
      });

      setStep(1);
      setFormData({
        name: "",
        breed: "",
        description: "",
        animalType: "",
        energyLevel: "",
        ageRange: "",
        size: "",
        grooming: "",
        specialNeeds: "",
        goodWithChildren: "",
        goodWithPets: "",
        housingLocation: ""
      });
      setImages([]);
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
      setImagePreviews([]);
      setErrors({});
    } catch (error) {
      console.error(error);
      showPopup({
        type: "error",
        title: "Connection error",
        message: "Could not reach the server."
      });
    }
  };

  const handleArchiveListing = async () => {
    const user = getStoredUser();
    const ownerId = getResolvedUserId(user);
    if (!ownerId || !isEditMode || !editAnimalId) {
      return;
    }
    setArchiveBusy(true);
    const apiBaseUrl = getApiBaseUrl();
    try {
      const refRes = await fetch(`${apiBaseUrl}/api/animals/${editAnimalId}`);
      if (!refRes.ok) {
        showPopup({
          type: "error",
          title: "Could not archive",
          message: "Listing could not be reloaded from the server."
        });
        return;
      }
      const fresh = normalizeAnimalFromApi(await refRes.json());
      if (Number(fresh.ownerId) !== Number(ownerId)) {
        showPopup({
          type: "error",
          title: "Access denied",
          message: "You can only archive your own listings."
        });
        return;
      }
      const imgs = ownerListingImageUrls(fresh);
      const putBody = {
        name: fresh.name,
        animalType: fresh.animalType,
        breed: fresh.breed,
        ageGroup: fresh.ageGroup,
        size: fresh.size || "MEDIUM",
        energyLevel: fresh.energyLevel,
        groomingNeed: fresh.groomingNeed,
        specialNeeds: fresh.specialNeeds,
        goodWithChildren: fresh.goodWithChildren,
        goodWithPets: fresh.goodWithPets,
        description: fresh.description,
        housingLocation: fresh.housingLocation,
        listingStatus: "Archived",
        compatibilityScore: fresh.compatibilityScore ?? null,
        images: imgs
      };
      const putRes = await fetch(
        `${apiBaseUrl}/api/animals/${editAnimalId}?viewerId=${encodeURIComponent(ownerId)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(putBody)
        }
      );
      const putJson = await putRes.json().catch(() => ({}));
      if (!putRes.ok) {
        showPopup({
          type: "error",
          title: "Could not archive",
          message: putJson.error || "Try again."
        });
        return;
      }
      setLoadedAnimal(normalizeAnimalFromApi(putJson));
      showPopup({
        type: "success",
        title: "Listing archived",
        message: "Adopters will see it as archived."
      });
      navigate(`/animal/${editAnimalId}`);
    } catch (err) {
      console.error(err);
      showPopup({
        type: "error",
        title: "Connection error",
        message: "Could not reach the server."
      });
    } finally {
      setArchiveBusy(false);
    }
  };

  const confirmDeleteListing = async () => {
    const user = getStoredUser();
    const ownerId = getResolvedUserId(user);
    if (!ownerId || !isEditMode || !editAnimalId) {
      return;
    }
    setDeleteBusy(true);
    const apiBaseUrl = getApiBaseUrl();
    try {
      const res = await fetch(
        `${apiBaseUrl}/api/animals/${editAnimalId}?viewerId=${encodeURIComponent(ownerId)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const text = await res.text();
        let msg = "The listing was not removed.";
        try {
          const errBody = JSON.parse(text);
          if (errBody && typeof errBody.error === "string") {
            msg = errBody.error;
          }
        } catch {
          /* empty body */
        }
        showPopup({
          type: "error",
          title: "Could not delete",
          message: msg
        });
        return;
      }
      setDeleteDialogOpen(false);
      showPopup({
        type: "success",
        title: "Listing removed",
        message: "The animal has been deleted from the platform."
      });
      navigate("/owner-listings");
    } catch (err) {
      console.error(err);
      showPopup({
        type: "error",
        title: "Connection error",
        message: "Could not reach the server."
      });
    } finally {
      setDeleteBusy(false);
    }
  };

  const getStepClass = (n) => {
    if (n < step) return "step-item step-completed";
    if (n === step) return "step-item step-current";
    return "step-item step-upcoming";
  };

  const RadioCheckRow = ({ name: fieldName, options }) => (
    <div className="checkbox-grid">
      {options.map((opt) => {
        const selected = formData[fieldName] === opt;
        return (
          <label
            key={opt}
            className={`check-card ${selected ? "check-card-selected" : ""}`}
          >
            <input
              type="radio"
              name={fieldName}
              checked={selected}
              onChange={() => setField(fieldName, opt)}
            />
            <span>{opt.replace(/^Dog - |^Cat - /, "")}</span>
          </label>
        );
      })}
    </div>
  );

  const apiBase = getApiBaseUrl();

  return (
    <div className="adoption-request-page register-animal-page">
      <Navbar />

      <main className="adoption-request-main">
        <section className="adoption-request-hero">
          <p className="adoption-request-tag">Owner — list an animal</p>
          <h1>{isEditMode ? "Edit your listing" : "Register an animal for adoption"}</h1>
          <p>
            {isEditMode
              ? "Update the same fields you used when you first published this animal. You can add JPEG photos, archive the listing, or delete it entirely."
              : "Use the same compatibility dimensions adopters select in their request — type, energy, age, size (dogs), grooming, special needs, and household fit — so matches stay fair and consistent."}
          </p>
        </section>

        <section className="adoption-request-card">
          <div className="adoption-request-top">
            <div>
              <h2>{isEditMode ? "Edit listing" : "New animal listing"}</h2>
              <p className="adoption-request-subtitle">
                Step {step} of {TOTAL_STEPS}
              </p>
            </div>
            <div className="adoption-request-progress-wrap">
              <div className="adoption-request-progress-bar">
                <div
                  className="adoption-request-progress-fill"
                  style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="adoption-step-row">
            <div className={getStepClass(1)}>
              <div className="step-circle">1</div>
              <span>Basics</span>
            </div>
            <div className={getStepClass(2)}>
              <div className="step-circle">2</div>
              <span>Compatibility</span>
            </div>
            <div className={getStepClass(3)}>
              <div className="step-circle">3</div>
              <span>Photos</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {step === 1 && (
              <div className="adoption-step-section">
                <h3>Animal basics</h3>
                <div className="adoption-request-grid">
                  <div className="adoption-request-group">
                    <RequiredLabel>Name</RequiredLabel>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`adoption-text-input ${errors.name ? "error-input" : ""}`}
                      placeholder="Animal name"
                      autoComplete="off"
                    />
                  </div>
                  <div className="adoption-request-group">
                    <RequiredLabel>Breed</RequiredLabel>
                    <input
                      type="text"
                      name="breed"
                      value={formData.breed}
                      onChange={handleChange}
                      className={`adoption-text-input ${errors.breed ? "error-input" : ""}`}
                      placeholder="Breed or mix"
                    />
                  </div>
                  <div className="adoption-request-group adoption-request-full">
                    <RequiredLabel>Short description</RequiredLabel>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      className={errors.description ? "error-input" : ""}
                      placeholder="Personality, routine, what kind of home fits best (min. 20 characters)."
                      rows={5}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="adoption-step-section">
                <h3>Matching profile</h3>
                <p className="register-animal-step-hint">
                  These line up with the adopter form&apos;s &quot;Animal preferences&quot; step.
                </p>

                <div
                  className={`adoption-request-group adoption-request-full ${
                    errors.animalType ? "error-group" : ""
                  }`}
                >
                  <RequiredLabel>Animal type</RequiredLabel>
                  <div className="animal-choice-grid">
                    {["Dog", "Cat"].map((animal) => {
                      const isSelected = formData.animalType === animal;
                      return (
                        <label
                          key={animal}
                          className={`animal-card ${isSelected ? "animal-card-selected" : ""}`}
                        >
                          <input
                            type="radio"
                            name="animalType"
                            checked={isSelected}
                            onChange={() => handleAnimalTypeSelect(animal)}
                          />
                          <div className="animal-card-icon">
                            <span className="animal-card-dot" />
                          </div>
                          <span>{animal}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div
                  className={`adoption-request-group adoption-request-full ${
                    errors.energyLevel ? "error-group" : ""
                  }`}
                >
                  <RequiredLabel>Energy level</RequiredLabel>
                  <RadioCheckRow name="energyLevel" options={["Calm", "Balanced", "Active"]} />
                </div>

                {selectedAnimalType && (
                  <div
                    className={`adoption-request-group adoption-request-full ${
                      errors.ageRange ? "error-group" : ""
                    }`}
                  >
                    <RequiredLabel>Age range</RequiredLabel>
                    <RadioCheckRow name="ageRange" options={ageOptions} />
                  </div>
                )}

                {sizeOptions.length > 0 && (
                  <div
                    className={`adoption-request-group adoption-request-full ${
                      errors.size ? "error-group" : ""
                    }`}
                  >
                    <RequiredLabel>Size</RequiredLabel>
                    <RadioCheckRow name="size" options={sizeOptions} />
                  </div>
                )}

                {selectedAnimalType && (
                  <div
                    className={`adoption-request-group adoption-request-full ${
                      errors.grooming ? "error-group" : ""
                    }`}
                  >
                    <RequiredLabel>Grooming needs</RequiredLabel>
                    <RadioCheckRow name="grooming" options={groomingOptions} />
                  </div>
                )}

                <div className="adoption-request-grid">
                  <div className="adoption-request-group">
                    <RequiredLabel>Special needs</RequiredLabel>
                    <select
                      name="specialNeeds"
                      value={formData.specialNeeds}
                      onChange={handleChange}
                      className={errors.specialNeeds ? "error-input" : ""}
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div className="adoption-request-group">
                    <RequiredLabel>Good with children</RequiredLabel>
                    <select
                      name="goodWithChildren"
                      value={formData.goodWithChildren}
                      onChange={handleChange}
                      className={errors.goodWithChildren ? "error-input" : ""}
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div className="adoption-request-group">
                    <RequiredLabel>Good with other pets</RequiredLabel>
                    <select
                      name="goodWithPets"
                      value={formData.goodWithPets}
                      onChange={handleChange}
                      className={errors.goodWithPets ? "error-input" : ""}
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div className="adoption-request-group">
                    <RequiredLabel>Where is the animal kept?</RequiredLabel>
                    <select
                      name="housingLocation"
                      value={formData.housingLocation}
                      onChange={handleChange}
                      className={errors.housingLocation ? "error-input" : ""}
                    >
                      <option value="">Select</option>
                      <option value="Home">Home</option>
                      <option value="Shelter">Shelter / facility</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="adoption-step-section">
                <h3>{isEditMode ? "Photos & save" : "Photos & publish"}</h3>
                <div className="review-grid register-animal-review">
                  <div className="review-box review-box-full">
                    <h4>Summary</h4>
                    <p>
                      <strong>Type:</strong> {formData.animalType || "—"}
                    </p>
                    <p>
                      <strong>Energy:</strong> {formData.energyLevel || "—"}
                    </p>
                    <p>
                      <strong>Age:</strong> {formData.ageRange || "—"}
                    </p>
                    {formData.animalType === "Dog" && (
                      <p>
                        <strong>Size:</strong> {formData.size || "—"}
                      </p>
                    )}
                    <p>
                      <strong>Grooming:</strong> {formData.grooming || "—"}
                    </p>
                    <p>
                      <strong>Special needs:</strong> {formData.specialNeeds || "—"}
                    </p>
                    <p>
                      <strong>Children / other pets:</strong>{" "}
                      {formData.goodWithChildren || "—"} / {formData.goodWithPets || "—"}
                    </p>
                  </div>
                </div>

                <div
                  className={`adoption-request-group adoption-request-full ${
                    errors.images ? "error-group" : ""
                  }`}
                >
                  <RequiredLabel>
                    {isEditMode
                      ? "Photos (keep at least 3 total — existing + new JPEGs, up to 5 new files)"
                      : "Photos (minimum 3, up to 5 — JPEG .jpg / .jpeg only)"}
                  </RequiredLabel>
                  {isEditMode && existingImageUrls.length > 0 && (
                    <div className="register-animal-preview-row">
                      {existingImageUrls.map((u, i) => {
                        const src = resolveMediaUrl(u, apiBase) || u;
                        return (
                          <div key={`${u}-${i}`} className="register-animal-preview-tile">
                            <img src={src} alt="" />
                            <button
                              type="button"
                              className="register-animal-preview-remove"
                              onClick={() => removeExistingImageAt(i)}
                              aria-label={`Remove saved photo ${i + 1}`}
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,.jpg,.jpeg,.jpe"
                    multiple
                    onChange={handleImageUpload}
                    className="register-animal-file-input"
                  />
                  <p className="register-animal-file-hint">
                    {isEditMode
                      ? "Existing photos stay on the server until you remove them or save. New picks upload when you save."
                      : "Only JPEG files (.jpg or .jpeg). They are stored on the server as .jpg."}
                  </p>
                  {imagePreviews.length > 0 && (
                    <div className="register-animal-preview-row">
                      {imagePreviews.map((src, i) => (
                        <div key={src} className="register-animal-preview-tile">
                          <img src={src} alt="" />
                          <button
                            type="button"
                            className="register-animal-preview-remove"
                            onClick={() => removeImageAt(i)}
                            aria-label={`Remove photo ${i + 1}`}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="adoption-request-actions">
              {step < TOTAL_STEPS ? (
                <>
                  <button
                    type="button"
                    className="adoption-back-btn"
                    onClick={goBack}
                    disabled={step === 1}
                  >
                    Back
                  </button>
                  <button type="button" className="adoption-next-btn" onClick={goNext}>
                    Next
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="adoption-back-btn" onClick={goBack}>
                    Back
                  </button>
                  <button type="submit" className="adoption-submit-btn">
                    {isEditMode ? "Save changes" : "Publish listing"}
                  </button>
                </>
              )}
            </div>
          </form>

          {isEditMode && loadedAnimal && (
            <div className="register-animal-listing-tools">
              <h3>Listing options</h3>
              <p>
                Status: <strong>{loadedAnimal.listingStatus || "Active"}</strong>
              </p>
              <div className="register-animal-listing-tools-row">
                <button
                  type="button"
                  className="adoption-back-btn"
                  onClick={handleArchiveListing}
                  disabled={
                    archiveBusy || String(loadedAnimal.listingStatus).toLowerCase() === "archived"
                  }
                >
                  {archiveBusy ? "Archiving…" : "Archive listing"}
                </button>
                <button
                  type="button"
                  className="register-animal-delete-btn"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={deleteBusy}
                >
                  Delete listing
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      <div className="required-field-note">
        <span className="required-star">*</span> indicates required fields
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Are you sure?"
        description="This will permanently delete this listing. You will not be able to undo this."
        confirmLabel="Yes"
        cancelLabel="No"
        confirmDanger
        busy={deleteBusy}
        onConfirm={confirmDeleteListing}
        onCancel={() => {
          if (!deleteBusy) {
            setDeleteDialogOpen(false);
          }
        }}
      />

      <Footer />
    </div>
  );
}

export default RegisterAnimalPage;
