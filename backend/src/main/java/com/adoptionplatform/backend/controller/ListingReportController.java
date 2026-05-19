package com.adoptionplatform.backend.controller;

import com.adoptionplatform.backend.dto.CreateListingReportRequest;
import com.adoptionplatform.backend.entity.ListingReport;
import com.adoptionplatform.backend.service.ListingReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class ListingReportController {

    private final ListingReportService listingReportService;

    public ListingReportController(ListingReportService listingReportService) {
        this.listingReportService = listingReportService;
    }

    @PostMapping
    public ResponseEntity<?> submit(@RequestBody CreateListingReportRequest request) {
        try {
            ListingReport saved = listingReportService.submitReport(request);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }
}
