package com.adoptionplatform.backend.controller;

import com.adoptionplatform.backend.dto.DeleteAccountRequest;
import com.adoptionplatform.backend.dto.CompleteAdopterProfileRequest;
import com.adoptionplatform.backend.dto.CompleteOwnerProfileRequest;
import com.adoptionplatform.backend.dto.LoginRequest;
import com.adoptionplatform.backend.dto.RegisterRequest;
import com.adoptionplatform.backend.dto.UpdateProfileRequest;
import com.adoptionplatform.backend.dto.UserProfileDto;
import com.adoptionplatform.backend.dto.ResendVerificationRequest;
import com.adoptionplatform.backend.dto.ResetPasswordRequest;
import com.adoptionplatform.backend.dto.Verify2FARequest;
import com.adoptionplatform.backend.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@RequestBody RegisterRequest request) {
        Map<String, String> response = authService.register(request);
        if (response.containsKey("error")) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-email")
    public ResponseEntity<Map<String, String>> verifyEmail(@RequestBody Verify2FARequest request) {
        Map<String, String> response = authService.verifyEmail(request.getEmail(), request.getCode());
        if (response.containsKey("error")) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<Map<String, String>> resendVerification(@RequestBody ResendVerificationRequest request) {
        Map<String, String> response = authService.resendVerificationCode(request.getEmail());
        if (response.containsKey("error")) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody LoginRequest request) {
        Map<String, String> response = authService.login(request);
        if (response.containsKey("error")) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-login")
    public ResponseEntity<Map<String, String>> verifyLogin(@RequestBody Verify2FARequest request) {
        Map<String, String> response = authService.verifyLoginCode(request.getEmail(), request.getCode());
        if (response.containsKey("error")) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login/resend")
    public ResponseEntity<Map<String, String>> resendLoginCode(@RequestBody ResendVerificationRequest request) {
        Map<String, String> response = authService.resendLoginCode(request.getEmail());
        if (response.containsKey("error")) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password/request")
    public ResponseEntity<Map<String, String>> requestPasswordReset(@RequestBody ResendVerificationRequest request) {
        Map<String, String> response = authService.requestPasswordResetCode(request.getEmail());
        if (response.containsKey("error")) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password/verify")
    public ResponseEntity<Map<String, String>> verifyPasswordReset(@RequestBody Verify2FARequest request) {
        Map<String, String> response = authService.verifyPasswordResetCode(request.getEmail(), request.getCode());
        if (response.containsKey("error")) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password/reset")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody ResetPasswordRequest request) {
        Map<String, String> response = authService.resetPassword(
                request.getEmail(),
                request.getNewPassword(),
                request.getConfirmPassword()
        );
        if (response.containsKey("error")) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/profile/{userId}")
    public ResponseEntity<UserProfileDto> getProfile(@PathVariable Long userId) {
        return authService.getProfileByUserId(userId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @PutMapping("/profile")
    public ResponseEntity<Map<String, String>> updateProfile(@RequestBody UpdateProfileRequest request) {
        Map<String, String> response = authService.updateProfile(request);
        if (response.containsKey("error")) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/complete-adopter-profile")
    public ResponseEntity<Map<String, String>> completeAdopterProfile(@RequestBody CompleteAdopterProfileRequest request) {
        Map<String, String> response = authService.completeAdopterProfile(request);
        if (response.containsKey("error")) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/complete-owner-profile")
    public ResponseEntity<Map<String, String>> completeOwnerProfile(@RequestBody CompleteOwnerProfileRequest request) {
        Map<String, String> response = authService.completeOwnerProfile(request);
        if (response.containsKey("error")) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/delete-account")
    public ResponseEntity<Map<String, String>> deleteAccount(@RequestBody DeleteAccountRequest request) {
        Map<String, String> response = authService.deleteAccount(request);
        if (response.containsKey("error")) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }
}