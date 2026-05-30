import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import "./PopupProvider.css";

const PopupContext = createContext(null);

export function PopupProvider({ children }) {
  const [popup, setPopup] = useState(null);
  const popupTimerRef = useRef(null);

  const getPopupIcon = useCallback((type) => {
    if (type === "success") return "✓";
    if (type === "info") return "i";
    if (type === "warning") return "⚠";
    if (type === "error" || type === "critical") return "!";
    return "!";
  }, []);

  const getDefaultTitle = useCallback((type) => {
    if (type === "success") return "Success";
    if (type === "error" || type === "critical") return "Are you sure?";
    if (type === "warning") return "Please confirm";
    return "Notice";
  }, []);

  const [confirm, setConfirm] = useState(null);

  const closePopup = useCallback(() => {
    if (popupTimerRef.current != null) {
      window.clearTimeout(popupTimerRef.current);
      popupTimerRef.current = null;
    }
    setPopup(null);
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirm(null);
  }, []);

  const showConfirm = useCallback(
    (options = {}) => {
      const {
        type = "warning",
        title,
        message,
        confirmLabel = "Confirm",
        cancelLabel = "Cancel",
        confirmDanger = false,
        onConfirm
      } = options;

      const safeMessage = message || "";
      if (!safeMessage && !title) {
        return Promise.resolve(false);
      }

      return new Promise((resolve) => {
        setConfirm({
          type,
          title: title || getDefaultTitle(type),
          message: safeMessage,
          icon: getPopupIcon(type),
          confirmLabel,
          cancelLabel,
          confirmDanger,
          busy: false,
          resolve,
          onConfirm: typeof onConfirm === "function" ? onConfirm : null
        });
      });
    },
    [getDefaultTitle, getPopupIcon]
  );

  const handleConfirmCancel = useCallback(() => {
    if (!confirm || confirm.busy) {
      return;
    }
    confirm.resolve(false);
    closeConfirm();
  }, [confirm, closeConfirm]);

  const handleConfirmOk = useCallback(async () => {
    if (!confirm || confirm.busy) {
      return;
    }
    if (confirm.onConfirm) {
      setConfirm((prev) => (prev ? { ...prev, busy: true } : prev));
      try {
        await confirm.onConfirm();
        confirm.resolve(true);
        closeConfirm();
      } catch {
        setConfirm((prev) => (prev ? { ...prev, busy: false } : prev));
      }
      return;
    }
    confirm.resolve(true);
    closeConfirm();
  }, [confirm, closeConfirm]);

  useEffect(() => {
    if (!confirm) {
      return undefined;
    }
    const onKey = (e) => {
      if (e.key === "Escape") {
        handleConfirmCancel();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirm, handleConfirmCancel]);

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

      if (popupTimerRef.current != null) {
        window.clearTimeout(popupTimerRef.current);
        popupTimerRef.current = null;
      }

      setPopup({
        type,
        title: title || getDefaultTitle(type),
        message: safeMessage,
        icon: getPopupIcon(type)
      });

      if (durationMs > 0) {
        popupTimerRef.current = window.setTimeout(() => {
          popupTimerRef.current = null;
          setPopup((current) =>
            current && current.message === safeMessage ? null : current
          );
        }, durationMs);
      }
    },
    [getDefaultTitle, getPopupIcon]
  );

  const contextValue = useMemo(
    () => ({ showPopup, closePopup, showConfirm, closeConfirm }),
    [showPopup, closePopup, showConfirm, closeConfirm]
  );

  return (
    <PopupContext.Provider value={contextValue}>
      {children}
      {confirm && (
        <div
          className="app-confirm-backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              handleConfirmCancel();
            }
          }}
        >
          <div
            className={`app-confirm-panel app-popup app-popup-${confirm.type}`}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="app-confirm-title"
            aria-describedby="app-confirm-message"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className={`app-popup-icon app-popup-icon-${confirm.type}`}>
              {confirm.icon}
            </div>
            <div className="app-popup-content app-confirm-content">
              <p id="app-confirm-title" className="app-popup-title">
                {confirm.title}
              </p>
              <p id="app-confirm-message" className="app-popup-message">
                {confirm.message}
              </p>
              <div className="app-confirm-actions">
                <button
                  type="button"
                  className="app-confirm-btn app-confirm-btn-cancel"
                  onClick={handleConfirmCancel}
                  disabled={confirm.busy}
                >
                  {confirm.cancelLabel}
                </button>
                <button
                  type="button"
                  className={`app-confirm-btn app-confirm-btn-ok ${
                    confirm.confirmDanger ? "app-confirm-btn-danger" : ""
                  }`}
                  onClick={handleConfirmOk}
                  disabled={confirm.busy}
                >
                  {confirm.busy ? "Please wait…" : confirm.confirmLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
