import React from "react";
import "./ListingReportButton.css";

/**
 * Small “!” control for reporting a listing. Hover shows tooltip (default “Report”).
 */
function ListingReportButton({
  onClick,
  className = "",
  tooltip = "Report",
  variant = "overlay"
}) {
  return (
    <button
      type="button"
      className={`listing-report-btn listing-report-btn--${variant} ${className}`.trim()}
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      aria-label={tooltip}
    >
      <span className="listing-report-btn-icon" aria-hidden>
        !
      </span>
      <span className="listing-report-btn-tooltip">{tooltip}</span>
    </button>
  );
}

export default ListingReportButton;
