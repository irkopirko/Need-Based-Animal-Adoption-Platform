package com.adoptionplatform.backend.repository;

import com.adoptionplatform.backend.entity.AdoptionAuditEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AdoptionAuditEventRepository extends JpaRepository<AdoptionAuditEvent, Long> {

    List<AdoptionAuditEvent> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(
            String entityType,
            Long entityId
    );
}
