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
