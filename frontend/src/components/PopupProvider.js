import React, { createContext, useContext, useState } from "react";
import "./PopupProvider.css";

const PopupContext = createContext(null);

export function PopupProvider({ children }) {
  const [popup, setPopup] = useState(null);
  const getPopupIcon = (type) => {
    if (type === "success") return "✓";
    if (type === "info") return "i";
    return "!";
  };

  const closePopup = () => {
    setPopup(null);
  };

  const showPopup = (options) => {
    const {
      type = "info",
      title,
      message,
      durationMs = 3500
    } = options || {};

    const safeMessage = message || "";
    if (!safeMessage) {
      return;
    }

    setPopup({
      type,
      title: title || (type === "success" ? "Success" : "Notice"),
      message: safeMessage,
      icon: getPopupIcon(type)
    });

    if (durationMs > 0) {
      window.setTimeout(() => {
        setPopup((current) => (current && current.message === safeMessage ? null : current));
      }, durationMs);
    }
  };

  return (
    <PopupContext.Provider value={{ showPopup, closePopup }}>
      {children}
      {popup && (
        <div className={`app-popup app-popup-${popup.type}`} role="status" aria-live="polite">
          <div className={`app-popup-icon app-popup-icon-${popup.type}`}>{popup.icon}</div>
          <div className="app-popup-content">
            <p className="app-popup-title">{popup.title}</p>
            <p className="app-popup-message">{popup.message}</p>
          </div>
          <button type="button" className="app-popup-close" onClick={closePopup} aria-label="Close popup">
            ×
          </button>
        </div>
      )}
    </PopupContext.Provider>
  );
}

export function usePopup() {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error("usePopup must be used within PopupProvider");
  }
  return context;
}
