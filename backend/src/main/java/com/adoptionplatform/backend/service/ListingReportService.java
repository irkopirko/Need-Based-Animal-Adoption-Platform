package com.adoptionplatform.backend.service;

import com.adoptionplatform.backend.dto.CreateListingReportRequest;
import com.adoptionplatform.backend.dto.ListingReportViewDto;
import com.adoptionplatform.backend.entity.Animal;
import com.adoptionplatform.backend.entity.ListingReport;
import com.adoptionplatform.backend.entity.User;
import com.adoptionplatform.backend.repository.AnimalRepository;
import com.adoptionplatform.backend.repository.ListingReportRepository;
import com.adoptionplatform.backend.repository.UserRepository;
import com.adoptionplatform.backend.util.ListingCodeUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class ListingReportService {

    private static final Set<String> ALLOWED_REASONS = Set.of(
            "MISLEADING_INFO",
            "INAPPROPRIATE_CONTENT",
            "ANIMAL_WELFARE_CONCERN",
            "DUPLICATE_LISTING",
            "OTHER"
    );

    private final ListingReportRepository reportRepository;
    private final AnimalRepository animalRepository;
    private final UserRepository userRepository;

    public ListingReportService(
            ListingReportRepository reportRepository,
            AnimalRepository animalRepository,
            UserRepository userRepository
    ) {
        this.reportRepository = reportRepository;
        this.animalRepository = animalRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ListingReport submitReport(CreateListingReportRequest request) {
        if (request.getReporterUserId() == null || request.getAnimalId() == null) {
            throw new IllegalArgumentException("Reporter and animal are required");
        }
        String reason = normalizeReason(request.getReason());
        String note = normalizeNote(request.getNote());

        Animal animal = animalRepository.findById(request.getAnimalId())
                .orElseThrow(() -> new IllegalArgumentException("Listing not found"));
        userRepository.findById(request.getReporterUserId())
                .orElseThrow(() -> new IllegalArgumentException("Reporter not found"));

        if (reportRepository.existsByAnimalIdAndReporterUserIdAndStatus(
                request.getAnimalId(), request.getReporterUserId(), "PENDING")) {
            throw new IllegalArgumentException("You already have a pending report for this listing");
        }

        ListingReport report = new ListingReport();
        report.setAnimalId(animal.getId());
        report.setReporterUserId(request.getReporterUserId());
        report.setReason(reason);
        report.setNote(note);
        report.setStatus("PENDING");
        report.setCreatedAt(LocalDateTime.now(ZoneId.of("Europe/Istanbul")));
        return reportRepository.save(report);
    }

    @Transactional(readOnly = true)
    public List<ListingReportViewDto> listPendingReports() {
        List<ListingReport> pending = reportRepository.findByStatusOrderByCreatedAtDesc("PENDING");
        List<ListingReportViewDto> out = new ArrayList<>();
        for (ListingReport r : pending) {
            out.add(toView(r));
        }
        return out;
    }

    @Transactional
    public void markResolved(Long reportId) {
        ListingReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found"));
        report.setStatus("RESOLVED");
        reportRepository.save(report);
    }

    private ListingReportViewDto toView(ListingReport r) {
        ListingReportViewDto dto = new ListingReportViewDto();
        dto.setId(r.getId());
        dto.setAnimalId(r.getAnimalId());
        dto.setListingCode(ListingCodeUtil.format(r.getAnimalId()));
        dto.setReporterUserId(r.getReporterUserId());
        dto.setReason(r.getReason());
        dto.setNote(r.getNote());
        dto.setStatus(r.getStatus());
        dto.setCreatedAt(r.getCreatedAt());

        animalRepository.findById(r.getAnimalId()).ifPresent(a -> dto.setAnimalName(a.getName()));
        userRepository.findById(r.getReporterUserId()).ifPresent(u -> dto.setReporterEmail(u.getEmail()));
        return dto;
    }

    private static String normalizeReason(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("Report reason is required");
        }
        String key = raw.trim().toUpperCase(Locale.ROOT).replace(' ', '_');
        if (!ALLOWED_REASONS.contains(key)) {
            throw new IllegalArgumentException("Invalid report reason");
        }
        return key;
    }

    private static String normalizeNote(String raw) {
        if (raw == null) {
            return "";
        }
        String t = raw.trim();
        if (t.length() > 280) {
            return t.substring(0, 280);
        }
        return t;
    }
}
