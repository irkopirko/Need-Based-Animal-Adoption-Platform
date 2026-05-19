package com.adoptionplatform.backend.config;

import org.springframework.stereotype.Component;

@Component
public class AdminConfig {

    public static final String ADMIN_EMAIL = "21soft1087@isik.edu.tr";

    public boolean isAdminEmail(String email) {
        if (email == null || email.isBlank()) {
            return false;
        }
        return ADMIN_EMAIL.equalsIgnoreCase(email.trim());
    }
}
