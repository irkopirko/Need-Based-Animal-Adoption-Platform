package com.adoptionplatform.backend.service;

import com.adoptionplatform.backend.dto.CreateInquiryRequest;
import com.adoptionplatform.backend.dto.InquiryMessageDto;
import com.adoptionplatform.backend.dto.InquiryThreadDto;
import com.adoptionplatform.backend.dto.SendInquiryMessageRequest;
import com.adoptionplatform.backend.entity.AdoptionRequest;
import com.adoptionplatform.backend.entity.Animal;
import com.adoptionplatform.backend.entity.InquiryMessage;
import com.adoptionplatform.backend.entity.ListingInquiry;
import com.adoptionplatform.backend.entity.Role;
import com.adoptionplatform.backend.entity.User;
import com.adoptionplatform.backend.repository.AdoptionRequestRepository;
import com.adoptionplatform.backend.repository.AnimalRepository;
import com.adoptionplatform.backend.repository.InquiryMessageRepository;
import com.adoptionplatform.backend.repository.ListingInquiryRepository;
import com.adoptionplatform.backend.repository.UserRepository;
import com.adoptionplatform.backend.util.ListingCodeUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class InquiryService {

    private final ListingInquiryRepository inquiryRepository;
    private final InquiryMessageRepository messageRepository;
    private final AnimalRepository animalRepository;
    private final UserRepository userRepository;
    private final AdoptionRequestRepository adoptionRequestRepository;

    public InquiryService(
            ListingInquiryRepository inquiryRepository,
            InquiryMessageRepository messageRepository,
            AnimalRepository animalRepository,
            UserRepository userRepository,
            AdoptionRequestRepository adoptionRequestRepository
    ) {
        this.inquiryRepository = inquiryRepository;
        this.messageRepository = messageRepository;
        this.animalRepository = animalRepository;
        this.userRepository = userRepository;
        this.adoptionRequestRepository = adoptionRequestRepository;
    }

    @Transactional
    public InquiryThreadDto createInquiry(CreateInquiryRequest request) {
        if (request.getAdopterUserId() == null || request.getAnimalId() == null) {
            throw new IllegalArgumentException("Adopter and animal are required");
        }
        String message = normalizeMessage(request.getMessage());
        if (message.isEmpty()) {
            throw new IllegalArgumentException("Message is required");
        }

        User adopter = userRepository.findById(request.getAdopterUserId())
                .orElseThrow(() -> new IllegalArgumentException("Adopter not found"));
        if (adopter.getRole() != Role.ADOPTER) {
            throw new IllegalArgumentException("Only adopters can contact owners");
        }

        Animal animal = animalRepository.findById(request.getAnimalId())
                .orElseThrow(() -> new IllegalArgumentException("Listing not found"));
        Long ownerId = animal.getOwnerId();
        if (ownerId == null) {
            throw new IllegalArgumentException("Listing has no owner");
        }

        Optional<ListingInquiry> existing = inquiryRepository.findByAnimalIdAndAdopterUserId(
                request.getAnimalId(), request.getAdopterUserId());
        if (existing.isPresent()) {
            throw new IllegalArgumentException("You already contacted the owner for this listing");
        }

        LocalDateTime now = LocalDateTime.now(ZoneId.of("Europe/Istanbul"));
        ListingInquiry inquiry = new ListingInquiry();
        inquiry.setAnimalId(animal.getId());
        inquiry.setAdopterUserId(request.getAdopterUserId());
        inquiry.setOwnerUserId(ownerId);
        inquiry.setInitialMessage(message);
        inquiry.setStatus("PENDING");
        inquiry.setCreatedAt(now);
        inquiry.setUpdatedAt(now);
        ListingInquiry saved = inquiryRepository.save(inquiry);

        InquiryMessage first = new InquiryMessage();
        first.setInquiryId(saved.getId());
        first.setSenderUserId(request.getAdopterUserId());
        first.setSenderRole("ADOPTER");
        first.setBody(message);
        first.setCreatedAt(now);
        messageRepository.save(first);

        return toThreadDto(saved, true);
    }

    @Transactional(readOnly = true)
    public List<InquiryThreadDto> listForOwner(Long ownerId) {
        return inquiryRepository.findByOwnerUserIdOrderByCreatedAtDesc(ownerId).stream()
                .map(i -> toThreadDto(i, true))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<InquiryThreadDto> listForAdopter(Long adopterId) {
        return inquiryRepository.findByAdopterUserIdOrderByCreatedAtDesc(adopterId).stream()
                .map(i -> toThreadDto(i, true))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InquiryThreadDto getThread(Long inquiryId, Long viewerUserId) {
        ListingInquiry inquiry = inquiryRepository.findById(inquiryId)
                .orElseThrow(() -> new IllegalArgumentException("Inquiry not found"));
        assertParticipant(inquiry, viewerUserId);
        return toThreadDto(inquiry, true);
    }

    @Transactional
    public InquiryThreadDto acceptInquiry(Long inquiryId, Long ownerId) {
        ListingInquiry inquiry = loadOwnedInquiry(inquiryId, ownerId);
        if ("REJECTED".equalsIgnoreCase(inquiry.getStatus())) {
            throw new IllegalArgumentException("This inquiry was already rejected");
        }
        inquiry.setStatus("ACCEPTED");
        inquiry.setUpdatedAt(LocalDateTime.now(ZoneId.of("Europe/Istanbul")));
        return toThreadDto(inquiryRepository.save(inquiry), true);
    }

    @Transactional
    public InquiryThreadDto rejectInquiry(Long inquiryId, Long ownerId) {
        ListingInquiry inquiry = loadOwnedInquiry(inquiryId, ownerId);
        inquiry.setStatus("REJECTED");
        inquiry.setUpdatedAt(LocalDateTime.now(ZoneId.of("Europe/Istanbul")));
        return toThreadDto(inquiryRepository.save(inquiry), true);
    }

    @Transactional
    public InquiryMessageDto sendMessage(Long inquiryId, SendInquiryMessageRequest request) {
        if (request.getUserId() == null) {
            throw new IllegalArgumentException("User id is required");
        }
        String body = normalizeMessage(request.getBody());
        if (body.isEmpty()) {
            throw new IllegalArgumentException("Message body is required");
        }

        ListingInquiry inquiry = inquiryRepository.findById(inquiryId)
                .orElseThrow(() -> new IllegalArgumentException("Inquiry not found"));
        assertParticipant(inquiry, request.getUserId());

        if ("REJECTED".equalsIgnoreCase(inquiry.getStatus())) {
            throw new IllegalArgumentException("This inquiry was closed and no further messages can be sent");
        }

        String role = resolveSenderRole(inquiry, request.getUserId(), request.getSenderRole());

        LocalDateTime now = LocalDateTime.now(ZoneId.of("Europe/Istanbul"));
        InquiryMessage msg = new InquiryMessage();
        msg.setInquiryId(inquiryId);
        msg.setSenderUserId(request.getUserId());
        msg.setSenderRole(role);
        msg.setBody(body);
        msg.setCreatedAt(now);
        InquiryMessage saved = messageRepository.save(msg);

        inquiry.setUpdatedAt(now);
        inquiryRepository.save(inquiry);

        return toMessageDto(saved);
    }

    @Transactional(readOnly = true)
    public AdoptionRequest getAdopterRequestForInquiry(Long inquiryId, Long ownerId) {
        ListingInquiry inquiry = loadOwnedInquiry(inquiryId, ownerId);
        List<AdoptionRequest> requests = adoptionRequestRepository.findByUserId(inquiry.getAdopterUserId());
        if (requests == null || requests.isEmpty()) {
            return null;
        }
        return requests.stream()
                .max(Comparator.comparing(AdoptionRequest::getId, Comparator.nullsLast(Comparator.naturalOrder())))
                .orElse(null);
    }

    private ListingInquiry loadOwnedInquiry(Long inquiryId, Long ownerId) {
        ListingInquiry inquiry = inquiryRepository.findById(inquiryId)
                .orElseThrow(() -> new IllegalArgumentException("Inquiry not found"));
        if (!inquiry.getOwnerUserId().equals(ownerId)) {
            throw new IllegalArgumentException("Not authorized for this inquiry");
        }
        return inquiry;
    }

    private void assertParticipant(ListingInquiry inquiry, Long userId) {
        if (userId == null) {
            throw new IllegalArgumentException("User id is required");
        }
        if (!inquiry.getOwnerUserId().equals(userId) && !inquiry.getAdopterUserId().equals(userId)) {
            throw new IllegalArgumentException("Not authorized for this inquiry");
        }
    }

    private String resolveSenderRole(ListingInquiry inquiry, Long userId, String requested) {
        if (inquiry.getOwnerUserId().equals(userId)) {
            return "OWNER";
        }
        if (inquiry.getAdopterUserId().equals(userId)) {
            return "ADOPTER";
        }
        if (requested != null && !requested.isBlank()) {
            return requested.trim().toUpperCase(Locale.ROOT);
        }
        throw new IllegalArgumentException("Not authorized to send in this thread");
    }

    private InquiryThreadDto toThreadDto(ListingInquiry inquiry, boolean withMessages) {
        InquiryThreadDto dto = new InquiryThreadDto();
        dto.setId(inquiry.getId());
        dto.setAnimalId(inquiry.getAnimalId());
        dto.setListingCode(ListingCodeUtil.format(inquiry.getAnimalId()));
        dto.setAdopterUserId(inquiry.getAdopterUserId());
        dto.setOwnerUserId(inquiry.getOwnerUserId());
        dto.setStatus(inquiry.getStatus());
        dto.setInitialMessage(inquiry.getInitialMessage());
        dto.setCreatedAt(inquiry.getCreatedAt());
        dto.setUpdatedAt(inquiry.getUpdatedAt());

        animalRepository.findById(inquiry.getAnimalId()).ifPresent(a -> dto.setAnimalName(a.getName()));
        userRepository.findById(inquiry.getAdopterUserId()).ifPresent(u -> {
            dto.setAdopterName(u.getFullName());
            dto.setAdopterEmail(u.getEmail());
        });

        if (withMessages) {
            List<InquiryMessageDto> messages = messageRepository
                    .findByInquiryIdOrderByCreatedAtAsc(inquiry.getId())
                    .stream()
                    .map(this::toMessageDto)
                    .collect(Collectors.toList());
            dto.setMessages(messages);
        }
        return dto;
    }

    private InquiryMessageDto toMessageDto(InquiryMessage m) {
        InquiryMessageDto dto = new InquiryMessageDto();
        dto.setId(m.getId());
        dto.setSenderUserId(m.getSenderUserId());
        dto.setSenderRole(m.getSenderRole());
        dto.setBody(m.getBody());
        dto.setCreatedAt(m.getCreatedAt());
        return dto;
    }

    private static String normalizeMessage(String raw) {
        if (raw == null) {
            return "";
        }
        String t = raw.trim();
        if (t.length() > 1000) {
            return t.substring(0, 1000);
        }
        return t;
    }
}
