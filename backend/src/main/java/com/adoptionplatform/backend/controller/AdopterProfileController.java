package com.adoptionplatform.backend.controller;

import com.adoptionplatform.backend.dto.AdopterProfileRequest;
import com.adoptionplatform.backend.entity.AdopterProfile;
import com.adoptionplatform.backend.service.AdopterProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class AdopterProfileController {

    private final AdopterProfileService adopterProfileService;

    public AdopterProfileController(AdopterProfileService adopterProfileService) {
        this.adopterProfileService = adopterProfileService;
    }

    @PostMapping("/save")
    public ResponseEntity<AdopterProfile> saveProfile(@RequestBody AdopterProfileRequest request) {
        return ResponseEntity.ok(adopterProfileService.saveProfile(request));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<AdopterProfile> getProfile(@PathVariable Long userId) {
        AdopterProfile profile = adopterProfileService.getProfileByUserId(userId);
        if (profile == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(profile);
    }
}