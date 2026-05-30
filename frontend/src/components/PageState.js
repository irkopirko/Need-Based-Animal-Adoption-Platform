import React from "react";
import "./PageState.css";

/**
 * Standard loading / empty / error / locked states for list and detail pages.
 */
function PageState({ variant = "loading", title, message, action }) {
  const defaultTitle =
    variant === "loading"
      ? "Loading…"
      : variant === "error"
        ? "Something went wrong"
        : variant === "locked"
          ? "Not available yet"
          : "Nothing here yet";

  return (
    <section className={`page-state page-state--${variant}`} role="status">
      <h2 className="page-state-title">{title || defaultTitle}</h2>
      {message && <p className="page-state-message">{message}</p>}
      {action && <div className="page-state-action">{action}</div>}
    </section>
  );
}

export default PageState;
