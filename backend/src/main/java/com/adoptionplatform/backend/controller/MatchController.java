package com.adoptionplatform.backend.controller;

import com.adoptionplatform.backend.dto.MatchResultDto;
import com.adoptionplatform.backend.service.MatchService;
import com.adoptionplatform.backend.service.MatchSnapshotService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/match")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173"
})
public class MatchController {

    private final MatchService matchService;
    private final MatchSnapshotService matchSnapshotService;

    public MatchController(MatchService matchService, MatchSnapshotService matchSnapshotService) {
        this.matchService = matchService;
        this.matchSnapshotService = matchSnapshotService;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<List<MatchResultDto>> getMatches(
            @PathVariable Long userId,
            @RequestParam(required = false) Long requestId,
            @RequestParam(required = false) Double minOverlap
    ) {
        return ResponseEntity.ok(matchService.getMatches(userId, requestId, minOverlap));
    }

    @PostMapping("/{userId}/refresh-snapshots")
    public ResponseEntity<?> refreshSnapshots(
            @PathVariable Long userId,
            @RequestParam Long requestId,
            @RequestParam(defaultValue = "75") Double minThreshold
    ) {
        try {
            int saved = matchSnapshotService.refreshSnapshotsForRequest(userId, requestId, minThreshold);
            return ResponseEntity.ok(Map.of("saved", saved));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }
}