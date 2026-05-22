package com.adoptionplatform.backend.repository;

import com.adoptionplatform.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    @Query("SELECT u FROM User u WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(:email))")
    Optional<User> findByNormalizedEmail(@Param("email") String email);

    Optional<User> findByPhone(String phone);
}