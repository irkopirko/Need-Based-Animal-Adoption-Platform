package com.adoptionplatform.backend.service;

import com.adoptionplatform.backend.dto.LoginRequest;
import com.adoptionplatform.backend.dto.RegisterRequest;
import com.adoptionplatform.backend.entity.Role;
import com.adoptionplatform.backend.entity.User;
import com.adoptionplatform.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import javax.naming.NamingEnumeration;
import javax.naming.NamingException;
import javax.naming.directory.Attributes;
import javax.naming.directory.DirContext;
import javax.naming.directory.InitialDirContext;
import java.net.InetAddress;
import java.security.SecureRandom;
import java.util.HashMap;
import java.util.Hashtable;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final EmailService emailService;
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final long EMAIL_VERIFICATION_EXPIRY_MS = 10 * 60 * 1000;
    private final Map<String, PendingRegistration> pendingRegistrations = new ConcurrentHashMap<>();
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
    );

    public AuthService(UserRepository userRepository, EmailService emailService) {
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

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

        Role role;
        try {
            role = Role.valueOf(request.getRole().toUpperCase());
        } catch (IllegalArgumentException ex) {
            response.put("error", "Invalid role");
            return response;
        }

        String verificationCode = generateTwoFaCode();
        pendingRegistrations.put(
                email,
                new PendingRegistration(
                        request.getFullName(),
                        request.getPassword(),
                        request.getLocation(),
                        request.getPhone(),
                        role,
                        verificationCode,
                        System.currentTimeMillis() + EMAIL_VERIFICATION_EXPIRY_MS
                )
        );

        try {
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
            response.put("error", "User not found");
            return response;
        }

        User user = userOptional.get();

        if (!user.getPassword().equals(request.getPassword())) {
            response.put("error", "Wrong password");
            return response;
        }

        response.put("message", "Login successful");
        response.put("role", user.getRole().name());
        response.put("fullName", user.getFullName());
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
        user.setPassword(pendingRegistration.password);
        user.setLocation(pendingRegistration.location);
        user.setPhone(pendingRegistration.phone);
        user.setRole(pendingRegistration.role);
        user.setEmailVerified(true);
        user.setEmailVerificationCode(null);
        user.setEmailVerificationExpiresAt(null);
        userRepository.save(user);
        pendingRegistrations.remove(email);

        response.put("message", "Email verified successfully");
        response.put("role", user.getRole().name());
        response.put("fullName", user.getFullName());
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

}