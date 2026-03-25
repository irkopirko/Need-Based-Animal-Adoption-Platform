package pavia;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.Base64;
import java.nio.charset.StandardCharsets;
import java.util.regex.Pattern;

public class User {

    private static int _nextId = 1;
    private static final List<String> _registeredEmails = new ArrayList<>();

    private int userId;
    protected String fullName = "";
    protected String email = "";
    protected String password = "";
    protected String location = "";
    protected String phoneNumber = "";
    protected String role = "";

    private String _sessionToken;

    public User(String fullName, String email, String password, String location, String phoneNumber, String role) {
        this.fullName = fullName;
        this.email = email;
        this.password = password;
        this.location = location;
        this.phoneNumber = phoneNumber;
        this.role = role;
    }

    protected User() {}

    public int getUserId() { return userId; }
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public String getPassword() { return password; }
    public String getLocation() { return location; }
    public String getPhoneNumber() { return phoneNumber; }
    public String getRole() { return role; }

    public void register(boolean acceptedPolicy) {
        if (fullName == null || fullName.trim().isEmpty())
            throw new IllegalArgumentException("Full name is required.");
        if (email == null || email.trim().isEmpty())
            throw new IllegalArgumentException("Email is required.");
        if (password == null || password.trim().isEmpty())
            throw new IllegalArgumentException("Password is required.");
        if (location == null || location.trim().isEmpty())
            throw new IllegalArgumentException("Location is required.");
        if (phoneNumber == null || phoneNumber.trim().isEmpty())
            throw new IllegalArgumentException("Phone number is required.");

        if (!Pattern.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$", email))
            throw new IllegalArgumentException("Email format is invalid.");

        if (!role.equals("adopter") && !role.equals("owner_shelter"))
            throw new IllegalArgumentException("Role must be 'adopter' or 'owner_shelter'.");

        if (_registeredEmails.stream().anyMatch(e -> e.equalsIgnoreCase(email)))
            throw new IllegalStateException(
                "An account with email '" + email + "' already exists. Please log in or reset your password.");

        if (!acceptedPolicy)
            throw new IllegalStateException("You must accept the terms and privacy policy to register.");

        userId = _nextId++;
        _registeredEmails.add(email);

        password = hashPassword(password);

        System.out.println("Account created successfully. Welcome, " + fullName + "! (Role: " + role + ")");
    }

    public String login(String email, String password) {
        if (!this.email.equalsIgnoreCase(email))
            throw new SecurityException("Invalid email or password.");

        if (!verifyPassword(password, this.password))
            throw new SecurityException("Invalid email or password.");

        _sessionToken = UUID.randomUUID().toString();
        System.out.println("Login successful. Session started for " + fullName + ".");
        return _sessionToken;
    }

    public void logout() {
        if (_sessionToken == null) {
            System.out.println("No active session to log out from.");
            return;
        }
        _sessionToken = null;
        System.out.println(fullName + " has been logged out.");
    }

    public boolean isLoggedIn() {
        return _sessionToken != null;
    }

    private static String hashPassword(String plainText) {
        return Base64.getEncoder().encodeToString(plainText.getBytes(StandardCharsets.UTF_8));
    }

    private static boolean verifyPassword(String plainText, String hashed) {
        return hashPassword(plainText).equals(hashed);
    }
}
