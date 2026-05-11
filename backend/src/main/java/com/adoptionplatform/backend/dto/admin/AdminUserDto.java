package com.adoptionplatform.backend.dto.admin;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;

public class AdminUserDto {

    private Long id;
    private String fullName;
    private String email;
    private String location;
    private String phone;
    private String addressLine;
    private Integer birthYear;
    private String gender;
    private String role;
    private Boolean adopterProfileCompleted;
    private Boolean ownerProfileCompleted;
    private String ownerListingType;
    private boolean emailVerified;
    private boolean active = true;
    private LocalDateTime registrationTime;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
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

    public Boolean getAdopterProfileCompleted() {
        return adopterProfileCompleted;
    }

    public void setAdopterProfileCompleted(Boolean adopterProfileCompleted) {
        this.adopterProfileCompleted = adopterProfileCompleted;
    }

    public Boolean getOwnerProfileCompleted() {
        return ownerProfileCompleted;
    }

    public void setOwnerProfileCompleted(Boolean ownerProfileCompleted) {
        this.ownerProfileCompleted = ownerProfileCompleted;
    }

    public String getOwnerListingType() {
        return ownerListingType;
    }

    public void setOwnerListingType(String ownerListingType) {
        this.ownerListingType = ownerListingType;
    }

    public boolean isEmailVerified() {
        return emailVerified;
    }

    public void setEmailVerified(boolean emailVerified) {
        this.emailVerified = emailVerified;
    }

    @JsonProperty("isActive")
    public boolean isActive() {
        return active;
    }

    @JsonProperty("isActive")
    public void setActive(boolean active) {
        this.active = active;
    }

    public LocalDateTime getRegistrationTime() {
        return registrationTime;
    }

    public void setRegistrationTime(LocalDateTime registrationTime) {
        this.registrationTime = registrationTime;
    }
}
