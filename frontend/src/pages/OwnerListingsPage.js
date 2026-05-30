import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./OwnerListingsPage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ListingEngagementBadge from "../components/ListingEngagementBadge";
import ListingImageLightbox from "../components/ListingImageLightbox";
import ListingPhotoFrame from "../components/ListingPhotoFrame";
import { usePopup } from "../components/PopupProvider";
import {
  broadcastStoredUserRefresh,
  getApiBaseUrl,
  getResolvedUserId,
  getStoredUser,
  isOwnerProfileIncomplete,
  normalizeRole
} from "../utils/auth";
import { fetchOwnerInquiries } from "../utils/platformApi";
import {
  fetchOwnerListingCardsCached,
  fetchOwnerInquiriesCached,
  readOwnerListingsCache,
  readOwnerInquiriesCache,
  ownerListingImageUrls,
  resolveOwnerListingImageUrl,
  PAVIA_OWNER_ENGAGEMENT_UPDATED
} from "../utils/ownerJourney";
import {
  archiveOwnerListing,
  formatListingCode,
  unarchiveOwnerListing
} from "../utils/platformApi";
import {
  buildInquiryStatsByAnimalId,
  formatAnimalGenderLabel,
  formatListedDate,
  listingLifecycleKey
} from "../utils/listingDisplay";

function titleCase(s) {
  if (!s) return "";
  const t = String(s).toLowerCase().replace(/_/g, " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function OwnerListingCard({
  animal,
  apiBaseUrl,
  listMode,
  inquiryStats,
  hasStrongMatch,
  onOpenDetail,
  onArchiveToggle,
  onOpenMessages
}) {
  const imgs = ownerListingImageUrls(animal);
  const resolvedGallery = useMemo(
    () => imgs.map((src) => resolveOwnerListingImageUrl(src, apiBaseUrl)).filter(Boolean),
    [imgs, apiBaseUrl]
  );
  const [idx, setIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const n = imgs.length;
  const safeIdx = n === 0 ? 0 : idx % n;
  const statusKey = listingLifecycleKey(animal.listingStatus);
  const isArchived = statusKey === "ARCHIVED";
  const isAdopted = statusKey === "ADOPTED";
  const summaryTraits = [
    formatAnimalGenderLabel(animal.gender),
    animal.energyLevel ? `${titleCase(animal.energyLevel)} energy` : "",
    animal.ageGroup ? titleCase(animal.ageGroup) : "",
    animal.size ? titleCase(animal.size) : ""
  ].filter(Boolean);
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

  const openDetail = () => onOpenDetail(animal.id);

  const openLightbox = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (resolvedGallery.length === 0) {
      return;
    }
    setLightboxOpen(true);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openDetail();
    }
  };

  return (
    <article
      className={`owner-listing-card ${
        isArchived ? "owner-listing-card-archived" : ""
      } ${isAdopted ? "owner-listing-card-adopted" : ""}`}
      role="button"
      tabIndex={0}
      onClick={openDetail}
      onKeyDown={onKeyDown}
      aria-label={`Open profile for ${animal.name || "animal"}`}
    >
      <div className="owner-listing-carousel" onClick={(e) => e.stopPropagation()}>
        <ListingPhotoFrame
          urls={resolvedGallery}
          activeIndex={safeIdx}
          onOpenLightbox={openLightbox}
          variant="listing"
          expandHint={`View full size photo of ${animal.name || "animal"}`}
        />
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

      {lightboxOpen && (
        <ListingImageLightbox
          urls={resolvedGallery}
          startIndex={safeIdx}
          onClose={() => setLightboxOpen(false)}
          title={animal.name || "Listing photo"}
        />
      )}

      <div className="owner-listing-body">
        <div className="owner-listing-main">
          <p className="owner-listing-code">{formatListingCode(animal)}</p>
          <h2 className="owner-listing-name">{animal.name || "Unnamed"}</h2>
          <p className="owner-listing-line">
            {titleCase(animal.animalType)} · {animal.breed || "—"}
          </p>
          <p className="owner-listing-line owner-listing-line-muted">
            {summaryTraits.join(" · ")}
          </p>
          <ListingEngagementBadge
            animal={animal}
            inquiryStats={inquiryStats}
            hasStrongMatch={hasStrongMatch}
          />
        </div>

        <div className="owner-listing-side">
          <time
            className="owner-listing-date"
            dateTime={animal.registerTime ? String(animal.registerTime) : undefined}
          >
            Listed {formatListedDate(animal.registerTime)}
          </time>
          {listMode === "adopted" ? (
            <button
              type="button"
              className="owner-listing-view-btn"
              onClick={(e) => {
                e.stopPropagation();
                onOpenMessages(animal);
              }}
            >
              Messages &amp; profile
            </button>
          ) : (
            <button
              type="button"
              className="owner-listing-archive-btn"
              onClick={(e) => {
                e.stopPropagation();
                onArchiveToggle(animal);
              }}
            >
              {isArchived ? "Restore" : "Archive"}
            </button>
          )}
          <button
            type="button"
            className="owner-listing-view-btn"
            onClick={(e) => {
              e.stopPropagation();
              openDetail();
            }}
          >
            View profile
          </button>
        </div>
      </div>
    </article>
  );
}

