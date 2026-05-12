import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState
} from "react";
import "./PopupProvider.css";

const PopupContext = createContext(null);

export function PopupProvider({ children }) {
  const [popup, setPopup] = useState(null);

  const getPopupIcon = useCallback((type) => {
    if (type === "success") return "✓";
    if (type === "info") return "i";
    if (type === "warning") return "⚠";
    if (type === "error" || type === "critical") return "!";
    return "!";
  }, []);

  const getDefaultTitle = useCallback((type) => {
    if (type === "success") return "Success";
    if (type === "error" || type === "critical") return "Error";
    if (type === "warning") return "Attention";
    return "Notice";
  }, []);

  const closePopup = useCallback(() => {
    setPopup(null);
  }, []);

  const showPopup = useCallback(
    (options) => {
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
        title: title || getDefaultTitle(type),
        message: safeMessage,
        icon: getPopupIcon(type)
      });

      if (durationMs > 0) {
        window.setTimeout(() => {
          setPopup((current) =>
            current && current.message === safeMessage ? null : current
          );
        }, durationMs);
      }
    },
    [getDefaultTitle, getPopupIcon]
  );

  const contextValue = useMemo(
    () => ({ showPopup, closePopup }),
    [showPopup, closePopup]
  );

  return (
    <PopupContext.Provider value={contextValue}>
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
