import React from "react";
import { resolveListingCardStatus } from "../utils/listingDisplay";
import "./ListingEngagementBadge.css";

/**
 * Owner listing engagement badge — colors aligned with PopupProvider (success / info / warning / neutral).
 */
export default function ListingEngagementBadge({
  animal,
  inquiryStats,
  hasStrongMatch = false,
  className = ""
}) {
  const { label, variant, hint } = resolveListingCardStatus(animal, {
    inquiryStats,
    hasStrongMatch
  });

  const classes = [
    "listing-engagement-badge",
    `listing-engagement-badge--${variant}`,
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes} title={hint} aria-label={hint ? `${label}: ${hint}` : label}>
      {label}
    </span>
  );
}
