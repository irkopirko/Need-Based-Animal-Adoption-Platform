package com.adoptionplatform.backend.controller;

import com.adoptionplatform.backend.dto.AdopterHomeSummaryDto;
import com.adoptionplatform.backend.service.AdopterHomeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/adopters")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173"
})
public class AdopterController {

    private final AdopterHomeService adopterHomeService;

    public AdopterController(AdopterHomeService adopterHomeService) {
        this.adopterHomeService = adopterHomeService;
    }

    @GetMapping("/{userId}/home-summary")
    public ResponseEntity<AdopterHomeSummaryDto> homeSummary(@PathVariable Long userId) {
        return ResponseEntity.ok(adopterHomeService.loadSummary(userId));
    }
}
