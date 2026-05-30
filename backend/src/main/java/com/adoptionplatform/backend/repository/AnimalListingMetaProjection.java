package com.adoptionplatform.backend.repository;

/**
 * Minimal animal fields for inquiry thread list rows.
 */
public interface AnimalListingMetaProjection {

    Long getId();

    String getName();

    String getCoverImageUrl();
}
