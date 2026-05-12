import React, { useEffect, useRef } from "react";
import "./GuestAdoptPage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import guestAdoptHeroImage from "../images/guestAdoptHeroImage.jpg";

function GuestAdoptPage() {
  const flowSectionRef = useRef(null);

  useEffect(() => {
    const root = flowSectionRef.current;
    if (!root) {
      return undefined;
    }
    const steps = Array.from(root.querySelectorAll(".guest-flow-step"));
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || typeof IntersectionObserver === "undefined") {
      steps.forEach((el) => el.classList.add("guest-flow-step--visible"));
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("guest-flow-step--visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    steps.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="guest-adopt-page">
      <Navbar />

      <main className="guest-adopt-main">

        <section className="guest-adopt-hero">
          <div className="guest-adopt-hero-text">
            <p className="guest-adopt-tag">Start Here</p>
         <h1>
           <span className="highlight-two">Two</span> simple paths,
           <br />
           <span className="highlight-one">one</span> caring platform.
         </h1>
            <p>
              Whether you want to adopt or list an animal, Pavia helps you move
              through a clear and organized process.
            </p>
          </div>

          <div className="guest-adopt-hero-image-wrapper">
            <img
              src={guestAdoptHeroImage}
              alt="Adopt or list an animal"
              className="guest-adopt-hero-image"
            />
          </div>
        </section>


       <section ref={flowSectionRef} className="guest-flow-section">
         <div className="guest-flow-card">
           <div className="guest-flow-head">
             <p className="guest-adopt-tag">Adopt</p>
             <h2>How to adopt with Pavia</h2>
           </div>

           <div className="guest-flow-steps">
             <div className="guest-flow-step">
               <div className="guest-step-number">01</div>
               <h3>Create Account</h3>
               <p>Sign up and continue as an adopter.</p>
             </div>

             <div className="guest-flow-arrow">→</div>

             <div className="guest-flow-step">
               <div className="guest-step-number">02</div>
               <h3>Complete Request</h3>
               <p>Fill in your home and lifestyle details.</p>
             </div>

             <div className="guest-flow-arrow">→</div>

             <div className="guest-flow-step">
               <div className="guest-step-number">03</div>
               <h3>Review Matches</h3>
               <p>Discover animals compatible with your environment.</p>
             </div>

             <div className="guest-flow-arrow">→</div>

             <div className="guest-flow-step">
               <div className="guest-step-number">04</div>
               <h3>Track Requests</h3>
               <p>Follow your adoption journey seamlessly.</p>
             </div>
           </div>
         </div>

         {/* LIST FLOW */}
         <div className="guest-flow-card">
           <div className="guest-flow-head">
             <p className="guest-adopt-tag">List</p>
             <h2>How to list an animal</h2>
           </div>

           <div className="guest-flow-steps">
             <div className="guest-flow-step">
               <div className="guest-step-number">01</div>
               <h3>Create Account</h3>
               <p>Register and continue as an owner.</p>
             </div>

             <div className="guest-flow-arrow">→</div>

             <div className="guest-flow-step">
               <div className="guest-step-number">02</div>
               <h3>Add Animal Profile</h3>
               <p>Provide details, needs, and compatibility information.</p>
             </div>

             <div className="guest-flow-arrow">→</div>

             <div className="guest-flow-step">
               <div className="guest-step-number">03</div>
               <h3>Publish Listing</h3>
               <p>Make the profile visible on the platform.</p>
             </div>

             <div className="guest-flow-arrow">→</div>

             <div className="guest-flow-step">
               <div className="guest-step-number">04</div>
               <h3>Manage Requests</h3>
               <p>Review and respond to adoption inquiries.</p>
             </div>
           </div>
         </div>
       </section>
      </main>

      <Footer />
    </div>
  );
}

export default GuestAdoptPage;