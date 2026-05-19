import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./OwnerListingsPage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { usePopup } from "../components/PopupProvider";
import { getApiBaseUrl, getStoredUser, getResolvedUserId, normalizeRole } from "../utils/auth";
import {
  fetchOwnerListings,
  ownerListingImageUrls,
  resolveOwnerListingImageUrl
} from "../utils/ownerJourney";
import {
  archiveOwnerListing,
  formatListingCode,
  unarchiveOwnerListing
} from "../utils/platformApi";

function formatListedDate(value) {
  if (value == null || value === "") {
    return "—";
  }
  let d;
  if (Array.isArray(value) && value.length >= 3) {
    const [y, mo = 1, day = 1] = value;
    d = new Date(Number(y), Number(mo) - 1, Number(day));
  } else if (typeof value === "string") {
    d = new Date(value);
  } else {
    return "—";
  }
  if (Number.isNaN(d.getTime())) {
    return "—";
  }
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function titleCase(s) {
  if (!s) return "";
  const t = String(s).toLowerCase().replace(/_/g, " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function OwnerListingCard({ animal, apiBaseUrl, onOpenDetail, onArchiveToggle, viewerId }) {
  const imgs = ownerListingImageUrls(animal);
  const [idx, setIdx] = useState(0);
  const n = imgs.length;
  const safeIdx = n === 0 ? 0 : idx % n;
  const url =
    n > 0 ? resolveOwnerListingImageUrl(imgs[safeIdx], apiBaseUrl) : null;

  const goPrev = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (n <= 1) return;
    setIdx((i) => (i - 1 + n) % n);
  };

  const goNext = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (n <= 1) return;
    setIdx((i) => (i + 1) % n);
  };

  const openDetail = () => {
    onOpenDetail(animal.id);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openDetail();
    }
  };

  return (
    <article
      className="owner-listing-card"
      role="button"
      tabIndex={0}
      onClick={openDetail}
      onKeyDown={onKeyDown}
      aria-label={`Open profile for ${animal.name || "animal"}`}
    >
      <div className="owner-listing-carousel">
        {url ? (
          <img src={url} alt="" className="owner-listing-carousel-img" />
        ) : (
          <div className="owner-listing-carousel-placeholder" aria-hidden>
            No photo
          </div>
        )}
        {n > 1 && (
          <>
            <button
              type="button"
              className="owner-listing-nav owner-listing-nav-prev"
              onClick={goPrev}
              aria-label="Previous photo"
            >
              ‹
            </button>
            <button
              type="button"
              className="owner-listing-nav owner-listing-nav-next"
              onClick={goNext}
              aria-label="Next photo"
            >
              ›
            </button>
            <span className="owner-listing-dots" aria-hidden>
              {safeIdx + 1} / {n}
            </span>
          </>
        )}
      </div>

      <div className="owner-listing-main">
        <p className="owner-listing-code">{formatListingCode(animal)}</p>
        <h2 className="owner-listing-name">{animal.name || "Unnamed"}</h2>
        <p className="owner-listing-line">
          {titleCase(animal.animalType)} · {animal.breed || "—"}
        </p>
        <p className="owner-listing-line owner-listing-line-muted">
          {titleCase(animal.energyLevel)} energy · {titleCase(animal.ageGroup)} ·{" "}
          {titleCase(animal.size)}
        </p>
        {animal.listingStatus && (
          <span className="owner-listing-status">{String(animal.listingStatus)}</span>
        )}
        <div className="owner-listing-card-actions">
          <button
            type="button"
            className="owner-listing-archive-btn"
            onClick={(e) => {
              e.stopPropagation();
              onArchiveToggle(animal);
            }}
          >
            {String(animal.listingStatus || "").toUpperCase() === "ARCHIVED"
              ? "Restore from archive"
              : "Archive listing"}
          </button>
        </div>
      </div>

      <time className="owner-listing-date" dateTime={animal.registerTime ? String(animal.registerTime) : undefined}>
        {formatListedDate(animal.registerTime)}
      </time>
    </article>
  );
}

