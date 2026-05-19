package com.adoptionplatform.backend.repository;

import com.adoptionplatform.backend.entity.InquiryMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InquiryMessageRepository extends JpaRepository<InquiryMessage, Long> {

    List<InquiryMessage> findByInquiryIdOrderByCreatedAtAsc(Long inquiryId);
}
