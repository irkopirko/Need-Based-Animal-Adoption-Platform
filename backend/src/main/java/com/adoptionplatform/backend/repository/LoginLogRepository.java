package com.adoptionplatform.backend.repository;

import com.adoptionplatform.backend.entity.LoginLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LoginLogRepository extends JpaRepository<LoginLog, Long> {
}