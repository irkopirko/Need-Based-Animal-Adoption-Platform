import React from "react";
import "./SaveHeartButton.css";

const HEART_OUTLINE = `${process.env.PUBLIC_URL}/icons/heart-outline.png`;
const HEART_FILLED = `${process.env.PUBLIC_URL}/icons/heart-filled.png`;

/**
 * Toggle save control: outline = unsaved, filled = saved (top-right on listing cards / detail).
 */
function SaveHeartButton({ saved = false, onClick, className = "", disabled = false, ariaLabel }) {
  const label =
    ariaLabel || (saved ? "Remove from saved animals" : "Save animal to saved list");

  return (
    <button
      type="button"
      className={`save-heart-btn ${saved ? "is-saved" : ""} ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={saved}
    >
      <img
        src={saved ? HEART_FILLED : HEART_OUTLINE}
        alt=""
        className="save-heart-btn-icon"
        draggable={false}
      />
    </button>
  );
}

export default SaveHeartButton;