function OwnerListingsPage() {
  const navigate = useNavigate();
  const { showPopup } = usePopup();
  const [loading, setLoading] = useState(true);
  const [animals, setAnimals] = useState([]);
  const [tab, setTab] = useState("active");
  const apiBaseUrl = getApiBaseUrl();

  const load = useCallback(async () => {
    const user = getStoredUser();
    const uid = getResolvedUserId(user);
    if (!uid || normalizeRole(user?.role) !== "OWNER") {
      navigate("/", { replace: true });
      return;
    }
    setLoading(true);
    try {
      const list = await fetchOwnerListings(uid);
      setAnimals(list);
    } catch (e) {
      console.error(e);
      showPopup({
        type: "error",
        title: "Could not load",
        message: e?.message || "Listings could not be loaded."
      });
      setAnimals([]);
    } finally {
      setLoading(false);
    }
  }, [navigate, showPopup]);

  useEffect(() => {
    load();
  }, [load]);

  const goRegister = () => navigate("/register-animal");
  const openAnimal = (id) => navigate(`/animal/${id}`);

  const activeListings = animals.filter(
    (a) => String(a.listingStatus || "").toUpperCase() !== "ARCHIVED"
  );
  const archivedListings = animals.filter(
    (a) => String(a.listingStatus || "").toUpperCase() === "ARCHIVED"
  );
  const visible = tab === "archived" ? archivedListings : activeListings;

  const handleArchiveToggle = async (animal) => {
    const uid = getResolvedUserId(getStoredUser());
    if (uid == null) {
      return;
    }
    const isArchived =
      String(animal.listingStatus || "").toUpperCase() === "ARCHIVED";
    try {
      if (isArchived) {
        await unarchiveOwnerListing(animal.id, uid);
        showPopup({
          type: "success",
          title: "Restored",
          message: "Listing is active again and visible for matching."
        });
      } else {
        await archiveOwnerListing(animal.id, uid);
        showPopup({
          type: "success",
          title: "Archived",
          message: "Listing hidden from compatibility matching."
        });
      }
      load();
    } catch (e) {
      showPopup({
        type: "error",
        title: "Failed",
        message: e.message || "Could not update listing."
      });
    }
  };

  return (
    <div className="owner-listings-page">
      <Navbar />

      <main className="owner-listings-main">
        <header className="owner-listings-hero">
          <p className="owner-listings-tag">Your listings</p>
          <h1>Listed animals</h1>
          <p className="owner-listings-lead">
            Wide cards show each listing at a glance. Use the arrows on a photo to browse images
            before opening the full profile.
          </p>
        </header>

        <div className="owner-listings-tabs">
          <button
            type="button"
            className={tab === "active" ? "is-active" : ""}
            onClick={() => setTab("active")}
          >
            Active ({activeListings.length})
          </button>
          <button
            type="button"
            className={tab === "archived" ? "is-active" : ""}
            onClick={() => setTab("archived")}
          >
            Archive ({archivedListings.length})
          </button>
        </div>

        {loading ? (
          <p className="owner-listings-loading">Loading your animals…</p>
        ) : visible.length === 0 ? (
          <section className="owner-listings-empty">
            <p>
              {tab === "archived"
                ? "No archived listings."
                : "You have not published any active animals yet."}
            </p>
            {tab === "active" && (
              <button type="button" className="owner-listings-primary-btn" onClick={goRegister}>
                Register an animal
              </button>
            )}
          </section>
        ) : (
          <div className="owner-listings-stack">
            {visible.map((a) => (
              <OwnerListingCard
                key={a.id}
                animal={a}
                apiBaseUrl={apiBaseUrl}
                onOpenDetail={openAnimal}
                onArchiveToggle={handleArchiveToggle}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default OwnerListingsPage;
