package com.adoptionplatform.backend.controller;

import com.adoptionplatform.backend.dto.AdoptionRequestDto;
import com.adoptionplatform.backend.entity.AdoptionRequest;
import com.adoptionplatform.backend.service.AdoptionRequestService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/adoption-requests")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class AdoptionRequestController {

    private final AdoptionRequestService adoptionRequestService;

    public AdoptionRequestController(AdoptionRequestService adoptionRequestService) {
        this.adoptionRequestService = adoptionRequestService;
    }

    @PostMapping
    public ResponseEntity<AdoptionRequest> createRequest(@RequestBody AdoptionRequestDto dto) {
        return ResponseEntity.ok(adoptionRequestService.saveRequest(dto));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<AdoptionRequest>> getRequestsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(adoptionRequestService.getRequestsByUserId(userId));
    }
}