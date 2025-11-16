import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import express, { Request } from 'express';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import session from 'express-session';

// Local session shape used by this app. Keep it minimal and extend as needed.
type AppSession = {
  codeVerifier?: string;
  state?: string;
  [key: string]: any;
};

// Request with session: an intersection type so we don't modify Express globals.
type RequestWithSession = Request & { session: AppSession };

import { dirname, join, resolve } from 'node:path';
import bootstrap from './src/main.server';
import { login } from './serverModules/login';
import { generatePKCE } from './serverModules/generatePKCE';

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  console.log('Starting server...');
  const AUTHORIZATION_SERVER_BASE_URL = process.env['AUTHORIZATION_SERVER_BASE_URL'] || 'http://localhost:8084';
  const AUTH_CLIENT_BASE_URL = process.env['AUTH_CLIENT_BASE_URL'] || 'http://localhost:8082';
  const USER_AUTH_CLIENT_ID = process.env['USER_AUTH_CLIENT_ID'] || 'userAuthClient';
  const ADMIN_AUTH_CLIENT_ID = process.env['ADMIN_AUTH_CLIENT_ID'];
  const server = express();
  const DEFAULT_REDIRECT_URI = process.env['DEFUALT_REDIRECT_URI'] || 'http://localhost:8080';

  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const indexHtml = join(serverDistFolder, 'index.server.html');

  const commonEngine = new CommonEngine();

  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  // Parse JSON and urlencoded bodies for POST handlers
  server.use(express.json());
  server.use(express.urlencoded({ extended: true }));

  // Session middleware. This is what makes `req.session` available.
  server.use(
    session({
      secret: 'a-very-secret-key-that-you-should-change', // TODO: Change this to a secure, random string from environment variables
      resave: false,
      saveUninitialized: true,
      cookie: {
        secure: false, // Set to true if you're using HTTPS
        httpOnly: true,
      },
    })
  );

  // const axios = require('axios'); // Removed: not used in current flow
  server.get('*.*', express.static(browserDistFolder, {
    maxAge: '1y'
  }));
  
  // server.get('/', express.static(browserDistFolder, {
  //   maxAge: '1y'  // Cache static files for 1 year
  // }));
  
  
  server.get('/', (req, res) => {
  console.log('Received /login request with query:', req.query);

  let { cid, redirectURI } = req.query;
  cid = typeof cid === 'string' ? cid : '';
  redirectURI = typeof redirectURI === 'string' ? redirectURI : '';

  // Only redirect if either is missing
  if (!cid || !redirectURI) {
    const params = new URLSearchParams({
      cid: cid || '1',
      redirectURI: redirectURI || DEFAULT_REDIRECT_URI
    });
    const redirectUrl = '/login?' + params.toString();
    console.log('Redirecting to:', redirectUrl);
    return res.redirect(redirectUrl);
  }
  // Pass to Angular SSR
});
  
  server.post('/login', async (req: any, res: any) => {
    const reqWithSession = req as RequestWithSession;

    const { username, password } = req.body;

    const validUser = await login(AUTHORIZATION_SERVER_BASE_URL, username, password);
    if (!validUser){
      return res.status(401).send('Invalid credentials');
    } 

    // Generate state + code challenge for PKCE
    const { codeVerifier, codeChallenge } = generatePKCE();
    console.log("generatePKCE:",codeChallenge, codeVerifier);
    reqWithSession.session.codeVerifier = codeVerifier;
    reqWithSession.session.state = crypto.randomUUID();
    const { cid, redirectURI } = req.query;

    const clientIdMap: { [key: string]: string | undefined } = {
      '1': USER_AUTH_CLIENT_ID,
      '3': ADMIN_AUTH_CLIENT_ID
    };
    const clientId = clientIdMap[String(cid)] || USER_AUTH_CLIENT_ID;
    // Redirect to your *authorization server’s* /oauth2/authorize
    const authorizeUrl = `${AUTHORIZATION_SERVER_BASE_URL}/oauth2/authorize`
      + `?response_type=code`
      + `&client_id=${clientId}`
      + `&redirect_uri=${AUTH_CLIENT_BASE_URL}/callback`
      + `&scope=user:read`
      + `&code_challenge=${codeChallenge}`
      + `&code_challenge_method=S256`
      + `&state=${reqWithSession.session.state}`;

    res.redirect(authorizeUrl);
  });
  

  // All regular routes use the Angular engine
  server.get('*', (req, res, next) => {
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
  const port = process.env['PORT'] || 4000;

  // Start up the Node server
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

run();
