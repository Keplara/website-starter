import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import bootstrap from './src/main.server';
import session from 'express-session';
import crypto from 'crypto';
import { generatePKCE } from './serverModules/generatePKCE';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  console.log('Starting server...');

  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const indexHtml = join(serverDistFolder, 'index.server.html');

  const commonEngine = new CommonEngine();

  // OAuth Configuration - Store these in environment variables!
  const OAUTH_SERVER_BASE_URL = process.env['OAUTH_SERVER_BASE_URL'] || 'http://localhost:8084';
  const BASE_URL = process.env['BASE_URL'] || 'http://localhost:8080';
  const OAUTH_CONFIG = {
    authServerUrl: `${OAUTH_SERVER_BASE_URL}/oauth2/authorize`,
    tokenUrl: `${OAUTH_SERVER_BASE_URL}/oauth2/token`,
    clientId: process.env['OAUTH_CLIENT_ID'] || 'userAuthClient',
    redirectUri: `${BASE_URL}/api/callback`,
    clientSecret: process.env['OAUTH_CLIENT_SECRET'] || 'OTMzNzc4ODQtNTZhYy00NGY0LWFjMmItM2Y4NmQ3YjcxZjk5Cg',
    scope: 'user:read'
  };

  // Session middleware for CSRF protection
  server.use(session({
    secret: process.env['SESSION_SECRET'] || 'change-this-to-random-secret-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env['NODE_ENV'] === 'production', // HTTPS only in production
      httpOnly: true,
      maxAge: 1000 * 60 * 60 // 1 hour
    }
  }));

  server.use(express.json());
  server.use(express.urlencoded({ extended: true }));

  // Add proxy later to product API and other APIs 
  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  server.get('/health-check', (req, res) => {
    res.send("Server is Live!").status(200);
  });

  // OAuth Login Endpoint - Initiates OAuth flow
  server.get('/api/login', (req, res) => {
    // Generate CSRF token (state parameter)
    const state = crypto.randomBytes(32).toString('hex');
    const { codeVerifier, codeChallenge } = generatePKCE();

    // Store both state and codeVerifier in session for verification
    (req.session as any).oauthState = state;
    (req.session as any).codeVerifier = codeVerifier; // Needed for PKCE token exchange

    // Construct OAuth authorization URL with server-controlled parameters
    const authUrl = new URL(OAUTH_CONFIG.authServerUrl);
    authUrl.searchParams.append('client_id', OAUTH_CONFIG.clientId);
    authUrl.searchParams.append('redirect_uri', OAUTH_CONFIG.redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', OAUTH_CONFIG.scope);
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('code_challenge', codeChallenge);
    authUrl.searchParams.append('code_challenge_method', 'S256');
    // Redirect to OAuth provider
    res.redirect(authUrl.toString());
  });

  // OAuth Callback Endpoint - Exchanges code for tokens
  server.get('/api/callback', async (req, res) => {
    console.log('Received OAuth callback');
    const { code, state } = req.query;
    console.log('Query params:', req.query);

    // Verify state parameter (CSRF protection)
    if (!state || state !== (req.session as any).oauthState) {
      return res.status(400).send('Invalid state parameter');
    }

    // Get codeVerifier from session for PKCE
    const codeVerifier = (req.session as any).codeVerifier;
    
    if (!codeVerifier) {
      return res.status(400).send('Missing PKCE code verifier');
    }

    // Clear the state and codeVerifier from session
    delete (req.session as any).oauthState;
    delete (req.session as any).codeVerifier;

    if (!code) {
      return res.status(400).send('No authorization code received');
    }

    try {
      // Exchange authorization code for access token (with PKCE)
      const tokenResponse = await fetch(OAUTH_CONFIG.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(`${OAUTH_CONFIG.clientId}:${OAUTH_CONFIG.clientSecret}`).toString('base64')
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code as string,
          redirect_uri: OAUTH_CONFIG.redirectUri,
          code_verifier: codeVerifier // Send PKCE verifier
        })
      });

      if (!tokenResponse.ok) {
        throw new Error('Token exchange failed');
      }

      const tokens = await tokenResponse.json();

      // Store tokens in session (or use a more secure method like Redis)
      (req.session as any).accessToken = tokens.access_token;
      (req.session as any).refreshToken = tokens.refresh_token;
      console.log('OAuth tokens received and stored in session', tokens.access_token);
      // Redirect to frontend
      return res.redirect('/?login=success');
    } catch (error) {
      console.error('OAuth callback error:', error);
      return res.redirect('/?login=error');
    }
  });

  // Get current user session
  server.get('/api/user', (req, res) => {
    const accessToken = (req.session as any).accessToken;

    if (!accessToken) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Return session info (in production, fetch user info from OAuth provider)
    return res.json({
      authenticated: true,
      accessToken: accessToken // In production, don't send the full token
    });
  });

  // Logout endpoint
  server.post('/api/logout', (req, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      return res.json({ success: true });
    });
  });

  // Example Express Rest API endpoints
  // server.get('/api/**', (req, res) => { });
  // Serve static files from /browser
  server.use(express.static(browserDistFolder, {
    maxAge: '1y'
  }));

  // All regular routes use the Angular engine
  server.get('*', (req, res, next) => {
    // Skip Angular SSR for API routes
    if (req.path.startsWith('/api/')) {
      return next();
    }

    const { protocol, originalUrl, baseUrl, headers } = req;

    commonEngine
      .render({
        bootstrap,
        documentFilePath: indexHtml,
        url: `${protocol}://${headers.host}${originalUrl}`,
        publicPath: browserDistFolder,
        providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
      })
      .then((html) => res.send(html))
      .catch((err) => next(err));
  });

  return server;
}

function run(): void {
  const port = process.env['PORT'] || 8080;

  // Start up the Node server
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

run();
