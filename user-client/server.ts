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
import { RedisStore } from 'connect-redis';
import { createClient } from 'redis';
import type { RedisClientOptions } from 'redis';
// Mount resource server routes at /api/resource
import resourceRouter from './serverModules/resourceServer/routes';
import { verifyAccessToken } from './serverModules/tokenVerifier';
// Load environment variables from .env file

dotenv.config();

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  console.log('Starting server...');

  const redisUser: string = process.env['REDIS_USERNAME'] || '';
  const redisPassword: string = process.env['REDIS_PASSWORD'] || '';
  const redisHost: string = process.env['REDIS_HOST'] || 'localhost';
  const resolvedPort = Number(process.env['REDIS_PORT']);
  const redisPort = Number.isNaN(resolvedPort) ? 6379 : resolvedPort;
  
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
    scope: 'user:read product:read'
  };


  const redisOptions: RedisClientOptions = 
  {
    username: redisUser,
    password: redisPassword,
    socket: {
          host: redisHost,
          port: redisPort,
    }
  };

  const redisClient = createClient(redisOptions);
  
  redisClient.connect().catch(console.error);

  // Initialize Redis session store
  const redisStore = new RedisStore({
    client: redisClient,
    prefix: 'session:', // Prefix for session keys in Redis
  });

  // Session middleware with Redis storage
  server.use(session({
    store: redisStore, // Use Redis instead of memory
    secret: process.env['SESSION_SECRET'] || 'change-this-to-random-secret-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env['NODE_ENV'] === 'production', // HTTPS only in production
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 2 // 2 hours
    }
  }));
  
  server.use(express.json());
  server.use(express.urlencoded({ extended: true }));
  
  // Add proxy later to product API and other APIs 
  server.set('view engine', 'html');
  server.set('views', browserDistFolder);
  // Serve .well-known and other static files before API and SSR
  server.use('/.well-known', express.static(resolve(process.cwd(), '.well-known')));
  server.use('/api/resource', resourceRouter);

  server.get('/health-check', (req, res) => {
    res.send("Server is Live!").status(200);
  });

  // ---------------------
  // Check session route
  // ---------------------
  server.get('/api/check-session', (req, res) => {
    const accessToken = (req.session as any).accessToken;
    const refreshToken = (req.session as any).refreshToken;
    const accessTokenExpiresAt = (req.session as any).accessTokenExpiresAt;
    console.log('[CHECK-SESSION] Session ID:', req.sessionID, '| accessToken:', !!accessToken, '| refreshToken:', !!refreshToken, '| accessTokenExpiresAt:', accessTokenExpiresAt);
    let loggedIn = false;
    let accessTokenExpired = false;
    // If access token exists and is not expired
    if (req.session && accessToken && accessTokenExpiresAt && Date.now() < accessTokenExpiresAt) {
      loggedIn = true;
      accessTokenExpired = false;
    } else if (refreshToken) {
      // Access token expired but refresh token exists - still logged in, but token expired
      loggedIn = true;
      accessTokenExpired = true;
    } else {
      // No valid tokens, destroy session
      req.session.destroy(() => {});
      loggedIn = false;
      accessTokenExpired = true;
    }
    res.json({ loggedIn, accessTokenExpired });
  });

  // OAuth Login Endpoint - Initiates OAuth flow
  server.get('/api/login', (req, res) => {
    // Check if user already has a valid access token
    (req.session as any).codeVerifier = undefined;
    (req.session as any).state = undefined;

    const existingToken = (req.session as any).accessToken;
    console.log('[LOGIN] Session ID:', req.sessionID, '| Existing accessToken:', !!existingToken);
    if (existingToken) {
      console.log('[LOGIN] User already authenticated, redirecting to /');
      return res.redirect('/');
    }

    // Check if there's already an OAuth flow in progress
    const existingState = (req.session as any).oauthState;
    const existingVerifier = (req.session as any).codeVerifier;
    if (existingState && existingVerifier) {
      console.log('[LOGIN] OAuth flow already in progress, please wait for callback');
      return res.status(400).send('OAuth authorization already in progress. Please wait for the callback or try again later.');
    }

    // Store where to return after login - use Referer header (page user came from)
    if (req.headers.referer) {
      try {
        const refererUrl = new URL(req.headers.referer);
        if (refererUrl.origin === BASE_URL) {
          (req.session as any).returnTo = refererUrl.pathname + refererUrl.search;
        }
      } catch (e) {
        // Invalid referer, ignore
      }
    }

    // Generate fresh CSRF token (state parameter) and PKCE challenge
    const state = crypto.randomBytes(32).toString('hex');
    const { codeVerifier, codeChallenge } = generatePKCE();

    // Store state, codeVerifier, and codeChallenge in session for verification
    (req.session as any).oauthState = state;
    (req.session as any).codeVerifier = codeVerifier;
    (req.session as any).codeChallenge = codeChallenge;

    // console.log('[LOGIN] Starting OAuth2 login flow', {
    //   sessionID: req.sessionID,
    //   state,
    //   codeVerifier,
    //   codeChallenge,
    //   returnTo: (req.session as any).returnTo
    // });

    // Construct OAuth authorization URL with server-controlled parameters
    const authUrl = new URL(OAUTH_CONFIG.authServerUrl);
    authUrl.searchParams.append('client_id', OAUTH_CONFIG.clientId);
    authUrl.searchParams.append('redirect_uri', OAUTH_CONFIG.redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', OAUTH_CONFIG.scope);
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('code_challenge', codeChallenge);
    authUrl.searchParams.append('code_challenge_method', 'S256');
    console.log('[LOGIN] Redirecting to OAuth provider:', authUrl.toString());
    res.redirect(authUrl.toString());
  });

  // OAuth Callback Endpoint - Exchanges code for tokens
  server.get('/api/callback', async (req, res) => {
    console.log('[CALLBACK] Received OAuth callback');
    const { code, state, error, error_description } = req.query;
    console.log('[CALLBACK] Query params:', req.query);

    // Check for OAuth errors from authorization server
    if (error) {
      console.error('[CALLBACK] OAuth authorization error:', error, error_description);
      // Clear session data on error
      delete (req.session as any).oauthState;
      delete (req.session as any).codeVerifier;
      delete (req.session as any).codeChallenge;
      return res.redirect(`/?login=error&error=${error}`);
    }

    // Verify state parameter (CSRF protection)
    if (!state || state !== (req.session as any).oauthState) {
      console.error('[CALLBACK] State mismatch or missing:', { received: state, expected: (req.session as any).oauthState });
      return res.status(400).send('Invalid state parameter');
    }

    // Get codeVerifier from session for PKCE
    const codeVerifier = (req.session as any).codeVerifier;
    const storedChallenge = (req.session as any).codeChallenge;
    
    if (!codeVerifier) {
      console.error('[CALLBACK] Missing codeVerifier in session');
      return res.status(400).send('Missing PKCE code verifier - authorization may have already been processed');
    }

    console.log('[CALLBACK] Session PKCE data:', {
      storedChallenge,
      storedVerifier: codeVerifier,
      state: (req.session as any).oauthState
    });

    if (!code) {
      return res.status(400).send('No authorization code received');
    }

    // CRITICAL: Clear session data IMMEDIATELY to prevent code reuse
    // This must happen BEFORE the token exchange to prevent race conditions
    delete (req.session as any).oauthState;
    delete (req.session as any).codeVerifier;
    delete (req.session as any).codeChallenge;

    try {
      // Prepare token request body
      const tokenRequestBody = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: OAUTH_CONFIG.redirectUri,
        code_verifier: codeVerifier // Send PKCE verifier
      });

      console.log('[CALLBACK] Token request details:', {
        url: OAUTH_CONFIG.tokenUrl,
        clientId: OAUTH_CONFIG.clientId,
        redirectUri: OAUTH_CONFIG.redirectUri,
        codeVerifier: codeVerifier,
        codeLength: (code as string).length
      });

      // Exchange authorization code for access token (with PKCE)
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
        console.error('[CALLBACK] Token exchange failed:', {
          status: tokenResponse.status,
          statusText: tokenResponse.statusText,
          body: errorBody
        });
        throw new Error(`Token exchange failed: ${tokenResponse.status} ${errorBody}`);
      }

      const tokens = await tokenResponse.json();

      // Store tokens and scopes in session with their expiration times
      (req.session as any).accessToken = tokens.access_token;
      (req.session as any).refreshToken = tokens.refresh_token;
      (req.session as any).scopes = tokens.scope || '';
      console.log('[CALLBACK] Token response scopes:', tokens.scope);

      // Verify access token and extract roles
      try {
        const decoded = await verifyAccessToken(tokens.access_token);
        let roles: any = [];
        if (typeof decoded === 'object' && decoded !== null) {
          const d = decoded as { roles?: string[] | string; role?: string[] | string };
          if (d.roles) {
            roles = Array.isArray(d.roles) ? d.roles : [d.roles];
          } else if (d.role) {
            roles = Array.isArray(d.role) ? d.role : [d.role];
          }
        }
        (req.session as any).roles = roles;
      } catch (err) {
        console.error('[CALLBACK] Access token verification failed:', err);
        return res.redirect('/?error=invalid_token');
      }

      // Track access token expiration for automatic refresh
      if (tokens.expires_in) {
        const accessTokenExpiresAt = Date.now() + (tokens.expires_in * 1000);
        (req.session as any).accessTokenExpiresAt = accessTokenExpiresAt;
        req.session.cookie.maxAge = tokens.expires_in * 1000;
      }

      // Track refresh token expiration (if provided, otherwise use default)
      // Spring Auth Server typically uses 7 days for refresh tokens by default
      if (tokens.refresh_expires_in) {
        const refreshTokenExpiresAt = Date.now() + (tokens.refresh_expires_in * 1000);
        (req.session as any).refreshTokenExpiresAt = refreshTokenExpiresAt;
        req.session.cookie.maxAge = tokens.refresh_expires_in * 1000;
      } else {
        // Default to 7 days if refresh token expiration not provided
        const defaultRefreshTTL = 7 * 24 * 60 * 60 * 1000; // 7 days
        (req.session as any).refreshTokenExpiresAt = Date.now() + defaultRefreshTTL;
        req.session.cookie.maxAge = defaultRefreshTTL;
      }

      console.log('[CALLBACK] OAuth tokens and scopes received and stored in session. Session ID:', req.sessionID);

      // Redirect back to where user came from (or home)
      const returnTo = (req.session as any).returnTo || '/';
      delete (req.session as any).returnTo; // Clean up
      console.log('[CALLBACK] Redirecting to:', returnTo);
      return res.redirect(returnTo);
    } catch (error) {
      console.error('[CALLBACK] OAuth callback error:', error);
      return res.redirect('/?error=oauth_callback_failed');
    }
  });

  // Token refresh endpoint
  server.post('/api/refresh', async (req, res) => {
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
        // Refresh failed - clear session and require re-login
        req.session.destroy(() => {});
        return res.status(401).json({ error: 'Token refresh failed' });
      }

      const tokens = await tokenResponse.json();

      // Update tokens and scopes in session
      (req.session as any).accessToken = tokens.access_token;
      if (tokens.refresh_token) {
        (req.session as any).refreshToken = tokens.refresh_token;
      }
      // move to resource server as scopes and roles are used on the resource server and it can verify token on every request.
      (req.session as any).scopes = tokens.scope || (req.session as any).scopes || '';
      console.log('Token refresh response scopes:', tokens.scope);

      // Verify access token and extract roles
      try {
        const decoded = await verifyAccessToken(tokens.access_token);
        let roles: any = [];
        if (typeof decoded === 'object' && decoded !== null) {
          const d = decoded as { roles?: string[] | string; role?: string[] | string };
          if (d.roles) {
            roles = Array.isArray(d.roles) ? d.roles : [d.roles];
          } else if (d.role) {
            roles = Array.isArray(d.role) ? d.role : [d.role];
          }
        }
        (req.session as any).roles = roles;
      } catch (err) {
        console.error('[REFRESH] Access token verification failed:', err);
        req.session.destroy(() => {});
        return res.status(401).json({ error: 'Invalid access token after refresh' });
      }

      // Update access token expiration
      if (tokens.expires_in) {
        const newAccessTokenExpiresAt = Date.now() + (tokens.expires_in * 1000);
        (req.session as any).accessTokenExpiresAt = newAccessTokenExpiresAt;
      }

      // Update refresh token expiration if provided
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
      console.error('Token refresh error:', error);
      return res.status(500).json({ error: 'Token refresh failed' });
    }
  });

  // OAuth2 Logout endpoint: revoke access and refresh tokens, then destroy session
  server.post('/api/logout', async (req, res) => {
    const accessToken = (req.session as any).accessToken;
    // Remove tokens from session before destroying
    if (req.session) {
      delete (req.session as any).accessToken;
      delete (req.session as any).refreshToken;
      delete (req.session as any).accessTokenExpiresAt;
      delete (req.session as any).refreshTokenExpiresAt;
    }

    // Proxy logout to the auth server
    try {
      // Forward cookies for session identification if needed
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
      console.error('Error proxying logout to auth server:', err);
      // Continue with local session destroy regardless
    }

    req.session.destroy((err) => {
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
