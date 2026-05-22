package com.adoptionplatform.backend.dto.admin;

public class AdminStatsDto {

    private long totalUsers;
    private long totalAnimals;
    private long totalAdoptionRequests;
    private long totalCompletedAdoptions;
    private long totalSuccessfulLogins;
    private long totalFailedLogins;

    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getTotalAnimals() {
        return totalAnimals;
    }

    public void setTotalAnimals(long totalAnimals) {
        this.totalAnimals = totalAnimals;
    }

    public long getTotalAdoptionRequests() {
        return totalAdoptionRequests;
    }

    public void setTotalAdoptionRequests(long totalAdoptionRequests) {
        this.totalAdoptionRequests = totalAdoptionRequests;
    }

    public long getTotalCompletedAdoptions() {
        return totalCompletedAdoptions;
    }

    public void setTotalCompletedAdoptions(long totalCompletedAdoptions) {
        this.totalCompletedAdoptions = totalCompletedAdoptions;
    }

    public long getTotalSuccessfulLogins() {
        return totalSuccessfulLogins;
    }

    public void setTotalSuccessfulLogins(long totalSuccessfulLogins) {
        this.totalSuccessfulLogins = totalSuccessfulLogins;
    }

    public long getTotalFailedLogins() {
        return totalFailedLogins;
    }

    public void setTotalFailedLogins(long totalFailedLogins) {
        this.totalFailedLogins = totalFailedLogins;
    }
}
