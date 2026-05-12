package com.adoptionplatform.backend.repository;

import com.adoptionplatform.backend.entity.LoginLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

public interface LoginLogRepository extends JpaRepository<LoginLog, Long> {

    long countBySuccessful(boolean successful);

    @Modifying
    void deleteByUserId(Long userId);
}