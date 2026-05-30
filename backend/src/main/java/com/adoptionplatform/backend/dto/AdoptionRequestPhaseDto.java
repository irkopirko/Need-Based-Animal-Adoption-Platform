package com.adoptionplatform.backend.dto;

public class AdoptionRequestPhaseDto {

    private Long id;
    private String requestPhase;

    public AdoptionRequestPhaseDto() {
    }

    public AdoptionRequestPhaseDto(Long id, String requestPhase) {
        this.id = id;
        this.requestPhase = requestPhase;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRequestPhase() {
        return requestPhase;
    }

    public void setRequestPhase(String requestPhase) {
        this.requestPhase = requestPhase;
    }
}
