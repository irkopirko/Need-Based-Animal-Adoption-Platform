package com.adoptionplatform.backend.dto;

public class AdminModerationRequest {

    private String adminEmail;
    private String reason;

    public String getAdminEmail() {
        return adminEmail;
    }

    public void setAdminEmail(String adminEmail) {
        this.adminEmail = adminEmail;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
