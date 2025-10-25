import hashlib
import base64

def hash_and_encode(text):
    # Step 1: Hash the input text using SHA-256
    sha256_hash = hashlib.sha256(text.encode('utf-8')).digest()
    
    # Step 2: Base64 URL encode the SHA-256 hash (remove padding)
    base64_encoded = base64.urlsafe_b64encode(sha256_hash).rstrip(b'=').decode('utf-8')
    
    return base64_encoded

# Example usage
if __name__ == "__main__":
    text = input("Enter the text to hash: ")
    encoded_result = hash_and_encode(text)
    print("Base64 URL Encoded SHA-256 hash:", encoded_result)