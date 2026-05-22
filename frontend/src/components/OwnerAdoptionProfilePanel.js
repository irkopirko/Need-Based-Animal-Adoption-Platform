import React, { useEffect, useState } from "react";
import "./OwnerAdoptionProfilePanel.css";
import { fetchAdopterRequestForInquiry } from "../utils/platformApi";
import {
  buildAdoptionProfileSections,
  isSubmittedAdoptionRequest
} from "../utils/ownerAdoptionProfile";

function OwnerAdoptionProfilePanel({ inquiryId, ownerId, adopterName }) {
  const [loading, setLoading] = useState(false);
  const [request, setRequest] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!inquiryId || ownerId == null) {
      setRequest(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchAdopterRequestForInquiry(inquiryId, ownerId)
      .then((data) => {
        if (!cancelled) {
          if (data?.found === false) {
            setRequest(null);
          } else {
            setRequest(data);
          }
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message || "Could not load adoption profile");
          setRequest(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [inquiryId, ownerId]);

  if (!inquiryId || ownerId == null) {
    return null;
  }

  const submitted = isSubmittedAdoptionRequest(request);
  const sections = buildAdoptionProfileSections(request);

  return (
    <section className="owner-adoption-profile-panel" aria-labelledby="owner-adoption-profile-title">
      <div className="owner-adoption-profile-head">
        <h3 id="owner-adoption-profile-title">Adoption profile</h3>
        {adopterName && <p className="owner-adoption-profile-adopter">Submitted by {adopterName}</p>}
      </div>

      {loading && <p className="owner-adoption-profile-muted">Loading profile…</p>}

      {!loading && error && (
        <p className="owner-adoption-profile-error">{error}</p>
      )}

      {!loading && !error && !request && (
        <p className="owner-adoption-profile-muted">
          This adopter has not created an adoption request yet.
        </p>
      )}

      {!loading && !error && request && !submitted && (
        <p className="owner-adoption-profile-muted">
          The adoption questionnaire is still a draft and has not been submitted. You can still
          read their message, but full profile details appear after submission.
        </p>
      )}

      {!loading && !error && request && submitted && (
        <>
          <p className="owner-adoption-profile-lead">
            Review this profile before you accept or decline the message request. Accepting does
            not change what you see here — it only marks the conversation as approved.
          </p>
          {request.requestTime && (
            <p className="owner-adoption-profile-meta">
              Submitted {new Date(request.requestTime).toLocaleString()}
            </p>
          )}
          <div className="owner-adoption-profile-sections">
            {sections.map((section) => (
              <div key={section.title} className="owner-adoption-profile-section">
                <h4>{section.title}</h4>
                <dl className="owner-adoption-profile-grid">
                  {section.rows.map(([label, value]) => (
                    <div key={label} className="owner-adoption-profile-row">
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default OwnerAdoptionProfilePanel;
