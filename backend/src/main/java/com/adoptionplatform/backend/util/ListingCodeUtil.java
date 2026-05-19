package com.adoptionplatform.backend.util;

public final class ListingCodeUtil {

    private ListingCodeUtil() {
    }

    public static String format(Long animalId) {
        if (animalId == null) {
            return null;
        }
        return "^PAV" + String.format("%06d", animalId);
    }
}
