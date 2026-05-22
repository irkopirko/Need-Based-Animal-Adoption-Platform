import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "./ListingImageLightbox.css";

function ListingImageLightbox({ urls, startIndex = 0, onClose, title = "Photo" }) {
  const images = (urls || []).filter(Boolean);
  const [index, setIndex] = useState(() =>
    Math.min(Math.max(0, startIndex), Math.max(0, images.length - 1))
  );

  useEffect(() => {
    setIndex(Math.min(Math.max(0, startIndex), Math.max(0, images.length - 1)));
  }, [startIndex, images.length]);

  const goPrev = useCallback(() => {
    if (images.length <= 1) {
      return;
    }
    setIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const goNext = useCallback(() => {
    if (images.length <= 1) {
      return;
    }
    setIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        goPrev();
      } else if (e.key === "ArrowRight") {
        goNext();
      }
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, goPrev, goNext]);

  if (images.length === 0) {
    return null;
  }

  const current = images[index];

  return createPortal(
    <div
      className="listing-lightbox-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} — full size view`}
      onClick={onClose}
    >
      <div className="listing-lightbox-shell" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="listing-lightbox-close"
          onClick={onClose}
          aria-label="Close full size view"
        >
          ×
        </button>

        {images.length > 1 && (
          <>
            <button
              type="button"
              className="listing-lightbox-nav listing-lightbox-nav-prev"
              onClick={goPrev}
              aria-label="Previous full size photo"
            >
              ‹
            </button>
            <button
              type="button"
              className="listing-lightbox-nav listing-lightbox-nav-next"
              onClick={goNext}
              aria-label="Next full size photo"
            >
              ›
            </button>
          </>
        )}

        <div className="listing-lightbox-stage">
          <img
            src={current}
            alt=""
            className="listing-lightbox-img"
            draggable={false}
          />
        </div>

        {images.length > 1 && (
          <p className="listing-lightbox-counter" aria-live="polite">
            {index + 1} / {images.length}
          </p>
        )}
      </div>
    </div>,
    document.body
  );
}

export default ListingImageLightbox;
