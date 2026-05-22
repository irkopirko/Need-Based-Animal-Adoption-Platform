package com.adoptionplatform.backend.service;

import com.adoptionplatform.backend.entity.AdoptionAuditEvent;
import com.adoptionplatform.backend.repository.AdoptionAuditEventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;

@Service
public class AdoptionAuditService {

    private final AdoptionAuditEventRepository repository;

    public AdoptionAuditService(AdoptionAuditEventRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public void record(String entityType, Long entityId, Long actorUserId, String action, String details) {
        AdoptionAuditEvent event = new AdoptionAuditEvent();
        event.setEntityType(entityType);
        event.setEntityId(entityId);
        event.setActorUserId(actorUserId);
        event.setAction(action);
        if (details != null && details.length() > 2000) {
            event.setDetails(details.substring(0, 2000));
        } else {
            event.setDetails(details);
        }
        event.setCreatedAt(LocalDateTime.now(ZoneId.of("Europe/Istanbul")));
        repository.save(event);
    }
}
