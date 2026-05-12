package com.adoptionplatform.backend.controller;

import com.adoptionplatform.backend.dto.MatchResultDto;
import com.adoptionplatform.backend.service.MatchService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    public MatchController(MatchService matchService) {
        this.matchService = matchService;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<List<MatchResultDto>> getMatches(
            @PathVariable Long userId,
            @RequestParam(required = false) Long requestId
    ) {
        return ResponseEntity.ok(matchService.getMatches(userId, requestId));
    }
}