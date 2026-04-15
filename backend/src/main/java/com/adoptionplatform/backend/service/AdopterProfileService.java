package com.adoptionplatform.backend.service;

import com.adoptionplatform.backend.dto.AdopterProfileRequest;
import com.adoptionplatform.backend.entity.AdopterProfile;
import com.adoptionplatform.backend.repository.AdopterProfileRepository;
import org.springframework.stereotype.Service;

@Service
public class AdopterProfileService {

    private final AdopterProfileRepository adopterProfileRepository;

    public AdopterProfileService(AdopterProfileRepository adopterProfileRepository) {
        this.adopterProfileRepository = adopterProfileRepository;
    }

    public AdopterProfile saveProfile(AdopterProfileRequest request) {

        AdopterProfile profile = adopterProfileRepository
                .findByUserId(request.getUserId())
                .orElse(new AdopterProfile());

        profile.setUserId(request.getUserId());
        profile.setHomeType(request.getHomeType());
        profile.setIndoorSpace(request.getIndoorSpace());
        profile.setPreferredAnimalType(request.getPreferredAnimalType());
        profile.setPreferredSize(request.getPreferredSize());
        profile.setPreferredAge(request.getPreferredAge());
        profile.setActivityLevel(request.getActivityLevel());
        profile.setHasChildren(request.getHasChildren());
        profile.setHasOtherPets(request.getHasOtherPets());
        profile.setGroomingTolerance(request.getGroomingTolerance());
        profile.setSpecialNeedsTolerance(request.getSpecialNeedsTolerance());

        return adopterProfileRepository.save(profile);
    }

    public AdopterProfile getProfileByUserId(Long userId) {
        return adopterProfileRepository.findByUserId(userId).orElse(null);
    }
}