package com.adoptionplatform.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    private String location;
    private String phone;

    @Column(length = 2000)
    private String addressLine;

    private Integer birthYear;

    @Column(length = 32)
    private String gender;

    @Column(name = "adopter_profile_completed")
    private Boolean adopterProfileCompleted;

    @Column(name = "owner_profile_completed")
    private Boolean ownerProfileCompleted;

    @Column(name = "owner_listing_type", length = 32)
    private String ownerListingType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(name = "emailVerified")
    private boolean emailVerified = false;

    private String emailVerificationCode;
    private Long emailVerificationExpiresAt;

    private LocalDateTime registrationTime;

    public User() {}

    public Long getId() {
        return id;
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

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
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

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public boolean isEmailVerified() {
        return emailVerified;
    }

    public void setEmailVerified(boolean emailVerified) {
        this.emailVerified = emailVerified;
    }

    public String getEmailVerificationCode() {
        return emailVerificationCode;
    }

    public void setEmailVerificationCode(String emailVerificationCode) {
        this.emailVerificationCode = emailVerificationCode;
    }

    public Long getEmailVerificationExpiresAt() {
        return emailVerificationExpiresAt;
    }

    public void setEmailVerificationExpiresAt(Long emailVerificationExpiresAt) {
        this.emailVerificationExpiresAt = emailVerificationExpiresAt;
    }

    public LocalDateTime getRegistrationTime() {
        return registrationTime;
    }

    public void setRegistrationTime(LocalDateTime registrationTime) {
        this.registrationTime = registrationTime;
    }
}