package com.adoptionplatform.backend.service;

import com.adoptionplatform.backend.dto.LoginRequest;
import com.adoptionplatform.backend.dto.RegisterRequest;
import com.adoptionplatform.backend.entity.Role;
import com.adoptionplatform.backend.entity.User;
import com.adoptionplatform.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import com.adoptionplatform.backend.entity.LoginLog;
import com.adoptionplatform.backend.repository.LoginLogRepository;
import java.time.LocalDateTime;
import java.time.ZoneId;

import org.springframework.beans.factory.annotation.Autowired;

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

    @Autowired
private LoginLogRepository loginLogRepository;

@Autowired
private UserRepository userRepository;

@Autowired
private EmailService emailService;
    /*private final LoginLogRepository loginLogRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;*/
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final long EMAIL_VERIFICATION_EXPIRY_MS = 10 * 60 * 1000;
    private final Map<String, PendingRegistration> pendingRegistrations = new ConcurrentHashMap<>();
    private final Map<String, PendingLogin> pendingLogins = new ConcurrentHashMap<>();
    private final Map<String, PendingPasswordReset> pendingPasswordResets = new ConcurrentHashMap<>();
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
    );
    private static final Pattern UPPERCASE_PATTERN = Pattern.compile(".*[A-Z].*");
    private static final Pattern LOWERCASE_PATTERN = Pattern.compile(".*[a-z].*");
    private static final Pattern DIGIT_PATTERN = Pattern.compile(".*\\d.*");
    private static final Pattern SPECIAL_PATTERN = Pattern.compile(".*[^A-Za-z0-9].*");

    /*public AuthService(UserRepository userRepository, EmailService emailService, LoginLogRepository loginlogRepository) {
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.loginLogRepository=LoginLogRepository;
    } */
   
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
            saveLoginLog(null, request.getEmail(), null, false, "User not found");
            response.put("error", "User not found");
            return response;
        }
            User user = userOptional.get();//

        if (!user.getPassword().equals(request.getPassword())) {
            saveLoginLog(user.getId(), user.getEmail(), user.getRole().toString(), false, "Wrong password");
            response.put("error", "Wrong password");
            return response;
        }

        String loginCode = generateTwoFaCode();
        pendingLogins.put(email, new PendingLogin(loginCode, System.currentTimeMillis() + EMAIL_VERIFICATION_EXPIRY_MS));
         //success
        saveLoginLog(user.getId(), user.getEmail(), user.getRole().toString(), true, "Login successful");


        try {
            emailService.sendLoginCode(email, loginCode);
        } catch (Exception exception) {
            pendingLogins.remove(email);
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
            response.put("error", "Login verification session not found. Please login again.");
            return response;
        }

        if (System.currentTimeMillis() > pendingLogin.expiresAt) {
            pendingLogins.remove(email);
            response.put("error", "Verification code expired. Please login again.");
            return response;
        }

        if (!pendingLogin.code.equals(codeInput.trim())) {
            response.put("error", "Invalid verification code");
            return response;
        }

        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isEmpty()) {
            pendingLogins.remove(email);
            response.put("error", "User not found");
            return response;
        }

        User user = userOptional.get();
        pendingLogins.remove(email);
        response.put("message", "Login successful");
        response.put("role", user.getRole().name());
        response.put("fullName", user.getFullName());
        response.put("userId", String.valueOf(user.getId()));
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
        pendingLogins.put(email, new PendingLogin(loginCode, System.currentTimeMillis() + EMAIL_VERIFICATION_EXPIRY_MS));

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
        user.setPassword(pendingRegistration.password);
        user.setLocation(pendingRegistration.location);
        user.setPhone(pendingRegistration.phone);
        user.setRole(pendingRegistration.role);
        user.setEmailVerified(true);
        user.setEmailVerificationCode(null);
        user.setEmailVerificationExpiresAt(null);
        user.setRegistrationTime(LocalDateTime.now(ZoneId.of("Europe/Istanbul")));
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
        pendingPasswordResets.put(email, new PendingPasswordReset(resetCode, System.currentTimeMillis() + EMAIL_VERIFICATION_EXPIRY_MS, false));

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

        pendingPasswordResets.put(email, new PendingPasswordReset(pendingReset.code, pendingReset.expiresAt, true));
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

   /*  private boolean hasResolvableDomain(String email) {
        int atIndex = email.lastIndexOf('@');
        if (atIndex < 0 || atIndex == email.length() - 1) {
            return false;
        }

        String domain = email.substring(atIndex + 1);
        return hasMxRecord(domain) || hasARecord(domain);
    }*/
   private boolean hasResolvableDomain(String email) {
    int atIndex = email.lastIndexOf('@');
    if (atIndex < 0 || atIndex == email.length() - 1) {
        return false;
    }

    String domain = email.substring(atIndex + 1);

    //domain formatı düzgün mü kontrol
    return domain.contains(".") && domain.length() >= 3;
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


}