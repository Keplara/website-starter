package com.mysite.auth_service.service;

import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.ses.SesClient;
import software.amazon.awssdk.services.ses.model.Content;
import software.amazon.awssdk.services.ses.model.Destination;
import software.amazon.awssdk.services.ses.model.Message;
import software.amazon.awssdk.services.ses.model.Body;
import software.amazon.awssdk.services.ses.model.SendEmailRequest;

import java.util.Properties;
import jakarta.mail.internet.MimeMessage;

import org.springframework.stereotype.Service;

import com.mysite.auth_service.configuration.EmailProperties;
import com.mysite.auth_service.configuration.exceptions.AuthApiException;

import jakarta.mail.MessagingException;
import jakarta.mail.Session;
import jakarta.mail.Transport;
import jakarta.mail.internet.InternetAddress;
import lombok.NonNull;

@Service
public class SimpleEmailService {
        private EmailProperties emailProperties;

        public SimpleEmailService() {
        }

        public void sendEmail(String emailAddress, String subject, @NonNull String body)
                        throws AuthApiException {

                if ("ses".equalsIgnoreCase(emailProperties.getMode())) {
                        sendViaSES(emailAddress, subject, body);
                } else if ("smtp".equalsIgnoreCase(emailProperties.getMode())) {
                        sendViaSMTP(emailAddress, subject, body);
                } else {
                        throw new AuthApiException("Unknown email mode: " + emailProperties.getMode());
                }
        }

        private void sendViaSES(String emailAddress, String subject, String body)
                        throws AuthApiException {
                Region region = Region.US_EAST_1;
                try (SesClient client = SesClient.builder()
                                .region(region)
                                .credentialsProvider(DefaultCredentialsProvider.create())
                                .build()) {
                        Destination destination = Destination.builder()
                                        .toAddresses(emailAddress)
                                        .build();
                        Content content = Content.builder().data(body).build();
                        Message msg = Message.builder()
                                        .subject(Content.builder().data(subject).build())
                                        .body(Body.builder().html(content).build())
                                        .build();
                        SendEmailRequest request = SendEmailRequest.builder()
                                        .source("no-reply@mysite.com")
                                        .destination(destination)
                                        .message(msg)
                                        .build();
                        client.sendEmail(request);
                } catch (Exception e) {
                        throw new AuthApiException("Failed to send email via SES");
                }
        }

        private void sendViaSMTP(String emailAddress, String subject, String body)
                        throws AuthApiException {
                Properties props = new Properties();
                props.put("mail.smtp.host", emailProperties.getSmtp().getHost());
                props.put("mail.smtp.port", String.valueOf(emailProperties.getSmtp().getPort()));
                props.put("mail.smtp.auth", "false");
                props.put("mail.smtp.starttls.enable", "false");

                Session session = Session.getInstance(props);

                try {
                        MimeMessage message = new MimeMessage(session);
                        message.setFrom(new InternetAddress("no-reply@mysite.com"));
                        message.setRecipients(MimeMessage.RecipientType.TO,
                                        InternetAddress.parse(emailAddress));
                        message.setSubject(subject);
                        message.setContent(body, "text/html");

                        // Send
                        Transport.send(message);

                } catch (MessagingException e) {
                        throw new AuthApiException("Failed to send email via SMTP");
                }
        }
}
