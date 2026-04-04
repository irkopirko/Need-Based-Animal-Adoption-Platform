package com.adoptionplatform.backend.service;

import com.adoptionplatform.backend.dto.LoginRequest;
import com.adoptionplatform.backend.dto.RegisterRequest;
import com.adoptionplatform.backend.entity.User;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class AuthService {

    // şimdilik fake user (database yok henüz)
    private User dummyUser = new User(
            1L,
            "Test User",
            "test@test.com",
            "1234",
            "ADOPTER"
    );

    public Map<String, String> register(RegisterRequest request) {
        Map<String, String> response = new HashMap<>();

        response.put("message", "User registered successfully");
        response.put("role", request.getRole());

        return response;
    }

    public Map<String, String> login(LoginRequest request) {
        Map<String, String> response = new HashMap<>();

        if (request.getEmail().equals(dummyUser.getEmail()) &&
                request.getPassword().equals(dummyUser.getPassword())) {

            response.put("message", "Login successful");
            response.put("role", dummyUser.getRole());

        } else {
            response.put("message", "Invalid credentials");
        }

        return response;
    }
}