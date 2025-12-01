import crypto from 'crypto';

/**
 * Generate PKCE code verifier and code challenge (S256).
 * Returns an object with the plain codeVerifier and the base64url-encoded SHA256 codeChallenge.
 */
export function generatePKCE(): { codeVerifier: string; codeChallenge: string } {
  // Helper: base64url encode without padding
  const base64url = (buffer: Buffer) =>
    buffer
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

  // Generate a high-entropy random verifier (32 bytes -> 43 chars base64url)
  const codeVerifier = base64url(crypto.randomBytes(32));

  // SHA256 and base64url-encode the verifier to create the challenge
  const hash = crypto.createHash('sha256').update(codeVerifier).digest();
  const codeChallenge = base64url(hash);

  return { codeVerifier, codeChallenge };
}