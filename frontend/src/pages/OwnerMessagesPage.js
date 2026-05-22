import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./OwnerMessagesPage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getResolvedUserId, getStoredUser, normalizeRole } from "../utils/auth";
import {
  loadOwnerEngagementState,
  normalizeAnimalFromApi,
  resolveOwnerScenario,
  formatInquiryDate,
  getInquiryPreviewFromMessages,
  PAVIA_OWNER_ENGAGEMENT_UPDATED,
  STRONG_MATCH_THRESHOLD,
  resolveOwnerListingImageUrl
} from "../utils/ownerJourney";
import { getApiBaseUrl } from "../utils/auth";
import OwnerListingPicker from "../components/OwnerListingPicker";
import OwnerInquiryThreadPanel from "../components/OwnerInquiryThreadPanel";

function Gate({ badge, title, body, primaryLabel, onPrimary, secondaryLabel, onSecondary }) {
  return (
    <div className="owner-messages-page">
      <Navbar />
      <main className="owner-messages-locked-main">
        <div className="owner-messages-locked-card owner-messages-locked-card-wide">
          <span className="owner-messages-badge">{badge}</span>
          <h1>{title}</h1>
          <p>{body}</p>
          <button type="button" className="owner-primary-btn" onClick={onPrimary}>
            {primaryLabel}
          </button>
          {secondaryLabel && onSecondary && (
            <button
              type="button"
              className="owner-secondary-outline-btn"
              onClick={onSecondary}
            >
              {secondaryLabel}
            </button>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function OwnerMessagesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [scenario, setScenario] = useState("NO_LISTINGS");
  const [inquiries, setInquiries] = useState([]);
  const [listings, setListings] = useState([]);
  const [matchedListings, setMatchedListings] = useState([]);
  const [selectedListingId, setSelectedListingId] = useState(null);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [focusedAnimal, setFocusedAnimal] = useState(null);
  const [focusedAnimalError, setFocusedAnimalError] = useState(false);

  const user = getStoredUser();
  const ownerId = getResolvedUserId(user);
  const apiBase = getApiBaseUrl();

  const focusedAnimalId = useMemo(() => {
    const raw = searchParams.get("animalId");
    if (raw == null || !/^\d+$/.test(String(raw).trim())) {
      return null;
    }
    return Number(raw);
  }, [searchParams]);

  const refresh = useCallback(async () => {
    if (ownerId == null || normalizeRole(user?.role) !== "OWNER") {
      setScenario("NOT_OWNER");
      setInquiries([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await loadOwnerEngagementState(ownerId);
      const scen = resolveOwnerScenario({
        hasListings: data.hasListings,
        hasStrongMatchOnListings: data.hasStrongMatchOnListings,
        hasInquiries: data.hasInquiries,
        hasAnyMessages: data.hasAnyMessages
      });
      setScenario(scen);
      const list = Array.isArray(data.inquiries) ? data.inquiries : [];
      setInquiries(list);
      setListings(data.listings || []);
      setMatchedListings(
        data.matchedListings?.length ? data.matchedListings : data.listings || []
      );

      if (focusedAnimalId != null) {
        setSelectedListingId(focusedAnimalId);
      }

      if (scen === "INQUIRY_NO_MESSAGES" || scen === "FULL" || focusedAnimalId != null) {
        const sorted = [...list].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        const scoped =
          focusedAnimalId != null
            ? sorted.filter((i) => Number(i.animalId) === focusedAnimalId)
            : sorted;
        const fromUrl = searchParams.get("inquiry");
        const pick =
          scoped.find((i) => String(i.id) === String(fromUrl)) || scoped[0] || null;
        setSelectedChatId(pick?.id ?? null);
        if (focusedAnimalId != null) {
          setSelectedListingId(focusedAnimalId);
        } else if (pick?.animalId != null) {
          setSelectedListingId(Number(pick.animalId));
        }
      } else {
        setSelectedChatId(null);
        if (focusedAnimalId == null) {
          setSelectedListingId(null);
        }
      }
    } catch (e) {
      console.error(e);
      setScenario("NO_LISTINGS");
      setInquiries([]);
    } finally {
      setLoading(false);
    }
  }, [ownerId, user?.role, searchParams, focusedAnimalId]);

  useEffect(() => {
    if (focusedAnimalId == null || ownerId == null) {
      setFocusedAnimal(null);
      setFocusedAnimalError(false);
      return undefined;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${apiBase}/api/animals/${focusedAnimalId}`);
        if (!res.ok) {
          if (!cancelled) {
            setFocusedAnimal(null);
            setFocusedAnimalError(true);
          }
          return;
        }
        const data = normalizeAnimalFromApi(await res.json());
        if (Number(data.ownerId) !== Number(ownerId)) {
          if (!cancelled) {
            setFocusedAnimal(null);
            setFocusedAnimalError(true);
          }
          return;
        }
        if (!cancelled) {
          setFocusedAnimal(data);
          setFocusedAnimalError(false);
          setSelectedListingId(focusedAnimalId);
        }
      } catch {
        if (!cancelled) {
          setFocusedAnimal(null);
          setFocusedAnimalError(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [focusedAnimalId, ownerId, apiBase]);

  useEffect(() => {
    refresh();
    const fn = () => refresh();
    window.addEventListener(PAVIA_OWNER_ENGAGEMENT_UPDATED, fn);
    return () => window.removeEventListener(PAVIA_OWNER_ENGAGEMENT_UPDATED, fn);
  }, [refresh]);

  const filteredInquiries = useMemo(() => {
    let list = [...inquiries];
    if (selectedListingId != null) {
      list = list.filter((i) => Number(i.animalId) === selectedListingId);
    }
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [inquiries, selectedListingId]);

  useEffect(() => {
    if (filteredInquiries.length === 0) {
      setSelectedChatId(null);
      return;
    }
    if (!filteredInquiries.some((i) => i.id === selectedChatId)) {
      setSelectedChatId(filteredInquiries[0]?.id ?? null);
    }
  }, [filteredInquiries, selectedChatId]);

  const conversations = useMemo(
    () =>
      filteredInquiries.map((inq) => ({
        id: inq.id,
        adopterName: inq.adopterName,
        animalName: inq.animalName,
        animalId: inq.animalId,
        listingCode: inq.listingCode,
        animalImageUrl: inq.animalImageUrl
          ? resolveOwnerListingImageUrl(inq.animalImageUrl, apiBase)
          : "",
        preview: inq.initialMessage || getInquiryPreviewFromMessages(inq),
        time: formatInquiryDate(inq.createdAt),
        status: inq.status
      })),
    [filteredInquiries, apiBase]
  );

  const pickerListings =
    matchedListings.length > 0 ? matchedListings : listings;

  const animalFocusMode = focusedAnimalId != null && focusedAnimal != null;
  const animalFocusEmpty =
    animalFocusMode && conversations.length === 0 && !loading;

  if (loading) {
    return (
      <div className="owner-messages-page">
        <Navbar />
        <main className="owner-messages-locked-main">
          <p className="owner-messages-loading-msg">Loading…</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (focusedAnimalId != null && (focusedAnimalError || !focusedAnimal)) {
    return (
      <Gate
        badge="Unavailable"
        title="Messages for this listing"
        body="You can only view messages for your own listings."
        primaryLabel="My listings"
        onPrimary={() => navigate("/owner-listings")}
        secondaryLabel="Owner home"
        onSecondary={() => navigate("/ownerhomepage")}
      />
    );
  }

  if (!animalFocusMode && scenario === "NOT_OWNER") {
    return (
      <Gate
        badge="Owners only"
        title="Messages"
        body="Sign in with an owner or shelter account to use this inbox."
        primaryLabel="Sign in"
        onPrimary={() => navigate("/login")}
      />
    );
  }

  if (!animalFocusMode && scenario === "NO_LISTINGS") {
    return (
      <Gate
        badge="No listings"
        title="Register an animal first"
        body="Messaging opens after you have at least one listing. When adopters reach out, threads are stored in the database."
        primaryLabel="Register animal"
        onPrimary={() => navigate("/register-animal")}
        secondaryLabel="Owner home"
        onSecondary={() => navigate("/ownerhomepage")}
      />
    );
  }

  if (!animalFocusMode && scenario === "LISTINGS_NO_STRONG_MATCH") {
    return (
      <Gate
        badge="No strong matches on your listings"
        title="None of your animals appear in adopters’ strong-match results yet"
        body={`Adopters only see animals at ${STRONG_MATCH_THRESHOLD}% compatibility or higher. None of your current listings are in that pool right now.`}
        primaryLabel="View my listings"
        onPrimary={() => navigate("/ownerhomepage")}
        secondaryLabel="Manage requests"
        onSecondary={() => navigate("/owner-requests")}
      />
    );
  }

  if (!animalFocusMode && scenario === "STRONG_MATCH_NO_INQUIRY") {
    return (
      <Gate
        badge="No inquiries yet"
        title="Strong matches exist, but no inquiries"
        body="When an adopter uses Get in contact on a listing, the conversation is saved here for both sides."
        primaryLabel="Manage requests"
        onPrimary={() => navigate("/owner-requests")}
        secondaryLabel="Owner home"
        onSecondary={() => navigate("/ownerhomepage")}
      />
    );
  }

  return (
    <div className="owner-messages-page">
      <Navbar />

      <main className="owner-messages-main">
        <section className="owner-messages-hero">
          <div className="owner-messages-hero-left">
            <p className="owner-messages-tag">Messages</p>
            {animalFocusMode ? (
              <>
                <h1>Messages for {focusedAnimal.name || "this listing"}</h1>
                <p>
                  Conversations from adopters who contacted you about this animal. When someone
                  sends a message request from your listing page, it appears here.
                </p>
                <button
                  type="button"
                  className="owner-secondary-outline-btn owner-messages-back-listing-btn"
                  onClick={() => navigate(`/animal/${focusedAnimalId}`)}
                >
                  Back to listing
                </button>
              </>
            ) : (
              <>
                <h1>Inbox — adopter message requests</h1>
                <p>
                  Choose a matching listing (≥ {STRONG_MATCH_THRESHOLD}% compatibility), open a
                  request, review the adoption profile, approve if you want to chat, and reply here.
                </p>
              </>
            )}
          </div>
        </section>

        <section
          className={`owner-messages-layout ${
            animalFocusMode
              ? "owner-messages-layout-duo"
              : "owner-messages-layout-triple"
          }`}
        >
          {!animalFocusMode && (
            <div className="owner-listings-filter-panel">
              <h2>Matching listings</h2>
              <p>Animals adopters contacted you about</p>
              <OwnerListingPicker
                listings={pickerListings}
                inquiries={inquiries}
                selectedListingId={selectedListingId}
                onSelectListing={setSelectedListingId}
              />
            </div>
          )}

          <div className="owner-conversation-panel">
            <h2>Message requests</h2>
            <p className="owner-conversation-panel-hint">
              {animalFocusMode
                ? focusedAnimal.name || "This listing"
                : selectedListingId == null
                  ? "All listings"
                  : conversations[0]?.animalName || "This listing"}
            </p>
            <div className="owner-conversation-list">
              {conversations.length === 0 ? (
                <div className="owner-messages-animal-empty" role="status">
                  <p className="owner-messages-animal-empty-title">No message requests yet</p>
                  <p className="owner-messages-animal-empty-body">
                    {animalFocusMode
                      ? `This listing has not received any adopter message requests yet. When a strong match uses Message owner on ${focusedAnimal.name || "this animal"}'s profile, the conversation will show up here.`
                      : "No requests for this listing yet."}
                  </p>
                </div>
              ) : (
                conversations.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`owner-conversation-card ${
                      selectedChatId === c.id ? "owner-conversation-card-active" : ""
                    }`}
                    onClick={() => setSelectedChatId(c.id)}
                  >
                    {c.animalImageUrl ? (
                      <img
                        src={c.animalImageUrl}
                        alt=""
                        className="owner-conversation-thumb"
                      />
                    ) : (
                      <span
                        className="owner-conversation-avatar-placeholder"
                        aria-hidden
                      />
                    )}
                    <div className="owner-conversation-content">
                      {c.listingCode && (
                        <p className="owner-conversation-listing-id">{c.listingCode}</p>
                      )}
                      <h3>{c.adopterName}</h3>
                      <p className="owner-conversation-adopter-line">
                        About {c.animalName}
                      </p>
                      <span className="owner-conversation-preview">{c.preview}</span>
                      <span className="owner-conversation-status-pill">{c.status}</span>
                    </div>
                    <span className="owner-conversation-time">{c.time}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="owner-chat-panel">
            {animalFocusEmpty ? (
              <p className="owner-chat-empty-select owner-messages-animal-empty-thread">
                Select a message request when one arrives for this listing.
              </p>
            ) : (
              <OwnerInquiryThreadPanel
                inquiryId={selectedChatId}
                ownerId={ownerId}
                onUpdated={refresh}
              />
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default OwnerMessagesPage;
