package com.adoptionplatform.backend.dto;

public class OwnerDashboardSummaryDto {

    private int activeListings;
    private int pendingRequests;
    private int acceptedInquiries;
    private int adoptedCount;
    private int archivedCount;

    public int getActiveListings() {
        return activeListings;
    }

    public void setActiveListings(int activeListings) {
        this.activeListings = activeListings;
    }

    public int getPendingRequests() {
        return pendingRequests;
    }

    public void setPendingRequests(int pendingRequests) {
        this.pendingRequests = pendingRequests;
    }

    public int getAcceptedInquiries() {
        return acceptedInquiries;
    }

    public void setAcceptedInquiries(int acceptedInquiries) {
        this.acceptedInquiries = acceptedInquiries;
    }

    public int getAdoptedCount() {
        return adoptedCount;
    }

    public void setAdoptedCount(int adoptedCount) {
        this.adoptedCount = adoptedCount;
    }

    public int getArchivedCount() {
        return archivedCount;
    }

    public void setArchivedCount(int archivedCount) {
        this.archivedCount = archivedCount;
    }
}
