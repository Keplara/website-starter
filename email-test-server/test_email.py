from email.message import EmailMessage
import smtplib

# Build the message
msg = EmailMessage()
msg["From"] = "api@example.com"
msg["To"] = "user@example.com"
msg["Subject"] = "Hello from local API"
msg.set_content("This is a test email sent to the local aiosmtpd catcher.")

# Connect to the local SMTP server
with smtplib.SMTP("localhost", 1025) as smtp:
    smtp.send_message(msg)

print("✅ Email sent to local SMTP server.")