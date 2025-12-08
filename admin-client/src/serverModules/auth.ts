import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import crypto from 'crypto';
import { generatePKCE } from './utils/generatePKCE';

const router = express.Router();

const BASE_URL = process.env['BASE_URL'] || 'http://localhost:8087';
const OAUTH_SERVER_BASE_URL = process.env['OAUTH_SERVER_BASE_URL'] || 'http://localhost:8084';
const OAUTH_CONFIG = {
  authServerUrl: `${OAUTH_SERVER_BASE_URL}/oauth2/authorize`,
  tokenUrl: `${OAUTH_SERVER_BASE_URL}/oauth2/token`,
  clientId: process.env['OAUTH_CLIENT_ID'] || 'adminAuthClient',
  clientSecret: process.env['OAUTH_CLIENT_SECRET'],
  redirectUri: `${BASE_URL}/oauth/callback`,
  scope: 'user:read product:read'
};
console.log(OAUTH_CONFIG.clientSecret)
router.get('/login', (req, res) => {
  (req.session as any).codeVerifier = undefined;
  (req.session as any).state = undefined;
  const existingToken = (req.session as any).accessToken;
  if (existingToken) {
    return res.redirect('/');
  }
  const existingState = (req.session as any).oauthState;
  const existingVerifier = (req.session as any).codeVerifier;
  if (existingState && existingVerifier) {
    return res.status(400).send('OAuth authorization already in progress. Please wait for the callback or try again later.');
  }
  if (req.headers.referer) {
    try {
      const refererUrl = new URL(req.headers.referer);
      if (refererUrl.origin === BASE_URL) {
        (req.session as any).returnTo = refererUrl.pathname + refererUrl.search;
      }
    } catch (e) { }
  }
  const state = crypto.randomBytes(32).toString('hex');
  const { codeVerifier, codeChallenge } = generatePKCE();
  (req.session as any).oauthState = state;
  (req.session as any).codeVerifier = codeVerifier;
  (req.session as any).codeChallenge = codeChallenge;
  const authUrl = new URL(OAUTH_CONFIG.authServerUrl);
  authUrl.searchParams.append('client_id', OAUTH_CONFIG.clientId);
  authUrl.searchParams.append('redirect_uri', OAUTH_CONFIG.redirectUri);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', OAUTH_CONFIG.scope);
  authUrl.searchParams.append('state', state);
  authUrl.searchParams.append('code_challenge', codeChallenge);
  authUrl.searchParams.append('code_challenge_method', 'S256');
  res.redirect(authUrl.toString());
});

// /api/callback
router.get('/oauth/callback', async (req, res) => {
  const { code, state, error, error_description } = req.query;
  if (error) {
    delete (req.session as any).oauthState;
    delete (req.session as any).codeVerifier;
    delete (req.session as any).codeChallenge;
    return res.redirect(`/?login=error&error=${error}`);
  }
  if (!state || state !== (req.session as any).oauthState) {
    return res.status(400).send('Invalid state parameter');
  }
  const codeVerifier = (req.session as any).codeVerifier;
  const storedChallenge = (req.session as any).codeChallenge;
  if (!codeVerifier) {
    return res.status(400).send('Missing PKCE code verifier - authorization may have already been processed');
  }
  if (!code) {
    return res.status(400).send('No authorization code received');
  }
  delete (req.session as any).oauthState;
  delete (req.session as any).codeVerifier;
  delete (req.session as any).codeChallenge;
  try {
    const tokenRequestBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code as string,
      redirect_uri: OAUTH_CONFIG.redirectUri,
      code_verifier: codeVerifier
    });
    const tokenResponse = await fetch(OAUTH_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${OAUTH_CONFIG.clientId}:${OAUTH_CONFIG.clientSecret}`).toString('base64')
      },
      body: tokenRequestBody
    });
    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${tokenResponse.status} ${errorBody}`);
    }
    const tokens = await tokenResponse.json();
    (req.session as any).accessToken = tokens.access_token;
    (req.session as any).refreshToken = tokens.refresh_token;
    (req.session as any).scopes = tokens.scope || '';

    if (tokens.expires_in) {
      const accessTokenExpiresAt = Date.now() + (tokens.expires_in * 1000);
      (req.session as any).accessTokenExpiresAt = accessTokenExpiresAt;
      req.session.cookie.maxAge = tokens.expires_in * 1000;
    }
    if (tokens.refresh_expires_in) {
      const refreshTokenExpiresAt = Date.now() + (tokens.refresh_expires_in * 1000);
      (req.session as any).refreshTokenExpiresAt = refreshTokenExpiresAt;
      req.session.cookie.maxAge = tokens.refresh_expires_in * 1000;
    } else {
      const defaultRefreshTTL = 7 * 24 * 60 * 60 * 1000;
      (req.session as any).refreshTokenExpiresAt = Date.now() + defaultRefreshTTL;
      req.session.cookie.maxAge = defaultRefreshTTL;
    }
    const returnTo = (req.session as any).returnTo || '/';
    delete (req.session as any).returnTo;
    return res.redirect(returnTo);
  } catch (error) {
    return res.redirect('/?error=oauth_callback_failed');
  }
});

// /api/refresh
router.post('/oauth/refresh', async (req, res) => {
  const refreshToken = (req.session as any).refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token available' });
  }
  try {
    const tokenResponse = await fetch(OAUTH_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${OAUTH_CONFIG.clientId}:${OAUTH_CONFIG.clientSecret}`).toString('base64')
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });
    if (!tokenResponse.ok) {
      req.session.destroy(() => { });
      return res.status(401).json({ error: 'Token refresh failed' });
    }
    const tokens = await tokenResponse.json();
    (req.session as any).accessToken = tokens.access_token;
    if (tokens.refresh_token) {
      (req.session as any).refreshToken = tokens.refresh_token;
    }
    (req.session as any).scopes = tokens.scope || (req.session as any).scopes || '';

    if (tokens.expires_in) {
      const newAccessTokenExpiresAt = Date.now() + (tokens.expires_in * 1000);
      (req.session as any).accessTokenExpiresAt = newAccessTokenExpiresAt;
    }
    if (tokens.refresh_expires_in) {
      const newRefreshTokenExpiresAt = Date.now() + (tokens.refresh_expires_in * 1000);
      (req.session as any).refreshTokenExpiresAt = newRefreshTokenExpiresAt;
      req.session.cookie.maxAge = tokens.refresh_expires_in * 1000;
    }
    req.session.save();
    return res.json({
      success: true,
      accessTokenExpiresIn: tokens.expires_in,
      refreshTokenExpiresIn: tokens.refresh_expires_in
    });
  } catch (error) {
    return res.status(500).json({ error: 'Token refresh failed' });
  }
});

// /api/logout
router.post('/logout', async (req, res) => {
  const OAUTH_SERVER_BASE_URL = process.env['OAUTH_SERVER_BASE_URL'] || 'http://localhost:8084';
  const accessToken = (req.session as any).accessToken;
  if (req.session) {
    delete (req.session as any).accessToken;
    delete (req.session as any).refreshToken;
    delete (req.session as any).accessTokenExpiresAt;
    delete (req.session as any).refreshTokenExpiresAt;
  }
  try {
    const cookieHeader = req.headers['cookie'];
    await fetch(`${OAUTH_SERVER_BASE_URL}/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'AUTHORIZATION': 'Bearer ' + accessToken,
        ...(cookieHeader ? { cookie: cookieHeader } : {})
      },
      credentials: 'include',
    });
  } catch (err) {
    // Continue with local session destroy regardless
  }
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    return res.json({ success: true });
  });
});

export default router;
