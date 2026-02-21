package com.grh.grh.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.name:GRH System}")
    private String appName;

    @Async
    public void sendLeaveRequestConfirmation(
        String toEmail,
        String employeeName,
        String leaveTypeName,
        String startDate,
        String endDate,
        String totalDays
    ) {
        String subject = appName + " - Leave Request Submitted";
        String body = """
            <html><body>
            <h2>Leave Request Submitted</h2>
            <p>Dear %s,</p>
            <p>Your leave request has been submitted and is pending review.</p>
            <table border="1" cellpadding="8">
                <tr><td><b>Leave Type</b></td><td>%s</td></tr>
                <tr><td><b>Start Date</b></td><td>%s</td></tr>
                <tr><td><b>End Date</b></td><td>%s</td></tr>
                <tr><td><b>Total Days</b></td><td>%s</td></tr>
                <tr><td><b>Status</b></td><td>Pending</td></tr>
            </table>
            <p>You will be notified once your request is reviewed.</p>
            <p>Regards,<br>%s</p>
            </body></html>
            """.formatted(employeeName, leaveTypeName, startDate, endDate, totalDays, appName);

        sendHtmlEmail(toEmail, subject, body);
    }

    @Async
    public void sendLeaveRequestResult(
        String toEmail,
        String employeeName,
        String leaveTypeName,
        String startDate,
        String endDate,
        String status,
        String reviewerNotes
    ) {
        boolean approved = "approved".equalsIgnoreCase(status);
        String subject = appName + " - Leave Request " + (approved ? "Approved" : "Rejected");
        String statusColor = approved ? "green" : "red";

        String notesRow = (reviewerNotes != null && !reviewerNotes.isBlank())
            ? "<tr><td><b>Notes</b></td><td>" + reviewerNotes + "</td></tr>"
            : "";

        String body = """
            <html><body>
            <h2>Leave Request %s</h2>
            <p>Dear %s,</p>
            <p>Your leave request has been <b style="color:%s">%s</b>.</p>
            <table border="1" cellpadding="8">
                <tr><td><b>Leave Type</b></td><td>%s</td></tr>
                <tr><td><b>Start Date</b></td><td>%s</td></tr>
                <tr><td><b>End Date</b></td><td>%s</td></tr>
                <tr><td><b>Status</b></td><td style="color:%s"><b>%s</b></td></tr>
                %s
            </table>
            <p>Regards,<br>%s</p>
            </body></html>
            """.formatted(
                status.toUpperCase(), employeeName,
                statusColor, status.toUpperCase(),
                leaveTypeName, startDate, endDate,
                statusColor, status.toUpperCase(),
                notesRow, appName
            );

        sendHtmlEmail(toEmail, subject, body);
    }

    private void sendHtmlEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("Email sent to: {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
}