package com.adoptionplatform.backend.service;

import com.adoptionplatform.backend.config.AdminConfig;
import com.adoptionplatform.backend.dto.ChangePasswordRequest;
import com.adoptionplatform.backend.dto.DeleteAccountRequest;
import com.adoptionplatform.backend.dto.LoginRequest;
import com.adoptionplatform.backend.dto.RegisterRequest;
import com.adoptionplatform.backend.dto.CompleteAdopterProfileRequest;
import com.adoptionplatform.backend.dto.CompleteOwnerProfileRequest;
import com.adoptionplatform.backend.dto.UpdateProfileRequest;
import com.adoptionplatform.backend.dto.UserProfileDto;
import com.adoptionplatform.backend.entity.Animal;
import com.adoptionplatform.backend.entity.LoginLog;
import com.adoptionplatform.backend.entity.Role;
import com.adoptionplatform.backend.entity.User;
import com.adoptionplatform.backend.repository.AdopterProfileRepository;
import com.adoptionplatform.backend.repository.AdoptionRequestRepository;
import com.adoptionplatform.backend.repository.AnimalRepository;
import com.adoptionplatform.backend.repository.LoginLogRepository;
import com.adoptionplatform.backend.repository.SavedAnimalRepository;
import com.adoptionplatform.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;

import javax.naming.NamingEnumeration;
import javax.naming.NamingException;
import javax.naming.directory.Attributes;
import javax.naming.directory.DirContext;
import javax.naming.directory.InitialDirContext;
import java.net.InetAddress;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.ZoneId;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Hashtable;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

@Service
public class AuthService {

    private static final String SQL_ANIMAL_IDS_BY_OWNER = "SELECT id FROM animals WHERE owner_id = ?";

    @Autowired
    private LoginLogRepository loginLogRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private AdoptionRequestRepository adoptionRequestRepository;

    @Autowired
    private SavedAnimalRepository savedAnimalRepository;

    @Autowired
    private AnimalRepository animalRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private AdopterProfileRepository adopterProfileRepository;

    @Autowired
    private AdminConfig adminConfig;

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final long EMAIL_VERIFICATION_EXPIRY_MS = 10 * 60 * 1000;
    private static final int MIN_STREET_ADDRESS_LENGTH = 10;