const LISTING_TABS = new Set(["active", "adopted", "archived"]);

function listingTabFromParams(params) {
  const raw = String(params.get("tab") || "").toLowerCase();
  return LISTING_TABS.has(raw) ? raw : "active";
}

function OwnerListingsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showPopup, showConfirm } = usePopup();
  const [loading, setLoading] = useState(() => {
    const uid = getResolvedUserId(getStoredUser());
    return uid == null || !readOwnerListingsCache(uid);
  });
  const [animals, setAnimals] = useState(() => {
    const uid = getResolvedUserId(getStoredUser());
    const cached = uid != null ? readOwnerListingsCache(uid) : null;
    return cached && cached.length > 0 ? cached : [];
  });
  const [inquiries, setInquiries] = useState(() => {
    const uid = getResolvedUserId(getStoredUser());
    return uid != null ? readOwnerInquiriesCache(uid) || [] : [];
  });
  const [strongMatchIds, setStrongMatchIds] = useState(() => new Set());
  const [tab, setTab] = useState(() => listingTabFromParams(searchParams));
  const apiBaseUrl = getApiBaseUrl();

  useEffect(() => {
    setTab(listingTabFromParams(searchParams));
  }, [searchParams]);

  const selectTab = (nextTab) => {
    setTab(nextTab);
    if (nextTab === "active") {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ tab: nextTab }, { replace: true });
    }
  };

  useEffect(() => {
    const user = getStoredUser();
    const uid = getResolvedUserId(user);
    if (!uid || normalizeRole(user?.role) !== "OWNER") {
      navigate("/", { replace: true });
      return undefined;
    }
    if (isOwnerProfileIncomplete(user)) {
      navigate("/complete-owner-profile", { replace: true });
      return undefined;
    }

    let cancelled = false;
    fetch(`${apiBaseUrl}/api/auth/profile/${uid}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((profile) => {
        if (cancelled || !profile) {
          return;
        }
        const prev = getStoredUser() || {};
        localStorage.setItem(
          "paviaUser",
          JSON.stringify({
            ...prev,
            ownerProfileCompleted: profile.ownerProfileCompleted,
            ownerListingType: profile.ownerListingType || ""
          })
        );
        broadcastStoredUserRefresh();
        if (!profile.ownerProfileCompleted) {
          navigate("/complete-owner-profile", { replace: true });
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, navigate]);

  const load = useCallback(async () => {
    const user = getStoredUser();
    const uid = getResolvedUserId(user);
    if (!uid || normalizeRole(user?.role) !== "OWNER") {
      navigate("/", { replace: true });
      return;
    }
    const cachedListings = readOwnerListingsCache(uid);
    const cachedInquiries = readOwnerInquiriesCache(uid);
    if (cachedListings && cachedListings.length > 0) {
      setAnimals(cachedListings);
      if (cachedInquiries) {
        setInquiries(cachedInquiries);
      }
      setLoading(false);
    } else {
      setLoading(true);
    }
    try {
      const [allListings, inquiriesRaw] = await Promise.all([
        fetchOwnerListingCardsCached(uid),
        fetchOwnerInquiriesCached(uid)
      ]);
      setAnimals(Array.isArray(allListings) ? allListings : []);
      setInquiries(Array.isArray(inquiriesRaw) ? inquiriesRaw : []);
      const openIds = new Set(
        (allListings || [])
          .filter((a) => {
            const s = listingLifecycleKey(a.listingStatus);
            return s !== "ARCHIVED" && s !== "ADOPTED";
          })
          .map((a) => Number(a.id))
      );
      const withInquiry = new Set(
        (inquiriesRaw || [])
          .map((i) => Number(i.animalId))
          .filter((id) => openIds.has(id))
      );
      setStrongMatchIds(withInquiry);
    } catch (e) {
      console.error(e);
      if (!cachedListings) {
        showPopup({
          type: "error",
          title: "Could not load",
          message: e?.message || "Listings could not be loaded."
        });
        setAnimals([]);
        setInquiries([]);
        setStrongMatchIds(new Set());
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, showPopup]);

  useEffect(() => {
    load();
    const onRefresh = () => load();
    window.addEventListener(PAVIA_OWNER_ENGAGEMENT_UPDATED, onRefresh);
    return () => window.removeEventListener(PAVIA_OWNER_ENGAGEMENT_UPDATED, onRefresh);
  }, [load]);

  const inquiryStatsByAnimalId = useMemo(
    () => buildInquiryStatsByAnimalId(inquiries),
    [inquiries]
  );

  const activeListings = animals.filter((a) => {
    const s = listingLifecycleKey(a.listingStatus);
    return s !== "ARCHIVED" && s !== "ADOPTED";
  });
  const adoptedListings = animals.filter(
    (a) => listingLifecycleKey(a.listingStatus) === "ADOPTED"
  );
  const archivedListings = animals.filter(
    (a) => listingLifecycleKey(a.listingStatus) === "ARCHIVED"
  );
  const visible =
    tab === "adopted"
      ? adoptedListings
      : tab === "archived"
        ? archivedListings
        : activeListings;

  const openMessagesForListing = (animal) => {
    navigate(`/animal/${animal.id}/requests`);
  };

  const handleArchiveToggle = async (animal) => {
    const uid = getResolvedUserId(getStoredUser());
    if (uid == null) {
      return;
    }
    const isArchived =
      String(animal.listingStatus || "").toUpperCase() === "ARCHIVED";
    if (!isArchived) {
      const ok = await showConfirm({
        type: "warning",
        title: "Archive this listing?",
        message: `${animal.name || "This listing"} will be hidden from compatibility matching. You can restore it later from Archived.`,
        confirmLabel: "Archive",
        cancelLabel: "Cancel"
      });
      if (!ok) {
        return;
      }
    }
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
          message:
            "Listing hidden from compatibility matching. A confirmation email was sent to your account."
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
          <div className="owner-listings-hero-text">
            <p className="owner-listings-tag">Your listings</p>
            <h1>My animal listings</h1>
            <p className="owner-listings-lead">
              Browse photos, archive listings you no longer promote, and open any card for
              the full animal profile.
            </p>
          </div>
          <div className="owner-listings-hero-actions">
            <button
              type="button"
              className="owner-listings-secondary-btn"
              onClick={() => navigate("/ownerhomepage")}
            >
              Dashboard
            </button>
            <button
              type="button"
              className="owner-listings-primary-btn"
              onClick={() => navigate("/register-animal")}
            >
              + Register animal
            </button>
          </div>
        </header>

        <div className="owner-listings-tabs" role="tablist" aria-label="Listing filters">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "active"}
            className={tab === "active" ? "is-active" : ""}
            onClick={() => selectTab("active")}
          >
            Active ({activeListings.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "adopted"}
            className={tab === "adopted" ? "is-active" : ""}
            onClick={() => selectTab("adopted")}
          >
            Adopted ({adoptedListings.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "archived"}
            className={tab === "archived" ? "is-active" : ""}
            onClick={() => selectTab("archived")}
          >
            Archived ({archivedListings.length})
          </button>
        </div>

        {loading ? (
          <p className="owner-listings-loading">Loading your animals…</p>
        ) : visible.length === 0 ? (
          <section className="owner-listings-empty">
            <p>
              {tab === "archived"
                ? "No archived listings."
                : tab === "adopted"
                  ? "No adopted listings yet. Mark an adoption complete from Messages when a match is finalized."
                  : "You have not published any active animals yet."}
            </p>
            {tab === "active" && (
              <button
                type="button"
                className="owner-listings-primary-btn"
                onClick={() => navigate("/register-animal")}
              >
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
                listMode={tab}
                inquiryStats={inquiryStatsByAnimalId.get(Number(a.id))}
                hasStrongMatch={strongMatchIds.has(Number(a.id))}
                onOpenDetail={(id) => navigate(`/animal/${id}`)}
                onArchiveToggle={handleArchiveToggle}
                onOpenMessages={openMessagesForListing}
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
