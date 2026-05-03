package com.adoptionplatform.backend.dto;

public class UserProfileDto {

    private Long userId;
    private String fullName;
    private String email;
    private String phone;
    private String location;
    private String addressLine;
    private Integer birthYear;
    private String gender;
    private String role;
    private boolean adopterProfileCompleted;
    private boolean ownerProfileCompleted;
    private String ownerListingType;
    private boolean hasDraftAdoptionRequest;

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getAddressLine() {
        return addressLine;
    }

    public void setAddressLine(String addressLine) {
        this.addressLine = addressLine;
    }

    public Integer getBirthYear() {
        return birthYear;
    }

    public void setBirthYear(Integer birthYear) {
        this.birthYear = birthYear;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public boolean isAdopterProfileCompleted() {
        return adopterProfileCompleted;
    }

    public void setAdopterProfileCompleted(boolean adopterProfileCompleted) {
        this.adopterProfileCompleted = adopterProfileCompleted;
    }

    public boolean isOwnerProfileCompleted() {
        return ownerProfileCompleted;
    }

    public void setOwnerProfileCompleted(boolean ownerProfileCompleted) {
        this.ownerProfileCompleted = ownerProfileCompleted;
    }

    public String getOwnerListingType() {
        return ownerListingType;
    }

    public void setOwnerListingType(String ownerListingType) {
        this.ownerListingType = ownerListingType;
    }

    public boolean isHasDraftAdoptionRequest() {
        return hasDraftAdoptionRequest;
    }

    public void setHasDraftAdoptionRequest(boolean hasDraftAdoptionRequest) {
        this.hasDraftAdoptionRequest = hasDraftAdoptionRequest;
    }
}
