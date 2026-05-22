package com.adoptionplatform.backend.controller;

import com.adoptionplatform.backend.dto.AdoptionCaseViewDto;
import com.adoptionplatform.backend.dto.MatchSnapshotViewDto;
import com.adoptionplatform.backend.service.AdoptionCaseService;
import com.adoptionplatform.backend.service.MatchSnapshotService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/adoptions")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173"
})
public class AdoptionCaseController {

    private final AdoptionCaseService adoptionCaseService;
    private final MatchSnapshotService matchSnapshotService;

    public AdoptionCaseController(
            AdoptionCaseService adoptionCaseService,
            MatchSnapshotService matchSnapshotService
    ) {
        this.adoptionCaseService = adoptionCaseService;
        this.matchSnapshotService = matchSnapshotService;
    }

    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<?> listForOwner(@PathVariable Long ownerId) {
        try {
            return ResponseEntity.ok(adoptionCaseService.listForOwner(ownerId));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/adopter/{adopterId}")
    public ResponseEntity<?> listForAdopter(@PathVariable Long adopterId) {
        try {
            return ResponseEntity.ok(adoptionCaseService.listForAdopter(adopterId));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/inquiry/{inquiryId}")
    public ResponseEntity<?> byInquiry(
            @PathVariable Long inquiryId,
            @RequestParam Long viewerId
    ) {
        try {
            return ResponseEntity.ok(adoptionCaseService.getByInquiry(inquiryId, viewerId));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/{caseId}/reserve")
    public ResponseEntity<?> reserve(
            @PathVariable Long caseId,
            @RequestParam Long ownerId
    ) {
        try {
            AdoptionCaseViewDto dto = adoptionCaseService.reserveForAdopter(caseId, ownerId);
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/{caseId}/complete")
    public ResponseEntity<?> complete(
            @PathVariable Long caseId,
            @RequestParam Long ownerId
    ) {
        try {
            AdoptionCaseViewDto dto = adoptionCaseService.completeAdoption(caseId, ownerId);
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/{caseId}/cancel")
    public ResponseEntity<?> cancel(
            @PathVariable Long caseId,
            @RequestParam Long ownerId,
            @RequestParam(required = false) String reason
    ) {
        try {
            return ResponseEntity.ok(adoptionCaseService.cancelCase(caseId, ownerId, reason));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/animals/{animalId}/matches")
    public ResponseEntity<?> matchesForListing(
            @PathVariable Long animalId,
            @RequestParam Long ownerId
    ) {
        try {
            List<MatchSnapshotViewDto> list = matchSnapshotService.listForOwnerAnimal(animalId, ownerId);
            return ResponseEntity.ok(list);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/match-snapshots/refresh")
    public ResponseEntity<?> refreshSnapshots(
            @RequestParam Long adopterUserId,
            @RequestParam Long adoptionRequestId,
            @RequestParam(defaultValue = "75") Double minThreshold
    ) {
        try {
            int count = matchSnapshotService.refreshSnapshotsForRequest(
                    adopterUserId,
                    adoptionRequestId,
                    minThreshold
            );
            return ResponseEntity.ok(Map.of("saved", count));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }
}
