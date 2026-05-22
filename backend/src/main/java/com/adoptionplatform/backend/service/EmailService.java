package com.adoptionplatform.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendVerificationCode(String recipientEmail, String code) {
        sendCodeEmail(
                recipientEmail,
                "Verify your Pavia account",
                "Use the verification code below to complete your registration.",
                code
        );
    }

    public void sendLoginCode(String recipientEmail, String code) {
        sendCodeEmail(
                recipientEmail,
                "Complete your Pavia login",
                "Use the verification code below to securely sign in.",
                code
        );
    }

    public void sendPasswordResetCode(String recipientEmail, String code) {
        sendCodeEmail(
                recipientEmail,
                "Reset your Pavia password",
                "Use the verification code below to continue resetting your password.",
                code
        );
    }

    public void sendAdoptionLifecycleNotice(String recipientEmail, String subject, String body) {
        String safeBody = body == null || body.isBlank()
                ? "Your adoption activity on Pavia was updated."
                : body.trim();
        sendHtmlEmail(recipientEmail, subject, escapeHtml(safeBody));
    }

    public void sendOwnerListingPublishedNotice(
            String recipientEmail,
            String animalName,
            String listingCode,
            Long listingId
    ) {
        String safeName = animalName == null || animalName.isBlank() ? "your animal" : animalName.trim();
        String safeCode = listingCode == null || listingCode.isBlank() ? "" : listingCode.trim();
        String idLabel = listingId == null ? "—" : String.valueOf(listingId);
        String subject = "Your listing was published successfully";
        String inner = "Your animal has been listed successfully on Pavia.<br/><br/>"
                + "<strong>Animal name:</strong> " + escapeHtml(safeName) + "<br/>"
                + "<strong>Listing ID:</strong> " + escapeHtml(idLabel)
                + (safeCode.isEmpty() ? "" : "<br/><strong>Listing code:</strong> " + escapeHtml(safeCode))
                + "<br/><br/>"
                + "Your listing is now visible to adopters in compatibility matching. "
                + "View and manage it from <strong>My animal listings</strong> in your owner dashboard.";
        sendHtmlEmail(recipientEmail, subject, inner);
    }

    public void sendOwnerListingArchivedNotice(
            String recipientEmail,
            String animalName,
            String listingCode,
            Long listingId
    ) {
        String safeName = animalName == null || animalName.isBlank() ? "your listing" : animalName.trim();
        String safeCode = listingCode == null || listingCode.isBlank() ? "" : listingCode.trim();
        String subject = "Your Pavia listing was archived successfully";
        String inner = "Your listing <strong>" + escapeHtml(safeName) + "</strong>"
                + (safeCode.isEmpty() ? "" : " (" + escapeHtml(safeCode) + ")")
                + " has been archived successfully.<br/><br/>"
                + "It will no longer appear in compatibility matching for adopters. "
                + "You can restore it anytime from <strong>Listed animals → Archived</strong> "
                + "in your owner menu.";
        if (listingId != null) {
            inner += "<br/><br/>Listing ID: " + listingId;
        }
        sendHtmlEmail(recipientEmail, subject, inner);
    }

    public void sendListingModerationNotice(
            String recipientEmail,
            String listingCode,
            Long listingId,
            String action,
            String reason
    ) {
        String safeAction = action == null ? "updated" : action.trim().toLowerCase();
        String safeReason = reason == null || reason.isBlank()
                ? "A platform review determined this action was necessary."
                : reason.trim();
        String subject = "Your Pavia listing " + listingCode + " was " + safeAction;
        String inner = "Your listing " + listingCode + " (ID " + listingId + ") was "
                + safeAction + " by a platform administrator.<br/><br/>"
                + "<strong>Reason:</strong> " + escapeHtml(safeReason);
        sendHtmlEmail(recipientEmail, subject, inner);
    }

    private void sendHtmlEmail(String recipientEmail, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(recipientEmail);
            helper.setSubject(subject);
            helper.setText(buildHtmlWrapper(htmlBody), true);
            mailSender.send(message);
        } catch (Exception exception) {
            throw new RuntimeException("Failed to send email", exception);
        }
    }

    private static String buildHtmlWrapper(String innerHtml) {
        return "<div style=\"margin:0;padding:0;background:#f6f7f8;font-family:Arial,Helvetica,sans-serif;\">"
                + "<div style=\"max-width:520px;margin:24px auto;background:#ffffff;border-radius:12px;padding:24px 20px;border:1px solid #e8eaed;\">"
                + "<p style=\"margin:0;font-size:14px;line-height:1.5;color:#2c2c2c;\">"
                + innerHtml
                + "</p></div></div>";
    }

    private static String escapeHtml(String input) {
        return input
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }

    private void sendCodeEmail(String recipientEmail, String subject, String description, String code) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(recipientEmail);
            helper.setSubject(subject);
            helper.setText(buildHtmlContent(description, code), true);
            mailSender.send(message);
        } catch (Exception exception) {
            throw new RuntimeException("Failed to send email", exception);
        }
    }

    private String buildHtmlContent(String description, String code) {
        return "<div style=\"margin:0;padding:0;background:#f6f7f8;font-family:Arial,Helvetica,sans-serif;\">"
                + "<div style=\"max-width:520px;margin:24px auto;background:#ffffff;border-radius:12px;padding:24px 20px;"
                + "border:1px solid #e8eaed;text-align:center;\">"
                + "<p style=\"margin:0 0 12px 0;font-size:14px;line-height:1.5;color:#2c2c2c;\">"
                + description
                + "</p>"
                + "<p style=\"margin:0;font-size:19px;line-height:1.3;font-weight:700;letter-spacing:3px;color:#111111;\">"
                + code
                + "</p>"
                + "<p style=\"margin:14px 0 0 0;font-size:13px;line-height:1.4;color:#6b6b6b;\">"
                + "This code expires in 10 minutes."
                + "</p>"
                + "</div></div>";
    }
}
