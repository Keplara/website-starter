// tokenVerifier.js
// Utility to verify JWT access tokens using JWKS from your authorization server
import jsonwebtoken from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';


// JWKS endpoint served by Spring Authorization Server: /.well-known/jwks.json
const OAUTH_SERVER_BASE_URL = process.env['OAUTH_SERVER_BASE_URL'] || 'http://localhost:8084';
const JWKS_URI = process.env['JWKS_URI'] || `${OAUTH_SERVER_BASE_URL}/.well-known/jwks.json`;

const jwks = jwksClient({
  jwksUri: JWKS_URI,
  cache: true,
  rateLimit: true
});

function getKey(header: any, callback: any) {
  jwks.getSigningKey(header.kid, function (err: any, key: any) {
    if (err) return callback(err);
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

/**
 * Verifies a JWT access token and returns the decoded payload if valid.
 * @param {string} token - The JWT access token
 * @returns {Promise<object>} - Resolves with decoded payload if valid, rejects if invalid
 */
export function verifyAccessToken(token: any) {
  return new Promise((resolve, reject) => {
    // Peek at header to decide verification strategy
    const decodedUnverified: any = jsonwebtoken.decode(token, { complete: true });
    const alg = decodedUnverified?.header?.alg;

    if (alg === 'RS256') {
      jsonwebtoken.verify(token, getKey, { algorithms: ['RS256'] }, (err: any, decoded: any) => {
        if (err) return reject(err);
        resolve(decoded);
      });
      return;
    }

    // Access tokens should not be HS256; reject non-RS256 formats here
    reject(new Error(`Unsupported access token alg: ${alg || 'unknown'}`));
  });
}
