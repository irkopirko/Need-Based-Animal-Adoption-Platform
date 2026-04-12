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
    description: ""
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

  const handleSubmit = (e) => {
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
      id: Date.now(),
      ...formData,
      images
    };

    console.log("Animal Registered:", payload);
    triggerToast("Animal registered successfully!", "success");
  };

  return (
    <div className="register-animal-page">
      <Navbar />

      <main className="register-animal-main">
        <section className="register-animal-hero">
          <p className="register-animal-tag">Owner Panel</p>
          <h1>Register a New Animal</h1>
          <p>
            Provide accurate information so the system can match your animal with
            the most suitable adopters.
          </p>
        </section>

        <section className="register-animal-card">
          <form onSubmit={handleSubmit}>
            <h2>Animal Information</h2>

            <div className="register-grid">
              <div className="form-group">
                <label>Animal Name</label>
                <input
                  type="text"
                  name="name"
                  onChange={handleChange}
                  value={formData.name}
                />
              </div>

              <div className="form-group">
                <label>Animal Type</label>
                <select
                  name="animalType"
                  onChange={handleChange}
                  value={formData.animalType}
                >
                  <option value="">Select</option>
                  <option value="Dog">Dog</option>
                  <option value="Cat">Cat</option>
                </select>
              </div>

              <div className="form-group">
                <label>Breed</label>
                <input
                  type="text"
                  name="breed"
                  onChange={handleChange}
                  value={formData.breed}
                />
              </div>

              <div className="form-group">
                <label>Age</label>
                <select
                  name="age"
                  onChange={handleChange}
                  value={formData.age}
                >
                  <option value="">Select</option>
                  <option value="Young">Young</option>
                  <option value="Adult">Adult</option>
                  <option value="Senior">Senior</option>
                </select>
              </div>

              <div className="form-group">
                <label>Size</label>
                <select
                  name="size"
                  onChange={handleChange}
                  value={formData.size}
                >
                  <option value="">Select</option>
                  <option value="Small">Small</option>
                  <option value="Medium">Medium</option>
                  <option value="Large">Large</option>
                </select>
              </div>

              <div className="form-group">
                <label>Energy Level</label>
                <select
                  name="energyLevel"
                  onChange={handleChange}
                  value={formData.energyLevel}
                >
                  <option value="">Select</option>
                  <option value="Calm">Calm</option>
                  <option value="Balanced">Balanced</option>
                  <option value="Active">Active</option>
                </select>
              </div>

              <div className="form-group">
                <label>Grooming Needs</label>
                <select
                  name="groomingNeeds"
                  onChange={handleChange}
                  value={formData.groomingNeeds}
                >
                  <option value="">Select</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div className="form-group">
                <label>Special Needs</label>
                <select
                  name="specialNeeds"
                  onChange={handleChange}
                  value={formData.specialNeeds}
                >
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div className="form-group">
                <label>Good with Children</label>
                <select
                  name="goodWithChildren"
                  onChange={handleChange}
                  value={formData.goodWithChildren}
                >
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div className="form-group">
                <label>Good with Other Pets</label>
                <select
                  name="goodWithPets"
                  onChange={handleChange}
                  value={formData.goodWithPets}
                >
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div className="form-group full-width">
                <label>Description</label>
                <textarea
                  name="description"
                  onChange={handleChange}
                  value={formData.description}
                ></textarea>
              </div>
            </div>

            <h2>Upload Images</h2>
            <p className="image-note">
              Please upload at least 3 images (maximum 5).
            </p>

            <div className="image-upload-box">
              <input type="file" multiple onChange={handleImageUpload} />
            </div>

            <div className="image-preview">
              {images.map((img, index) => (
                <img
                  key={index}
                  src={URL.createObjectURL(img)}
                  alt="preview"
                />
              ))}
            </div>

            <button type="submit" className="submit-btn">
              Register Animal
            </button>
          </form>
        </section>
      </main>

      <Footer />

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default RegisterAnimalPage;