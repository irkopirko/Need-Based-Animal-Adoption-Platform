import React, { useState } from "react";
import "./RegisterAnimalPage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function RegisterAnimalPage() {
  const [images, setImages] = useState([]);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    animalType: "",
    breed: "",
    age: "",
    size: "",
    energyLevel: "",
    groomingNeeds: "",
    specialNeeds: "",
    goodWithChildren: "",
    goodWithPets: "",
    description: "",
    housingLocation: ""
  });

  const triggerToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2600);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const updatedImages = [...images, ...files].slice(0, 5);
    setImages(updatedImages);
  };

const user = JSON.parse(localStorage.getItem("paviaUser"));



  const handleSubmit = async (e) => {
    e.preventDefault();

    if (images.length < 3) {
      triggerToast("Please upload at least 3 images.", "error");
      return;
    }

    for (const key in formData) {
      if (formData[key] === "") {
        triggerToast("Please fill in all required fields.", "error");
        return;
      }
    }

    const payload = {
      name: formData.name,
      animalType: formData.animalType.toUpperCase(),
      breed: formData.breed,
      ageGroup: formData.age.toUpperCase(),
      size: formData.size.toUpperCase(),
      energyLevel: formData.energyLevel.toUpperCase(),
      groomingNeed: formData.groomingNeeds.toUpperCase(),
      specialNeeds: formData.specialNeeds.toUpperCase(),
      goodWithChildren: formData.goodWithChildren.toUpperCase(),
      goodWithPets: formData.goodWithPets.toUpperCase(),
      description: formData.description,
      housingLocation: formData.housingLocation,
      ownerId: user?.userId 
    };
const formPayload = new FormData();

formPayload.append(
  "animal",
  new Blob([JSON.stringify(payload)], {
    type: "application/json",
  })
);

images.forEach((image) => {
  formPayload.append("images", image);
});
    try {
      const formPayload = new FormData();


formPayload.append(
  "animal",
  new Blob([JSON.stringify(payload)], {
    type: "application/json"
  })
);

images.forEach((image) => {
  formPayload.append("images", image);
});

const response = await fetch("http://localhost:8080/api/animals/create-with-images", {
  method: "POST",
  body: formPayload
});

      if (!response.ok) {
        throw new Error("Animal could not be saved.");
      }

      const result = await response.json();
      console.log("Animal saved:", result);

      triggerToast("Animal registered successfully!", "success");

      // RESET
      setFormData({
        name: "",
        animalType: "",
        breed: "",
        age: "",
        size: "",
        energyLevel: "",
        groomingNeeds: "",
        specialNeeds: "",
        goodWithChildren: "",
        goodWithPets: "",
        description: "",
        housingLocation: ""
      });

      setImages([]);

    } catch (error) {
      console.error(error);
      triggerToast("Backend connection failed.", "error");
    }
  };

  return (
    <div className="register-animal-page">
      <Navbar />

      <main className="register-animal-main">
        <section className="register-animal-hero">
          <p className="register-animal-tag">Owner Panel</p>
          <h1>Register a New Animal</h1>
        </section>

        <section className="register-animal-card">
          <form onSubmit={handleSubmit}>
            <h2>Animal Information</h2>

            <div className="register-grid">

              <input name="name" placeholder="Name" onChange={handleChange} value={formData.name} />

              <select name="animalType" onChange={handleChange} value={formData.animalType}>
                <option value="">Type</option>
                <option value="Dog">Dog</option>
                <option value="Cat">Cat</option>
              </select>

              <input name="breed" placeholder="Breed" onChange={handleChange} value={formData.breed} />

              <select name="age" onChange={handleChange} value={formData.age}>
                <option value="">Age</option>
                <option value="Young">Young</option>
                <option value="Adult">Adult</option>
                <option value="Senior">Senior</option>
              </select>

              <select name="size" onChange={handleChange} value={formData.size}>
                <option value="">Size</option>
                <option value="Small">Small</option>
                <option value="Medium">Medium</option>
                <option value="Large">Large</option>
              </select>

              <select name="energyLevel" onChange={handleChange} value={formData.energyLevel}>
                <option value="">Energy</option>
                <option value="Calm">Calm</option>
                <option value="Balanced">Balanced</option>
                <option value="Active">Active</option>
              </select>

              <select name="groomingNeeds" onChange={handleChange} value={formData.groomingNeeds}>
                <option value="">Grooming</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>

              <select name="specialNeeds" onChange={handleChange} value={formData.specialNeeds}>
                <option value="">Special Needs</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>

              <select name="goodWithChildren" onChange={handleChange} value={formData.goodWithChildren}>
                <option value="">Children</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>

              <select name="goodWithPets" onChange={handleChange} value={formData.goodWithPets}>
                <option value="">Other Pets</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>

              {}
              <select name="housingLocation" onChange={handleChange} value={formData.housingLocation}>
                <option value="">Where is the animal?</option>
                <option value="Home">Home</option>
                <option value="Shelter">Shelter</option>
              </select>

              <textarea
                name="description"
                placeholder="Description"
                onChange={handleChange}
                value={formData.description}
              />
            </div>

            <h2>Images</h2>
            <input type="file" multiple onChange={handleImageUpload} />

            <button type="submit">Register Animal</button>
          </form>
        </section>
      </main>

      <Footer />

      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
    </div>
  );
}
export default RegisterAnimalPage;