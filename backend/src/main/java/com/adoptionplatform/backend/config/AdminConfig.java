package com.adoptionplatform.backend.config;

import com.adoptionplatform.backend.entity.Role;
import com.adoptionplatform.backend.entity.User;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;

@Component
public class AdminConfig {

    public static final String ADMIN_EMAIL = "21soft1087@isik.edu.tr";

    private static final List<String> ADMIN_EMAILS = List.of(
            ADMIN_EMAIL,
            "iremcliik2@gmail.com"
    );

    public boolean isAdminEmail(String email) {
        if (email == null || email.isBlank()) {
            return false;
        }
        String normalized = email.trim().toLowerCase(Locale.ROOT);
        for (String admin : ADMIN_EMAILS) {
            if (admin.equalsIgnoreCase(normalized)) {
                return true;
            }
        }
        return false;
    }

    /** Admin accounts must never be removed or deactivated via API. */
    public boolean isProtectedAdmin(User user) {
        if (user == null) {
            return false;
        }
        return user.getRole() == Role.ADMIN || isAdminEmail(user.getEmail());
    }
}
