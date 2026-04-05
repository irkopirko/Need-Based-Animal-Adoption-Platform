package com.adoptionplatform.backend.service;

import com.adoptionplatform.backend.dto.LoginRequest;
import com.adoptionplatform.backend.dto.RegisterRequest;
import com.adoptionplatform.backend.entity.User;
import com.adoptionplatform.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public Map<String, String> register(RegisterRequest request) {
        Map<String, String> response = new HashMap<>();

        Optional<User> existingUser = userRepository.findByEmail(request.getEmail());

        if (existingUser.isPresent()) {
            response.put("error", "Email is already registered");
            return response;
        }

        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword());
        user.setLocation(request.getLocation());
        user.setPhone(request.getPhone());
        user.setRole(request.getRole());

        userRepository.save(user);

        response.put("message", "User registered successfully");
        response.put("role", user.getRole());
        return response;
    }

    public Map<String, String> login(LoginRequest request) {
        Map<String, String> response = new HashMap<>();

        Optional<User> userOptional = userRepository.findByEmail(request.getEmail());

        if (userOptional.isEmpty()) {
            response.put("error", "User not found");
            return response;
        }

        User user = userOptional.get();

        if (!user.getPassword().equals(request.getPassword())) {
            response.put("error", "Wrong password");
            return response;
        }

        response.put("message", "Login successful");
        response.put("role", user.getRole());
        response.put("fullName", user.getFullName());
        return response;
    }
}