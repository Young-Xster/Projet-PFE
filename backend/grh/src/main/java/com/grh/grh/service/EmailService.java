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
    public void sendInterviewInvitation(
        String toEmail,
        String candidateName,
        String jobTitle,
        String interviewDate
    ) {
        String subject = appName + " - Interview Invitation";
        String body = String.format("""
            <html><body>
            <h2>Interview Invitation</h2>
            <p>Dear %s,</p>
            <p>We are pleased to invite you to an interview for the <b>%s</b> position.</p>
            <p><b>Interview Date & Time:</b> %s</p>
            <p>Please let us know if you have any questions or require rescheduling.</p>
            <p>Regards,<br>%s Team</p>
            </body></html>
            """, candidateName, jobTitle, interviewDate, appName);
            
        sendHtmlEmail(toEmail, subject, body);
    }

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

    @Async
    public void sendApplicationReceivedEmail(
        String toEmail, String candidateName, String jobTitle, String companyName
    ) {
        String subject = companyName + " - Application Received";
        String body = """
            <html><body>
            <h2>Application Received</h2>
            <p>Dear %s,</p>
            <p>Thank you for your interest in the <b>%s</b> position at <b>%s</b>.</p>
            <p>We have successfully received your application and our HR team will review it carefully.</p>
            <p>We will contact you regarding the next steps in the recruitment process.</p>
            <br>
            <p>Best regards,</p>
            <p><b>%s — Human Resources</b></p>
            </body></html>
            """.formatted(candidateName, jobTitle, companyName, companyName);

        sendHtmlEmail(toEmail, subject, body);
    }

    @Async
    public void sendCandidateAcceptedEmail(
        String toEmail, String candidateName, String jobTitle, String companyName
    ) {
        String subject = companyName + " - Congratulations! Your Application Has Been Accepted";
        String body = """
            <html><body>
            <h2>Application Accepted</h2>
            <p>Dear %s,</p>
            <p>We are pleased to inform you that your application for the <b>%s</b> position
            at <b>%s</b> has been <b>accepted</b>.</p>
            <p>A member of our HR team will contact you shortly to discuss the next steps,
            including your start date and onboarding process.</p>
            <p>We look forward to welcoming you to our team!</p>
            <br>
            <p>Warm regards,</p>
            <p><b>%s — Human Resources</b></p>
            </body></html>
            """.formatted(candidateName, jobTitle, companyName, companyName);

        sendHtmlEmail(toEmail, subject, body);
    }

    @Async
    public void sendCandidateRejectedEmail(
        String toEmail, String candidateName, String jobTitle, String companyName
    ) {
        String subject = companyName + " - Update on Your Application";
        String body = """
            <html><body>
            <h2>Application Update</h2>
            <p>Dear %s,</p>
            <p>Thank you for your interest in the <b>%s</b> position at <b>%s</b>
            and for the time you invested in the application process.</p>
            <p>After careful consideration, we regret to inform you that we have decided
            to move forward with other candidates whose profiles more closely match
            our current requirements.</p>
            <p>We truly appreciate your interest in joining our team and encourage you
            to apply for future openings that match your qualifications.</p>
            <p>We wish you all the best in your career journey.</p>
            <br>
            <p>Kind regards,</p>
            <p><b>%s — Human Resources</b></p>
            </body></html>
            """.formatted(candidateName, jobTitle, companyName, companyName);

        sendHtmlEmail(toEmail, subject, body);
    }

    @Async
    public void sendSubcontractorPortalAccessEmail(
        String toEmail,
        String subcontractorName,
        String companyName,
        String accessLink,
        long expirationMinutes
    ) {
        String subject = companyName + " - Subcontractor Portal Access Link";
        String safeName = (subcontractorName == null || subcontractorName.isBlank()) ? "Subcontractor" : subcontractorName;

        String body = """
            <html><body>
            <h2>Subcontractor Portal Access</h2>
            <p>Hello %s,</p>
            <p>You requested access to your subcontractor portal for <b>%s</b>.</p>
            <p>This secure link is valid for <b>%d minutes</b> and can only be used once:</p>
            <p><a href=\"%s\">Open Subcontractor Portal</a></p>
            <p>If the button does not work, copy and paste this URL in your browser:</p>
            <p>%s</p>
            <br>
            <p>If you did not request this access, you can safely ignore this email.</p>
            <p>Regards,<br><b>%s</b></p>
            </body></html>
            """.formatted(
            safeName,
            companyName,
            expirationMinutes,
            accessLink,
            accessLink,
            appName
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