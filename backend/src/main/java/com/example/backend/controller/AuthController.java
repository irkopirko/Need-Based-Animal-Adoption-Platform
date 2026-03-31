package com.example.backend.controller;

import com.example.backend.dto.RegisterRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> registerUser(@RequestBody RegisterRequest request) {

        System.out.println("New register request came in");
        System.out.println("Role: " + request.getRole());
        System.out.println("Name: " + request.getFullName());
        System.out.println("Email: " + request.getEmail());
        System.out.println("Location: " + request.getLocation());
        System.out.println("Phone: " + request.getPhone());

        Map<String, String> response = new HashMap<>();
        response.put("message", "Register request received successfully");
        response.put("role", request.getRole());

        return ResponseEntity.ok(response);
    }
}