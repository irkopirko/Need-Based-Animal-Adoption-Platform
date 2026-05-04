package com.adoptionplatform.backend.dto;

public class CompleteOwnerProfileRequest {

    private Long userId;
    private String organizationName;
    private String organizationType;
    private String address;
    private String city;
    private String district;
    private String description;
    private String phone;
    private String ownerListingType;

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getOrganizationName() { return organizationName; }
    public void setOrganizationName(String organizationName) { this.organizationName = organizationName; }

    public String getOrganizationType() { return organizationType; }
    public void setOrganizationType(String organizationType) { this.organizationType = organizationType; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getOwnerListingType() {
    return ownerListingType;
}

public void setOwnerListingType(String ownerListingType) {
    this.ownerListingType = ownerListingType;
}
}
