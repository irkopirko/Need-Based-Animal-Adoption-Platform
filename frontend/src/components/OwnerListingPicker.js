import React from "react";
import "./OwnerListingPicker.css";
import {
  ownerListingImageUrls,
  resolveOwnerListingImageUrl
} from "../utils/ownerJourney";
import { getApiBaseUrl } from "../utils/auth";

function OwnerListingPicker({
  listings,
  inquiries = [],
  selectedListingId,
  onSelectListing,
  showAllOption = true
}) {
  const apiBase = getApiBaseUrl();
  const countByAnimal = React.useMemo(() => {
    const map = new Map();
    for (const inq of inquiries) {
      const aid = Number(inq.animalId);
      if (!Number.isFinite(aid)) {
        continue;
      }
      map.set(aid, (map.get(aid) || 0) + 1);
    }
    return map;
  }, [inquiries]);

  const visibleListings = React.useMemo(() => {
    const withInquiry = new Set([...countByAnimal.keys()]);
    return (listings || []).filter((l) => withInquiry.has(Number(l.id)));
  }, [listings, countByAnimal]);

  if (visibleListings.length === 0) {
    return (
      <p className="owner-listing-picker-empty">
        No message requests yet. They appear when an adopter with a strong match contacts you.
      </p>
    );
  }

  return (
    <div className="owner-listing-picker">
      {showAllOption && (
        <button
          type="button"
          className={`owner-listing-picker-item owner-listing-picker-all ${
            selectedListingId == null ? "owner-listing-picker-item-active" : ""
          }`}
          onClick={() => onSelectListing(null)}
        >
          <span className="owner-listing-picker-name">All listings</span>
          <span className="owner-listing-picker-count">{inquiries.length}</span>
        </button>
      )}
      {visibleListings.map((listing) => {
        const urls = ownerListingImageUrls(listing);
        const thumb = urls[0]
          ? resolveOwnerListingImageUrl(urls[0], apiBase)
          : "";
        const count = countByAnimal.get(Number(listing.id)) || 0;
        const active = selectedListingId === Number(listing.id);
        return (
          <button
            key={listing.id}
            type="button"
            className={`owner-listing-picker-item ${
              active ? "owner-listing-picker-item-active" : ""
            }`}
            onClick={() => onSelectListing(Number(listing.id))}
          >
            {thumb ? (
              <img src={thumb} alt="" className="owner-listing-picker-thumb" />
            ) : (
              <span className="owner-listing-picker-thumb-placeholder" aria-hidden />
            )}
            <span className="owner-listing-picker-text">
              <span className="owner-listing-picker-name">{listing.name}</span>
              <span className="owner-listing-picker-meta">
                {listing.animalType} · {listing.breed}
              </span>
            </span>
            <span className="owner-listing-picker-count">{count}</span>
          </button>
        );
      })}
    </div>
  );
}

export default OwnerListingPicker;
