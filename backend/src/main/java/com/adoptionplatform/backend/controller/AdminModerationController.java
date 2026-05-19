package com.adoptionplatform.backend.controller;

import com.adoptionplatform.backend.dto.AdminModerationRequest;
import com.adoptionplatform.backend.dto.ListingReportViewDto;
import com.adoptionplatform.backend.service.ListingReportService;
import com.adoptionplatform.backend.service.ModerationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/moderation")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class AdminModerationController {

    private final ModerationService moderationService;
    private final ListingReportService listingReportService;

    public AdminModerationController(
            ModerationService moderationService,
            ListingReportService listingReportService
    ) {
        this.moderationService = moderationService;
        this.listingReportService = listingReportService;
    }

    @GetMapping("/reports")
    public ResponseEntity<?> pendingReports(@RequestParam String adminEmail) {
        try {
            moderationService.assertAdmin(adminEmail);
            List<ListingReportViewDto> reports = listingReportService.listPendingReports();
            return ResponseEntity.ok(reports);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(403).body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/reports/{reportId}/resolve")
    public ResponseEntity<?> resolveReport(
            @PathVariable Long reportId,
            @RequestParam String adminEmail
    ) {
        try {
            moderationService.assertAdmin(adminEmail);
            listingReportService.markResolved(reportId);
            return ResponseEntity.ok(Map.of("message", "Report marked resolved"));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/listings/{animalId}/archive")
    public ResponseEntity<?> archiveListing(
            @PathVariable Long animalId,
            @RequestBody AdminModerationRequest body
    ) {
        try {
            moderationService.assertAdmin(body.getAdminEmail());
            return ResponseEntity.ok(moderationService.adminArchiveListing(
                    animalId, body.getAdminEmail(), body.getReason()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/listings/{animalId}/delete")
    public ResponseEntity<?> deleteListing(
            @PathVariable Long animalId,
            @RequestBody AdminModerationRequest body
    ) {
        try {
            moderationService.assertAdmin(body.getAdminEmail());
            moderationService.adminDeleteListing(animalId, body.getAdminEmail(), body.getReason());
            return ResponseEntity.ok(Map.of("message", "Listing deleted"));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }
}
