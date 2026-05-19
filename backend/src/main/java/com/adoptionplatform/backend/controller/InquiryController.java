package com.adoptionplatform.backend.controller;

import com.adoptionplatform.backend.dto.CreateInquiryRequest;
import com.adoptionplatform.backend.dto.InquiryMessageDto;
import com.adoptionplatform.backend.dto.InquiryThreadDto;
import com.adoptionplatform.backend.dto.SendInquiryMessageRequest;
import com.adoptionplatform.backend.entity.AdoptionRequest;
import com.adoptionplatform.backend.service.InquiryService;
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
@RequestMapping("/api/inquiries")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class InquiryController {

    private final InquiryService inquiryService;

    public InquiryController(InquiryService inquiryService) {
        this.inquiryService = inquiryService;
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateInquiryRequest request) {
        try {
            InquiryThreadDto thread = inquiryService.createInquiry(request);
            return ResponseEntity.ok(thread);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<List<InquiryThreadDto>> listForOwner(@PathVariable Long ownerId) {
        return ResponseEntity.ok(inquiryService.listForOwner(ownerId));
    }

    @GetMapping("/adopter/{adopterId}")
    public ResponseEntity<List<InquiryThreadDto>> listForAdopter(@PathVariable Long adopterId) {
        return ResponseEntity.ok(inquiryService.listForAdopter(adopterId));
    }

    @GetMapping("/{inquiryId}")
    public ResponseEntity<?> getThread(
            @PathVariable Long inquiryId,
            @RequestParam Long viewerId
    ) {
        try {
            return ResponseEntity.ok(inquiryService.getThread(inquiryId, viewerId));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/{inquiryId}/accept")
    public ResponseEntity<?> accept(
            @PathVariable Long inquiryId,
            @RequestParam Long ownerId
    ) {
        try {
            return ResponseEntity.ok(inquiryService.acceptInquiry(inquiryId, ownerId));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/{inquiryId}/reject")
    public ResponseEntity<?> reject(
            @PathVariable Long inquiryId,
            @RequestParam Long ownerId
    ) {
        try {
            return ResponseEntity.ok(inquiryService.rejectInquiry(inquiryId, ownerId));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/{inquiryId}/messages")
    public ResponseEntity<?> sendMessage(
            @PathVariable Long inquiryId,
            @RequestBody SendInquiryMessageRequest request
    ) {
        try {
            InquiryMessageDto saved = inquiryService.sendMessage(inquiryId, request);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/{inquiryId}/adopter-request")
    public ResponseEntity<?> adopterRequest(
            @PathVariable Long inquiryId,
            @RequestParam Long ownerId
    ) {
        try {
            AdoptionRequest request = inquiryService.getAdopterRequestForInquiry(inquiryId, ownerId);
            if (request == null) {
                return ResponseEntity.ok(Map.of("found", false));
            }
            return ResponseEntity.ok(request);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }
}
