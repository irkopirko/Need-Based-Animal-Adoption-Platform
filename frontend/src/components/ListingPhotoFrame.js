import React from "react";
import "./ListingPhotoFrame.css";

/**
 * Fixed 3:4 slot shared by every photo in a listing. Images scale to fit and stay
 * centered on the same anchor — the card never resizes when the carousel changes.
 */
function ListingPhotoFrame({
  urls = [],
  activeIndex = 0,
  onOpenLightbox,
  variant = "listing",
  emptyLabel = "No photo",
  expandHint = "View full size"
}) {
  const images = (urls || []).filter(Boolean);
  const n = images.length;
  const safeIdx = n === 0 ? 0 : activeIndex % n;
  const activeSrc = images[safeIdx] || null;
  const variantClass =
    variant === "detail" ? "listing-photo-frame--detail" : "listing-photo-frame--listing";

  return (
    <div className={`listing-photo-frame ${variantClass}`}>
      {activeSrc ? (
        <button
          type="button"
          className="listing-photo-frame__btn"
          onClick={onOpenLightbox}
          disabled={!onOpenLightbox}
          aria-label={expandHint}
        >
          <img src={activeSrc} alt="" className="listing-photo-frame__img" />
          {onOpenLightbox ? (
            <span className="listing-photo-frame__hint">{expandHint}</span>
          ) : null}
        </button>
      ) : (
        <div className="listing-photo-frame__placeholder" aria-hidden>
          {emptyLabel}
        </div>
      )}
    </div>
  );
}

export default ListingPhotoFrame;