    private final Map<String, PendingRegistration> pendingRegistrations = new ConcurrentHashMap<>();
    private final Map<String, PendingLogin> pendingLogins = new ConcurrentHashMap<>();
    private final Map<String, PendingPasswordReset> pendingPasswordResets = new ConcurrentHashMap<>();

    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
    );

    private static final Pattern UPPERCASE_PATTERN = Pattern.compile(".*\\p{Lu}.*");
    private static final Pattern LOWERCASE_PATTERN = Pattern.compile(".*\\p{Ll}.*");
    private static final Pattern DIGIT_PATTERN = Pattern.compile(".*\\d.*");
    private static final Pattern SPECIAL_PATTERN = Pattern.compile(".*[^A-Za-z0-9].*");

    public Map<String, String> register(RegisterRequest request) {
        Map<String, String> response = new HashMap<>();
        String email = normalizeEmail(request.getEmail());

        if (!isValidEmail(email)) {
            response.put("error", "Invalid email format");
            return response;
        }

        if (!hasResolvableDomain(email)) {
            response.put("error", "Invalid email domain");
            return response;
        }

        Optional<User> existingUser = userRepository.findByEmail(email);
        if (existingUser.isPresent()) {
            response.put("error", "Email is already registered");
            return response;
        }

        if (request.getRole() == null || request.getRole().trim().isEmpty()) {
            response.put("error", "Role is required");
            return response;
        }

        String passwordValidationError = getPasswordValidationError(request.getPassword());
        if (passwordValidationError != null) {
            response.put("error", passwordValidationError);
            return response;
        }

        Role role;
        try {
            role = Role.valueOf(request.getRole().toUpperCase());
        } catch (IllegalArgumentException ex) {
            response.put("error", "Invalid role");
            return response;
        }

        String phoneRaw = trimOrNull(request.getPhone());
        if (phoneRaw == null) {
            response.put("error", "Phone is required");
            return response;
        }
        String phoneE164 = normalizeTurkishMobileToE164(phoneRaw);
        if (phoneE164 == null) {
            response.put("error", "Enter a valid Turkish mobile number (e.g. 0554 xxx xx xx)");
            return response;
        }

        String verificationCode = generateTwoFaCode();

        pendingRegistrations.put(
                email,
                new PendingRegistration(
                        request.getFullName(),
                        request.getPassword(),
                        request.getLocation(),
                        phoneE164,
                        role,
                        verificationCode,
                        System.currentTimeMillis() + EMAIL_VERIFICATION_EXPIRY_MS
                )
        );

        try {
            System.out.println("MAIL GONDERILIYOR: " + email);
            emailService.sendVerificationCode(email, verificationCode);
        } catch (Exception exception) {
            exception.printStackTrace();
            pendingRegistrations.remove(email);
            response.put("error", "MAIL_ERROR: " + exception.getClass().getSimpleName() + " - " + exception.getMessage());
            return response;
        }

        response.put("message", "Registration successful. Please verify your email.");
        response.put("requiresVerification", "true");
        response.put("email", email);
        return response;
    }

    public Map<String, String> login(LoginRequest request) {
        Map<String, String> response = new HashMap<>();
        String email = normalizeEmail(request.getEmail());

        if (!isValidEmail(email)) {
            response.put("error", "Invalid email format");
            return response;
        }

        if (!hasResolvableDomain(email)) {
            response.put("error", "Invalid email domain");
            return response;
        }

        Optional<User> userOptional = userRepository.findByEmail(email);

        if (userOptional.isEmpty()) {
            saveLoginLog(null, request.getEmail(), null, false, "User not found");
            response.put("error", "User not found");
            return response;
        }

        User user = userOptional.get();


        boolean passwordMatches;

        if (user.getPassword().startsWith("$2a$") || user.getPassword().startsWith("$2b$")) {
            passwordMatches = passwordEncoder.matches(request.getPassword(), user.getPassword());
        } else {
            passwordMatches = user.getPassword().equals(request.getPassword());

            if (passwordMatches) {
                user.setPassword(passwordEncoder.encode(request.getPassword()));
                userRepository.save(user);
            }
        }

        if (!passwordMatches) {
            saveLoginLog(user.getId(), user.getEmail(), user.getRole().toString(), false, "Wrong password");
            response.put("error", "Wrong password");
            return response;
        }

        String loginCode = generateTwoFaCode();

        pendingLogins.put(
                email,
                new PendingLogin(loginCode, System.currentTimeMillis() + EMAIL_VERIFICATION_EXPIRY_MS)
        );

        try {
            emailService.sendLoginCode(email, loginCode);
        } catch (Exception exception) {
            pendingLogins.remove(email);
            saveLoginLog(user.getId(), user.getEmail(), user.getRole().toString(), false, "Could not send login verification code");
            response.put("error", "Could not send login verification code.");
            return response;
        }

        response.put("message", "Login verification code sent.");
        response.put("requiresVerification", "true");
        response.put("email", email);
        return response;
    }

    public Map<String, String> verifyLoginCode(String emailInput, String codeInput) {
        Map<String, String> response = new HashMap<>();
        String email = normalizeEmail(emailInput);

        if (!isValidEmail(email)) {
            response.put("error", "Invalid email format");
            return response;
        }

        if (codeInput == null || codeInput.trim().isEmpty()) {
            response.put("error", "Verification code is required");
            return response;
        }

        PendingLogin pendingLogin = pendingLogins.get(email);

        if (pendingLogin == null) {
            saveLoginLog(null, email, null, false, "Login verification session not found");
            response.put("error", "Login verification session not found. Please login again.");
            return response;
        }

        if (System.currentTimeMillis() > pendingLogin.expiresAt) {
            pendingLogins.remove(email);

            Optional<User> expiredUserOptional = userRepository.findByEmail(email);

            if (expiredUserOptional.isPresent()) {
                User expiredUser = expiredUserOptional.get();
                saveLoginLog(
                        expiredUser.getId(),
                        expiredUser.getEmail(),
                        expiredUser.getRole().toString(),
                        false,
                        "Verification code expired"
                );
            } else {
                saveLoginLog(null, email, null, false, "Verification code expired");
            }

            response.put("error", "Verification code expired. Please login again.");
            return response;
        }

        if (!pendingLogin.code.equals(codeInput.trim())) {
            Optional<User> failedUserOptional = userRepository.findByEmail(email);

            if (failedUserOptional.isPresent()) {
                User failedUser = failedUserOptional.get();
                saveLoginLog(
                        failedUser.getId(),
                        failedUser.getEmail(),
                        failedUser.getRole().toString(),
                        false,
                        "Invalid verification code"
                );
            } else {
                saveLoginLog(null, email, null, false, "Invalid verification code");
            }

            response.put("error", "Invalid verification code");
            return response;
        }

        Optional<User> userOptional = userRepository.findByEmail(email);

        if (userOptional.isEmpty()) {
            pendingLogins.remove(email);
            saveLoginLog(null, email, null, false, "User not found after verification");
            response.put("error", "User not found");
            return response;
        }

        User user = userOptional.get();
        pendingLogins.remove(email);

        if (adminConfig.isAdminEmail(email)) {
            if (user.getRole() != Role.ADMIN) {
                user.setRole(Role.ADMIN);
                userRepository.save(user);
            }
        }

        saveLoginLog(
                user.getId(),
                user.getEmail(),
                adminConfig.isAdminEmail(email) ? Role.ADMIN.name() : user.getRole().toString(),
                true,
                "Login successful"
        );

        response.put("message", "Login successful");
        if (adminConfig.isAdminEmail(email)) {
            response.put("role", Role.ADMIN.name());
        } else {
            response.put("role", user.getRole().name());
        }
        response.put("fullName", user.getFullName());
        response.put("userId", String.valueOf(user.getId()));
        response.put("adopterProfileCompleted", adopterProfileCompletedResponseValue(user));
        response.put("ownerProfileCompleted", ownerProfileCompletedResponseValue(user));
        response.put("ownerListingType", user.getOwnerListingType() == null ? "" : user.getOwnerListingType());
        return response;
    }

    public Map<String, String> resendLoginCode(String emailInput) {
        Map<String, String> response = new HashMap<>();
        String email = normalizeEmail(emailInput);

        if (!isValidEmail(email)) {
            response.put("error", "Invalid email format");
            return response;
        }

        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isEmpty()) {
            response.put("error", "User not found");
            return response;
        }

        String loginCode = generateTwoFaCode();

        pendingLogins.put(
                email,
                new PendingLogin(loginCode, System.currentTimeMillis() + EMAIL_VERIFICATION_EXPIRY_MS)
        );

        try {
            emailService.sendLoginCode(email, loginCode);
        } catch (Exception exception) {
            pendingLogins.remove(email);
            response.put("error", "Could not send login verification code.");
            return response;
        }

        response.put("message", "A new login verification code has been sent.");
        return response;
    }

    public Map<String, String> verifyEmail(String emailInput, String codeInput) {
        Map<String, String> response = new HashMap<>();
        String email = normalizeEmail(emailInput);

        if (!isValidEmail(email)) {
            response.put("error", "Invalid email format");
            return response;
        }

        if (codeInput == null || codeInput.trim().isEmpty()) {
            response.put("error", "Verification code is required");
            return response;
        }

        Optional<User> existingUser = userRepository.findByEmail(email);
        if (existingUser.isPresent()) {
            response.put("error", "Email is already registered");
            return response;
        }

        PendingRegistration pendingRegistration = pendingRegistrations.get(email);
        if (pendingRegistration == null) {
            response.put("error", "Verification session not found. Please register again.");
            return response;
        }

        if (System.currentTimeMillis() > pendingRegistration.expiresAt) {
            pendingRegistrations.remove(email);
            response.put("error", "Verification code expired. Please register again.");
            return response;
        }

        if (!pendingRegistration.code.equals(codeInput.trim())) {
            response.put("error", "Invalid verification code");
            return response;
        }

        User user = new User();
        user.setFullName(pendingRegistration.fullName);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(pendingRegistration.password));
        user.setLocation(pendingRegistration.location);
        user.setPhone(pendingRegistration.phone);
        user.setRole(adminConfig.isAdminEmail(email) ? Role.ADMIN : pendingRegistration.role);
        user.setEmailVerified(true);
        user.setActive(true);
        user.setEmailVerificationCode(null);
        user.setEmailVerificationExpiresAt(null);
        user.setRegistrationTime(LocalDateTime.now(ZoneId.of("Europe/Istanbul")));

        if (user.getRole() == Role.ADMIN) {
            user.setAdopterProfileCompleted(Boolean.TRUE);
            user.setOwnerProfileCompleted(Boolean.TRUE);
            user.setOwnerListingType(null);
        } else if (user.getRole() == Role.ADOPTER) {
            user.setAdopterProfileCompleted(Boolean.FALSE);
            user.setOwnerProfileCompleted(null);
            user.setOwnerListingType(null);
        } else if (user.getRole() == Role.OWNER) {
            user.setAdopterProfileCompleted(Boolean.TRUE);
            user.setOwnerProfileCompleted(Boolean.FALSE);
            user.setOwnerListingType(null);
        } else {
            user.setAdopterProfileCompleted(Boolean.TRUE);
            user.setOwnerProfileCompleted(null);
            user.setOwnerListingType(null);
        }

        userRepository.save(user);
        pendingRegistrations.remove(email);

        response.put("message", "Email verified successfully");
        response.put("role", user.getRole().name());
        response.put("fullName", user.getFullName());
        response.put("userId", String.valueOf(user.getId()));
        response.put("adopterProfileCompleted", adopterProfileCompletedResponseValue(user));
        response.put("ownerProfileCompleted", ownerProfileCompletedResponseValue(user));
        response.put("ownerListingType", user.getOwnerListingType() == null ? "" : user.getOwnerListingType());
        return response;
    }

    public Map<String, String> resendVerificationCode(String emailInput) {
        Map<String, String> response = new HashMap<>();
        String email = normalizeEmail(emailInput);

        if (!isValidEmail(email)) {
            response.put("error", "Invalid email format");
            return response;
        }

        Optional<User> existingUser = userRepository.findByEmail(email);
        if (existingUser.isPresent()) {
            response.put("error", "Email is already registered");
            return response;
        }

        PendingRegistration pendingRegistration = pendingRegistrations.get(email);
        if (pendingRegistration == null) {
            response.put("error", "Verification session not found. Please register again.");
            return response;
        }

        String newCode = generateTwoFaCode();

        PendingRegistration refreshed = new PendingRegistration(
                pendingRegistration.fullName,
                pendingRegistration.password,
                pendingRegistration.location,
                pendingRegistration.phone,
                pendingRegistration.role,
                newCode,
                System.currentTimeMillis() + EMAIL_VERIFICATION_EXPIRY_MS
        );

        pendingRegistrations.put(email, refreshed);

        try {
            emailService.sendVerificationCode(email, newCode);
        } catch (Exception exception) {
            response.put("error", "Could not send verification email. Please try again.");
            return response;
        }

        response.put("message", "A new verification code has been sent.");
        return response;
    }

    public Map<String, String> requestPasswordResetCode(String emailInput) {
        Map<String, String> response = new HashMap<>();
        String email = normalizeEmail(emailInput);

        if (!isValidEmail(email)) {
            response.put("error", "Invalid email format");
            return response;
        }

        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isEmpty()) {
            response.put("error", "User not found");
            return response;
        }

        String resetCode = generateTwoFaCode();

        pendingPasswordResets.put(
                email,
                new PendingPasswordReset(resetCode, System.currentTimeMillis() + EMAIL_VERIFICATION_EXPIRY_MS, false)
        );

        try {
            emailService.sendPasswordResetCode(email, resetCode);
        } catch (Exception exception) {
            pendingPasswordResets.remove(email);
            response.put("error", "Could not send password reset code.");
            return response;
        }

        response.put("message", "Password reset code sent.");
        return response;
    }

    public Map<String, String> verifyPasswordResetCode(String emailInput, String codeInput) {
        Map<String, String> response = new HashMap<>();
        String email = normalizeEmail(emailInput);

        if (!isValidEmail(email)) {
            response.put("error", "Invalid email format");
            return response;
        }

        if (codeInput == null || codeInput.trim().isEmpty()) {
            response.put("error", "Verification code is required");
            return response;
        }

        PendingPasswordReset pendingReset = pendingPasswordResets.get(email);
        if (pendingReset == null) {
            response.put("error", "Password reset session not found. Please request a new code.");
            return response;
        }

        if (System.currentTimeMillis() > pendingReset.expiresAt) {
            pendingPasswordResets.remove(email);
            response.put("error", "Verification code expired. Please request a new code.");
            return response;
        }

        if (!pendingReset.code.equals(codeInput.trim())) {
            response.put("error", "Invalid verification code");
            return response;
        }

        pendingPasswordResets.put(
                email,
                new PendingPasswordReset(pendingReset.code, pendingReset.expiresAt, true)
        );

        response.put("message", "Code verified successfully.");
        return response;
    }

    public Map<String, String> resetPassword(String emailInput, String newPasswordInput, String confirmPasswordInput) {
        Map<String, String> response = new HashMap<>();

        String email = normalizeEmail(emailInput);
        String newPassword = newPasswordInput == null ? "" : newPasswordInput.trim();
        String confirmPassword = confirmPasswordInput == null ? "" : confirmPasswordInput.trim();

        if (!isValidEmail(email)) {
            response.put("error", "Invalid email format");
            return response;
        }

        PendingPasswordReset pendingReset = pendingPasswordResets.get(email);
        if (pendingReset == null || !pendingReset.verified) {
            response.put("error", "Password reset verification is required.");
            return response;
        }

        if (System.currentTimeMillis() > pendingReset.expiresAt) {
            pendingPasswordResets.remove(email);
            response.put("error", "Password reset session expired. Please request a new code.");
            return response;
        }

        if (newPassword.isEmpty() || confirmPassword.isEmpty()) {
            response.put("error", "Both password fields are required.");
            return response;
        }

        if (!newPassword.equals(confirmPassword)) {
            response.put("error", "Passwords do not match.");
            return response;
        }

        String passwordValidationError = getPasswordValidationError(newPassword);
        if (passwordValidationError != null) {
            response.put("error", passwordValidationError);
            return response;
        }

        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isEmpty()) {
            pendingPasswordResets.remove(email);
            response.put("error", "User not found");
            return response;
        }

        User user = userOptional.get();
        user.setPassword(newPassword);
        userRepository.save(user);

        pendingPasswordResets.remove(email);

        response.put("message", "Password updated successfully.");
        return response;
    }

    public Map<String, String> changePassword(ChangePasswordRequest request) {
        Map<String, String> response = new HashMap<>();
        if (request == null || request.getUserId() == null) {
            response.put("error", "User id is required");
            return response;
        }

        String currentPassword = request.getCurrentPassword() == null ? "" : request.getCurrentPassword();
        String newPassword = request.getNewPassword() == null ? "" : request.getNewPassword();
        String confirmPassword = request.getConfirmPassword() == null ? "" : request.getConfirmPassword();

        if (currentPassword.trim().isEmpty() || newPassword.trim().isEmpty() || confirmPassword.trim().isEmpty()) {
            response.put("error", "Current password, new password, and confirmation are required.");
            return response;
        }

        Optional<User> userOptional = userRepository.findById(request.getUserId());
        if (userOptional.isEmpty()) {
            response.put("error", "User not found");
            return response;
        }

        User user = userOptional.get();
        String storedPassword = user.getPassword() == null ? "" : user.getPassword();

        boolean currentMatches;
        if (storedPassword.startsWith("$2a$") || storedPassword.startsWith("$2b$")) {
            currentMatches = passwordEncoder.matches(currentPassword, storedPassword);
        } else {
            currentMatches = storedPassword.equals(currentPassword);
            if (currentMatches) {
                user.setPassword(passwordEncoder.encode(currentPassword));
                userRepository.save(user);
            }
        }

        if (!currentMatches) {
            response.put("error", "Current password is incorrect.");
            return response;
        }

        if (!newPassword.equals(confirmPassword)) {
            response.put("error", "New passwords do not match.");
            return response;
        }

        if (currentPassword.equals(newPassword)) {
            response.put("error", "New password must be different from current password.");
            return response;
        }

        String passwordValidationError = getPasswordValidationError(newPassword);
        if (passwordValidationError != null) {
            response.put("error", passwordValidationError);
            return response;
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        response.put("message", "Password changed successfully.");
        return response;
    }

    private String getPasswordValidationError(String passwordInput) {
        String password = passwordInput == null ? "" : passwordInput;

        if (password.length() < 8) {
            return "Password must be at least 8 characters.";
        }

        if (!UPPERCASE_PATTERN.matcher(password).matches()) {
            return "Password must include at least one uppercase letter.";
        }

        if (!LOWERCASE_PATTERN.matcher(password).matches()) {
            return "Password must include at least one lowercase letter.";
        }

        if (!DIGIT_PATTERN.matcher(password).matches()) {
            return "Password must include at least one number.";
        }

        if (!SPECIAL_PATTERN.matcher(password).matches()) {
            return "Password must include at least one special character.";
        }

        return null;
    }

    private boolean isValidEmail(String email) {
        return EMAIL_PATTERN.matcher(email).matches();
    }

    private String normalizeEmail(String rawEmail) {
        if (rawEmail == null) {
            return "";
        }

        return rawEmail.trim().toLowerCase(Locale.ROOT);
    }

    private boolean hasResolvableDomain(String email) {
        int atIndex = email.lastIndexOf('@');

        if (atIndex < 0 || atIndex == email.length() - 1) {
            return false;
        }

        String domain = email.substring(atIndex + 1);

        return hasMxRecord(domain) || hasARecord(domain);
    }

    private boolean hasMxRecord(String domain) {
        try {
            Hashtable<String, String> env = new Hashtable<>();
            env.put("java.naming.factory.initial", "com.sun.jndi.dns.DnsContextFactory");

            DirContext context = new InitialDirContext(env);
            Attributes attributes = context.getAttributes(domain, new String[]{"MX"});

            NamingEnumeration<?> servers = attributes.get("MX").getAll();

            return servers.hasMore();
        } catch (NamingException | NullPointerException ignored) {
            return false;
        }
    }

    private boolean hasARecord(String domain) {
        try {
            InetAddress.getByName(domain);
            return true;
        } catch (Exception ignored) {
            return false;
        }
    }

    private String generateTwoFaCode() {
        int code = 100000 + RANDOM.nextInt(900000);
        return String.valueOf(code);
    }

    private void saveLoginLog(Long userId, String email, String role, boolean successful, String message) {
        LoginLog log = new LoginLog();

        log.setUserId(userId);
        log.setEmail(email);
        log.setRole(role);
        log.setSuccessful(successful);
        log.setMessage(message);
        log.setLoginTime(LocalDateTime.now(ZoneId.of("Europe/Istanbul")));

        loginLogRepository.save(log);
    }

    public Optional<UserProfileDto> getProfileByUserId(Long userId) {
        if (userId == null) {
            return Optional.empty();
        }
        return userRepository.findById(userId).map(this::toUserProfileDto);
    }

    public Map<String, String> updateProfile(UpdateProfileRequest request) {
        Map<String, String> response = new HashMap<>();
        if (request == null || request.getUserId() == null) {
            response.put("error", "User id is required");
            return response;
        }
        String fullName = request.getFullName() == null ? "" : request.getFullName().trim();
        if (fullName.isEmpty()) {
            response.put("error", "Full name is required");
            return response;
        }
        Optional<User> userOptional = userRepository.findById(request.getUserId());
        if (userOptional.isEmpty()) {
            response.put("error", "User not found");
            return response;
        }
        User user = userOptional.get();

        String phoneRaw = trimOrNull(request.getPhone());
        if (phoneRaw == null) {
            response.put("error", "Phone is required");
            return response;
        }
        String phoneE164 = normalizeTurkishMobileToE164(phoneRaw);
        if (phoneE164 == null) {
            response.put("error", "Enter a valid Turkish mobile number (e.g. 0554 xxx xx xx)");
            return response;
        }

        String locationValue = trimOrNull(request.getLocation());
        if (locationValue == null) {
            response.put("error", "Province / district is required");
            return response;
        }

        if (user.getRole() == Role.ADOPTER) {
            String addressValue = trimOrNull(request.getAddressLine());
            if (addressValue == null) {
                response.put("error", "Street address is required");
                return response;
            }
            if (addressValue.length() < MIN_STREET_ADDRESS_LENGTH) {
                response.put("error", "Street address must be at least 10 characters");
                return response;
            }
            if (request.getBirthYear() == null) {
                response.put("error", "Birth year is required");
                return response;
            }
            int year = request.getBirthYear();
            int currentYear = LocalDateTime.now(ZoneId.of("Europe/Istanbul")).getYear();
            if (year < 1900 || year > currentYear - 18) {
                response.put("error", "Enter a valid birth year (you must be at least 18)");
                return response;
            }
            String genderValue = request.getGender() == null ? "" : request.getGender().trim().toUpperCase(Locale.ROOT);
            if (!genderValue.equals("MALE")
                    && !genderValue.equals("FEMALE")) {
                response.put("error", "Gender is required");
                return response;
            }
        }

        boolean draft = hasDraftAdoptionRequest(request.getUserId());
        if (draft) {
            if (profileTextChanged(phoneE164, user.getPhone())) {
                response.put("error", "You cannot change phone or address while an adoption request is in progress.");
                return response;
            }
            if (profileTextChanged(request.getLocation(), user.getLocation())) {
                response.put("error", "You cannot change phone or address while an adoption request is in progress.");
                return response;
            }
            if (profileTextChanged(request.getAddressLine(), user.getAddressLine())) {
                response.put("error", "You cannot change phone or address while an adoption request is in progress.");
                return response;
            }
            if (!Objects.equals(request.getBirthYear(), user.getBirthYear())) {
                response.put("error", "You cannot change phone or address while an adoption request is in progress.");
                return response;
            }
            if (profileTextChanged(request.getGender(), user.getGender())) {
                response.put("error", "You cannot change phone or address while an adoption request is in progress.");
                return response;
            }
        }

        user.setFullName(fullName);
        user.setPhone(phoneE164);
        user.setLocation(locationValue);
        if (user.getRole() == Role.ADOPTER) {
            user.setAddressLine(trimOrNull(request.getAddressLine()));
            user.setBirthYear(request.getBirthYear());
            user.setGender(trimOrNull(request.getGender()));
        }
        userRepository.save(user);
        response.put("message", "Profile updated");
        return response;
    }

    public Map<String, String> completeAdopterProfile(CompleteAdopterProfileRequest request) {
        Map<String, String> response = new HashMap<>();
        if (request == null || request.getUserId() == null) {
            response.put("error", "User id is required");
            return response;
        }
        String fn = request.getFirstName() == null ? "" : request.getFirstName().trim();
        String ln = request.getLastName() == null ? "" : request.getLastName().trim();
        if (fn.isEmpty()) {
            response.put("error", "First name is required");
            return response;
        }
        if (ln.isEmpty()) {
            response.put("error", "Last name is required");
            return response;
        }
        String combinedName = (fn + " " + ln).trim();
        String address = request.getAddressLine() == null ? "" : request.getAddressLine().trim();
        if (address.isEmpty()) {
            response.put("error", "Street address is required");
            return response;
        }
        if (address.length() < MIN_STREET_ADDRESS_LENGTH) {
            response.put("error", "Street address must be at least 10 characters");
            return response;
        }
        String locationValue = trimOrNull(request.getLocation());
        if (locationValue == null) {
            response.put("error", "Province and district are required");
            return response;
        }
        if (request.getBirthYear() == null) {
            response.put("error", "Birth year is required");
            return response;
        }
        int year = request.getBirthYear();
        int currentYear = LocalDateTime.now(ZoneId.of("Europe/Istanbul")).getYear();
        if (year < 1900 || year > currentYear - 18) {
            response.put("error", "Enter a valid birth year (you must be at least 18).");
            return response;
        }
        String gender = request.getGender() == null ? "" : request.getGender().trim().toUpperCase(Locale.ROOT);
        if (!gender.equals("MALE")
                && !gender.equals("FEMALE")) {
            response.put("error", "Gender selection is required");
            return response;
        }

        Optional<User> userOptional = userRepository.findById(request.getUserId());
        if (userOptional.isEmpty()) {
            response.put("error", "User not found");
            return response;
        }
        User user = userOptional.get();
        if (user.getRole() != Role.ADOPTER) {
            response.put("error", "This step is only for adopters");
            return response;
        }
        if (Boolean.TRUE.equals(user.getAdopterProfileCompleted())) {
            response.put("message", "Profile was already complete");
            return response;
        }

        user.setFullName(combinedName);
        user.setAddressLine(address);
        user.setLocation(locationValue);
        user.setBirthYear(year);
        user.setGender(gender);
        user.setAdopterProfileCompleted(Boolean.TRUE);
        userRepository.save(user);
        response.put("message", "Profile completed");
        response.put("fullName", combinedName);
        return response;
    }

    public Map<String, String> completeOwnerProfile(CompleteOwnerProfileRequest request) {
        Map<String, String> response = new HashMap<>();
        if (request == null || request.getUserId() == null) {
            response.put("error", "User id is required");
            return response;
        }
        String listingType = request.getOwnerListingType() == null
                ? ""
                : request.getOwnerListingType().trim().toUpperCase(Locale.ROOT);
        if (!listingType.equals("SHELTER") && !listingType.equals("OWNER")) {
            response.put("error", "Select whether you list as a shelter or as an owner (private listings)");
            return response;
        }

        Optional<User> userOptional = userRepository.findById(request.getUserId());
        if (userOptional.isEmpty()) {
            response.put("error", "User not found");
            return response;
        }
        User user = userOptional.get();
        if (user.getRole() != Role.OWNER) {
            response.put("error", "This step is only for pet owners");
            return response;
        }
        if (Boolean.TRUE.equals(user.getOwnerProfileCompleted())) {
            response.put("message", "Profile was already complete");
            return response;
        }

        user.setOwnerListingType(listingType);
        user.setOwnerProfileCompleted(Boolean.TRUE);
        userRepository.save(user);
        response.put("message", "Profile completed");
        response.put("ownerListingType", listingType);
        return response;
    }

    @Transactional
    public Map<String, String> deleteAccount(DeleteAccountRequest request) {
        Map<String, String> response = new HashMap<>();
        if (request == null || request.getUserId() == null) {
            response.put("error", "User id is required");
            return response;
        }
        Long userId = request.getUserId();
        Optional<User> userOptional = userRepository.findById(userId);
        if (userOptional.isEmpty()) {
            response.put("error", "User not found");
            return response;
        }
        User user = userOptional.get();
        if (adminConfig.isProtectedAdmin(user)) {
            response.put("error", "Admin accounts cannot be deleted");
            return response;
        }

        savedAnimalRepository.deleteByUserId(userId);

        List<Long> animalIds = jdbcTemplate.query(
                SQL_ANIMAL_IDS_BY_OWNER,
                (rs, rowNum) -> rs.getLong("id"),
                userId);
        if (!animalIds.isEmpty()) {
            List<Animal> ownedAnimals = new ArrayList<>(animalRepository.findAllById(animalIds));
            savedAnimalRepository.deleteByAnimalIdIn(animalIds);
            animalRepository.deleteAll(ownedAnimals);
        }

        adoptionRequestRepository.deleteByUserId(userId);
        adopterProfileRepository.deleteByUserId(userId);
        loginLogRepository.deleteByUserId(userId);
        userRepository.deleteById(userId);

        response.put("message", "Account deleted");
        return response;
    }

    private String trimOrNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }


    private String normalizeTurkishMobileToE164(String raw) {
        if (raw == null) {
            return null;
        }
        String digits = raw.replaceAll("\\D", "");
        if (digits.startsWith("90")) {
            digits = digits.substring(2);
        }
        if (digits.startsWith("0")) {
            digits = digits.substring(1);
        }
        if (!digits.matches("^5\\d{9}$")) {
            return null;
        }
        return "+90" + digits;
    }

    private UserProfileDto toUserProfileDto(User user) {
        UserProfileDto dto = new UserProfileDto();
        dto.setUserId(user.getId());
        dto.setFullName(user.getFullName());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        dto.setLocation(user.getLocation());
        dto.setAddressLine(user.getAddressLine());
        dto.setBirthYear(user.getBirthYear());
        dto.setGender(user.getGender());
        dto.setRole(user.getRole().name());
        boolean adopterDone = user.getRole() != Role.ADOPTER
                || user.getAdopterProfileCompleted() == null
                || Boolean.TRUE.equals(user.getAdopterProfileCompleted());
        dto.setAdopterProfileCompleted(adopterDone);
        boolean ownerDone = user.getRole() != Role.OWNER
                || user.getOwnerProfileCompleted() == null
                || Boolean.TRUE.equals(user.getOwnerProfileCompleted());
        dto.setOwnerProfileCompleted(ownerDone);
        dto.setOwnerListingType(user.getOwnerListingType());
        dto.setHasDraftAdoptionRequest(hasDraftAdoptionRequest(user.getId()));
        return dto;
    }

    private boolean hasDraftAdoptionRequest(Long userId) {
        if (userId == null) {
            return false;
        }
        return adoptionRequestRepository.existsByUserIdAndRequestPhase(userId, "DRAFT");
    }

    private boolean profileTextChanged(String incoming, String stored) {
        return !Objects.equals(trimOrNull(incoming), trimOrNull(stored));
    }

    private String adopterProfileCompletedResponseValue(User user) {
        if (user.getRole() != Role.ADOPTER) {
            return "true";
        }
        boolean done = user.getAdopterProfileCompleted() == null
                || Boolean.TRUE.equals(user.getAdopterProfileCompleted());
        return done ? "true" : "false";
    }

    private String ownerProfileCompletedResponseValue(User user) {
        if (user.getRole() != Role.OWNER) {
            return "true";
        }
        boolean done = user.getOwnerProfileCompleted() == null
                || Boolean.TRUE.equals(user.getOwnerProfileCompleted());
        return done ? "true" : "false";
    }

    private static class PendingRegistration {
        private final String fullName;
        private final String password;
        private final String location;
        private final String phone;
        private final Role role;
        private final String code;
        private final long expiresAt;

        private PendingRegistration(
                String fullName,
                String password,
                String location,
                String phone,
                Role role,
                String code,
                long expiresAt
        ) {
            this.fullName = fullName;
            this.password = password;
            this.location = location;
            this.phone = phone;
            this.role = role;
            this.code = code;
            this.expiresAt = expiresAt;
        }
    }

    private static class PendingLogin {
        private final String code;
        private final long expiresAt;

        private PendingLogin(String code, long expiresAt) {
            this.code = code;
            this.expiresAt = expiresAt;
        }
    }

    private static class PendingPasswordReset {
        private final String code;
        private final long expiresAt;
        private final boolean verified;

        private PendingPasswordReset(String code, long expiresAt, boolean verified) {
            this.code = code;
            this.expiresAt = expiresAt;
            this.verified = verified;
        }
    }
}