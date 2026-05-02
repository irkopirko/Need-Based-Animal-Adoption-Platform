package com.adoptionplatform.backend.controller;

import com.adoptionplatform.backend.entity.*;
import com.adoptionplatform.backend.repository.*;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:3000")
public class AdminController {

    private final UserRepository userRepository;
    private final AnimalRepository animalRepository;
    private final AdoptionRequestRepository adoptionRequestRepository;
    private final LoginLogRepository loginLogRepository;

    public AdminController(
            UserRepository userRepository,
            AnimalRepository animalRepository,
            AdoptionRequestRepository adoptionRequestRepository,
            LoginLogRepository loginLogRepository
    ) {
        this.userRepository = userRepository;
        this.animalRepository = animalRepository;
        this.adoptionRequestRepository = adoptionRequestRepository;
        this.loginLogRepository = loginLogRepository;
    }

    @GetMapping("/users")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @GetMapping("/animals")
    public List<Animal> getAllAnimals() {
        return animalRepository.findAll();
    }

    @GetMapping("/adoption-requests")
    public List<AdoptionRequest> getAllAdoptionRequests() {
        return adoptionRequestRepository.findAll();
    }

    @GetMapping("/login-logs")
    public List<LoginLog> getAllLoginLogs() {
        return loginLogRepository.findAll();
    }

    @GetMapping("/stats")
    public Map<String, Long> getStats() {
        Map<String, Long> stats = new HashMap<>();

        stats.put("totalUsers", userRepository.count());
        stats.put("totalAnimals", animalRepository.count());
        stats.put("totalAdoptionRequests", adoptionRequestRepository.count());
        stats.put("totalLoginLogs", loginLogRepository.count());

        return stats;
    }
}