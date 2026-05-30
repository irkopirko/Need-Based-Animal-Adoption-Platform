package com.adoptionplatform.backend.dto;

import java.util.ArrayList;
import java.util.List;

/** Lightweight adopter dashboard payload (counts only, no full adoption request bodies). */
public class AdopterHomeSummaryDto {

    private List<AdoptionRequestPhaseDto> requests = new ArrayList<>();
    private int submittedRequestCount;
    private int draftRequestCount;
    private int strongMatchCount;
    private int savedCount;
    private Long primarySubmittedRequestId;

    public List<AdoptionRequestPhaseDto> getRequests() {
        return requests;
    }

    public void setRequests(List<AdoptionRequestPhaseDto> requests) {
        this.requests = requests != null ? requests : new ArrayList<>();
    }

    public int getSubmittedRequestCount() {
        return submittedRequestCount;
    }

    public void setSubmittedRequestCount(int submittedRequestCount) {
        this.submittedRequestCount = submittedRequestCount;
    }

    public int getDraftRequestCount() {
        return draftRequestCount;
    }

    public void setDraftRequestCount(int draftRequestCount) {
        this.draftRequestCount = draftRequestCount;
    }

    public int getStrongMatchCount() {
        return strongMatchCount;
    }

    public void setStrongMatchCount(int strongMatchCount) {
        this.strongMatchCount = strongMatchCount;
    }

    public int getSavedCount() {
        return savedCount;
    }

    public void setSavedCount(int savedCount) {
        this.savedCount = savedCount;
    }

    public Long getPrimarySubmittedRequestId() {
        return primarySubmittedRequestId;
    }

    public void setPrimarySubmittedRequestId(Long primarySubmittedRequestId) {
        this.primarySubmittedRequestId = primarySubmittedRequestId;
    }
}
