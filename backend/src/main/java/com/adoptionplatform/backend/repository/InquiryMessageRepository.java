package com.adoptionplatform.backend.repository;

import com.adoptionplatform.backend.entity.InquiryMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface InquiryMessageRepository extends JpaRepository<InquiryMessage, Long> {

    List<InquiryMessage> findByInquiryIdOrderByCreatedAtAsc(Long inquiryId);

    List<InquiryMessage> findByInquiryIdInOrderByCreatedAtAsc(Collection<Long> inquiryIds);

    @Query("SELECT DISTINCT m.inquiryId FROM InquiryMessage m WHERE m.inquiryId IN :inquiryIds")
    List<Long> findInquiryIdsWithMessages(@Param("inquiryIds") Collection<Long> inquiryIds);
}
