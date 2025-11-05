#  file: smtp_catcher.py
from aiosmtpd.controller import Controller

class MailCatcher:
    async def handle_DATA(self, server, session, envelope):
        print("\n=== New Email Received ===")
        print(f"From: {envelope.mail_from}")
        print(f"To: {envelope.rcpt_tos}")
        print(f"Content:\n{envelope.content.decode('utf8', errors='replace')}")
        print("===========================\n")
        return '250 OK'

if __name__ == "__main__":
    controller = Controller(MailCatcher(), hostname="127.0.0.1", port=1025)
    controller.start()
    print("✅ SMTP Catcher running at localhost:1025")
    print("Press Ctrl+C to stop.")
    try:
        import time
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping server...")
        controller.stop()