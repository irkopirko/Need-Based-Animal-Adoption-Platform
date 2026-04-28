import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./OwnerMessagesPage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import animalSlide3 from "../images/animalSlide3.jpg";

function OwnerMessagesPage() {
  const navigate = useNavigate();

  const [hasListings] = useState(false);
  const [hasMessageRequests] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState(1);

  const conversations = [
    {
      id: 1,
      adopterName: "Ceren Sarıgül",
      animalName: "Luna",
      preview: "Hello, I am interested in adopting Luna.",
      time: "10:24",
      unread: 1,
      image: animalSlide3,
      status: "New Inquiry"
    }
  ];

  const messagesByChat = {
    1: [
      {
        id: 1,
        sender: "adopter",
        text: "Hello, I am interested in adopting Luna.",
        time: "10:12"
      },
      {
        id: 2,
        sender: "owner",
        text: "Thank you for your interest. Could you share more about your home environment?",
        time: "10:18"
      }
    ]
  };

  if (!hasListings) {
    return (
      <div className="owner-messages-page">
        <Navbar />
        <main className="owner-messages-locked-main">
          <div className="owner-messages-locked-card">
            <span className="owner-messages-badge">No Listings</span>
            <h1>You need to register an animal first</h1>
            <p>
              Messaging becomes available after you create an animal listing.
              Once adopters express interest, their inquiries will appear here.
            </p>
            <button
              className="owner-primary-btn"
              onClick={() => navigate("/register-animal")}
            >
              Register Animal
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (hasListings && !hasMessageRequests) {
    return (
      <div className="owner-messages-page">
        <Navbar />
        <main className="owner-messages-locked-main">
          <div className="owner-messages-locked-card">
            <span className="owner-messages-badge">No Messages Yet</span>
            <h1>No inquiries received yet</h1>
            <p>
              Once adopters submit requests for your listed animals, their
              messages will appear here.
            </p>
            <button
              className="owner-primary-btn"
              onClick={() => navigate("/ownerhomepage")}
            >
              View My Listings
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const selectedConversation =
    conversations.find((c) => c.id === selectedChatId) || conversations[0];
  const selectedMessages = messagesByChat[selectedChatId] || [];

  return (
    <div className="owner-messages-page">
      <Navbar />

      <main className="owner-messages-main">
        <section className="owner-messages-hero">
          <div className="owner-messages-hero-left">
            <p className="owner-messages-tag">Owner Messages</p>
            <h1>Connect with potential adopters</h1>
            <p>
              Review inquiries, communicate with adopters, and guide animals
              toward their forever homes.
            </p>
          </div>

          <div className="owner-messages-hero-right">
            <div className="owner-messages-highlight-card">
              <span className="owner-highlight-badge">Owner Inbox</span>
              <h3>Every message brings a new opportunity</h3>
              <p>
                Respond to inquiries and ensure a smooth and responsible
                adoption process.
              </p>
            </div>
          </div>
        </section>

        <section className="owner-messages-layout">
          <div className="owner-conversation-panel">
            <h2>Conversations</h2>
            <div className="owner-conversation-list">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  className={`owner-conversation-card ${
                    selectedChatId === conversation.id
                      ? "owner-conversation-card-active"
                      : ""
                  }`}
                  onClick={() => setSelectedChatId(conversation.id)}
                >
                  <img
                    src={conversation.image}
                    alt={conversation.animalName}
                    className="owner-conversation-image"
                  />
                  <div className="owner-conversation-content">
                    <h3>{conversation.adopterName}</h3>
                    <p>Regarding {conversation.animalName}</p>
                    <span>{conversation.preview}</span>
                  </div>
                  <span className="owner-conversation-time">
                    {conversation.time}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="owner-chat-panel">
            <div className="owner-chat-header">
              <h2>{selectedConversation.adopterName}</h2>
              <span className="owner-chat-badge">Active</span>
            </div>

            <div className="owner-chat-messages">
              {selectedMessages.map((message) => (
                <div
                  key={message.id}
                  className={`owner-chat-bubble-row ${
                    message.sender === "owner"
                      ? "owner-chat-user"
                      : "owner-chat-adopter"
                  }`}
                >
                  <div className="owner-chat-bubble">
                    <p>{message.text}</p>
                    <span>{message.time}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="owner-chat-input-area">
              <input
                type="text"
                placeholder="Write your message..."
                className="owner-chat-input"
              />
              <button className="owner-chat-send-btn">Send</button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default OwnerMessagesPage;