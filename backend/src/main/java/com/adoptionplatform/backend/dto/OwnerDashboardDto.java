package com.adoptionplatform.backend.dto;

import com.adoptionplatform.backend.entity.Animal;

import java.util.ArrayList;
import java.util.List;

public class OwnerDashboardDto {

    private List<Animal> listings = new ArrayList<>();
    private List<InquiryThreadDto> inquiries = new ArrayList<>();
    private List<Long> strongMatchListingIds = new ArrayList<>();

    public List<Animal> getListings() {
        return listings;
    }

    public void setListings(List<Animal> listings) {
        this.listings = listings != null ? listings : new ArrayList<>();
    }

    public List<InquiryThreadDto> getInquiries() {
        return inquiries;
    }

    public void setInquiries(List<InquiryThreadDto> inquiries) {
        this.inquiries = inquiries != null ? inquiries : new ArrayList<>();
    }

    public List<Long> getStrongMatchListingIds() {
        return strongMatchListingIds;
    }

    public void setStrongMatchListingIds(List<Long> strongMatchListingIds) {
        this.strongMatchListingIds = strongMatchListingIds != null ? strongMatchListingIds : new ArrayList<>();
    }
}
