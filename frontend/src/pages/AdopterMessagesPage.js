import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdopterMessagesPage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import animalSlide2 from "../images/animalSlide2.jpg";

function AdopterMessagesPage() {
  const navigate = useNavigate();

  const [hasAdoptionRequest] = useState(false);
  const [hasMatches] = useState(false);
  const [hasConversations] = useState(false);

  const conversations = [
    {
      id: 1,
      ownerName: "Green Paws Shelter",
      animalName: "Luna",
      preview: "We reviewed your interest and would like to continue.",
      time: "10:24",
      unread: 2,
      image: animalSlide2,
      status: "Active"
    }
  ];

  if (!hasAdoptionRequest) {
    return (
      <div className="adopter-messages-page">
        <Navbar />
        <main className="messages-locked-main">
          <div className="messages-locked-card">
            <span className="messages-locked-badge">Locked</span>
            <h1>Complete Your Adoption Request First</h1>
            <p>
              Messaging becomes available only after you submit an adoption
              request. This ensures meaningful and responsible communication
              between adopters and animal owners.
            </p>
            <button
              className="messages-primary-btn"
              onClick={() => navigate("/adoption-request")}
            >
              Create Adoption Request
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (hasAdoptionRequest && !hasMatches) {
    return (
      <div className="adopter-messages-page">
        <Navbar />
        <main className="messages-locked-main">
          <div className="messages-locked-card">
            <span className="messages-locked-badge">No Matches Yet</span>
            <h1>No Compatible Animals Found</h1>
            <p>
              Messages will appear once you are matched with compatible animals
              and submit an adoption inquiry.
            </p>
            <button
              className="messages-primary-btn"
              onClick={() => navigate("/adopterhomepage")}
            >
              View Compatible Animals
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (hasMatches && !hasConversations) {
    return (
      <div className="adopter-messages-page">
        <Navbar />
        <main className="messages-locked-main">
          <div className="messages-locked-card">
            <span className="messages-locked-badge">No Conversations</span>
            <h1>No Messages Yet</h1>
            <p>
              Once you send an adoption inquiry and receive a response, your
              conversations will appear here.
            </p>
            <button
              className="messages-primary-btn"
              onClick={() => navigate("/adopterhomepage")}
            >
              Explore Compatible Animals
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="adopter-messages-page">
      <Navbar />
      <main className="messages-active-main">
        <h1 className="messages-title">Your Conversations</h1>
        <div className="messages-container">
          {conversations.map((conversation) => (
            <div key={conversation.id} className="conversation-card">
              <img
                src={conversation.image}
                alt={conversation.animalName}
                className="conversation-image"
              />
              <div className="conversation-content">
                <h3>{conversation.ownerName}</h3>
                <p>Regarding {conversation.animalName}</p>
                <span className="conversation-preview">
                  {conversation.preview}
                </span>
              </div>
              <span className="conversation-time">
                {conversation.time}
              </span>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default AdopterMessagesPage;