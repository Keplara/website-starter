import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import bootstrap from './src/main.server';

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  const server = express();
  const DEFAULT_REDIRECT_URI = process.env['DEFUALT_REDIRECT_URI'] || 'http://localhost:8080';

  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const indexHtml = join(serverDistFolder, 'index.server.html');

  const commonEngine = new CommonEngine();

  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  const axios = require('axios');
  
  const getTokenAndRegisterClient = async () => {
    try {
      const authHeader = Buffer.from(
        `${process.env['CLIENT_ID']}:${process.env['CLIENT_KEY']}`
      ).toString('base64');
  
      // Step 1: Get the token
      // on behalf of a server not user
      // const tokenResponse = await axios.post(
      //   'http://localhost:8084/connect/token',
      //   new URLSearchParams({
      //     grant_type: 'client_credentials',
      //     scope: 'client.create'
      //   }),
      //   {
      //     headers: {
      //       'Authorization': `Basic ${authHeader}`,
      //       'Content-Type': 'application/x-www-form-urlencoded'
      //     }
      //   }
      // );

      const tokenResponse = await axios.post(
        'http://localhost:8084/connect/token',
        new URLSearchParams({
          grant_type: 'authorization_code',
          scope: 'client.create'
        }),
        {
          headers: {
            'Authorization': `Basic ${authHeader}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

  
      const accessToken = tokenResponse.data.access_token;
      console.log("Access token:", accessToken);
  
      // Step 2: Use the token to register a client
      const registerResponse = await axios.post(
        'http://localhost:8084/connect/register',
        {
          client_name: "internal-registrar-client",
          redirect_uris: ["http://localhost:8082/callback"],
          scopes: [
            "user:read",
            "profile"
          ],
          grant_types: ["authorization_code", "refresh_token"],
          response_types: ["token"],
          post_logout_redirect_uri: "http://localhost:8082/logout",
          client_authentication_method: "none",
          require_proof_key: true
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
  
      console.log("Client registered:", registerResponse.data);
    } catch (error: any) {
      console.error("Error:", error?.response?.data || error?.message);
    }
  };
  
  getTokenAndRegisterClient();
  // store json output to local fs ./tmp/creds.json

  // Example Express Rest API endpoints
  // server.get('/api/**', (req, res) => { });
  // Serve static files from /browser
  server.get('*.*', express.static(browserDistFolder, {
    maxAge: '1y'
  }));

  server.get('/', (req, res, next) => {
    const { cid, redirectURI } = req.query;
    const defaultParams = new URLSearchParams({ redirectURI: DEFAULT_REDIRECT_URI, cid: "1"}).toString();

    if (!redirectURI || !cid) {
      req.url = req.url + (req.url.includes('?') ? '&' : '?') + defaultParams;
    }

    next();
  });
  
  server.get('/', express.static(browserDistFolder, {
    maxAge: '1y' 
  }));


  const exchangeAuthCodeForTokens = async (authorizationCode: any, req: any, res: any) => {
    try {
      const tokenResponse = await axios.post(
        'http://localhost:8084/oauth2/token',  // Token exchange endpoint
       {
          grant_type: 'authorization_code',  // Using authorization code
          code: authorizationCode,           // The authorization code received
          redirect_uri: 'http://localhost:8082/callback',  // The same redirect URI as before
          client_id: process.env['CLIENT_ID'],  // Your client ID
          client_secret: process.env['CLIENT_SECRET'],  // Your client secret
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',  // Content type for token request
          },
        }
      );
  
      // Access token and refresh token
      const { access_token, refresh_token } = tokenResponse.data;
  
      console.log('Access Token:', access_token);
      console.log('Refresh Token:', refresh_token);
  
      // Store tokens for future use
      // e.g., store them in a session or a secure place
      req.session.access_token = access_token;
      req.session.refresh_token = refresh_token;
  
      // Redirect to the main page or wherever you need to go after login
      res.redirect('/dashboard');  // Redirect after successful login
    } catch (error) {
      console.error('Error exchanging authorization code for tokens:', error?.response?.data || error?.message);
    }
  };
  
  // Example usage in the callback handler
  app.get('/callback', (req: any, res: any) => {
    const { code } = req.query;  // The authorization code from the query parameters
    exchangeAuthCodeForTokens(code, req, res);  // Exchange the code for tokens
  });

  server.get('/flow', (req, res) => {
    const authorizationUrl = `http://localhost:8084/oauth2/authorize?response_type=code`
      + `&client_id=${process.env['CLIENT_ID']}`
      + `&redirect_uri=http://localhost:8082/callback`
      + `&scope=openid%20profile`
      + `&state=randomState123`;  // Optional: Include a CSRF state
  
    res.redirect(authorizationUrl);  // Redirect to the authorization server
  });

  server.get('/login', (req, res, next) => {
    const { cid, redirectURI } = req.query;
    const defaultParams = new URLSearchParams({
      redirectURI: DEFAULT_REDIRECT_URI,
      cid: '1'
    }).toString();
    if (!redirectURI || !cid) {
      // Redirect to the same URL with the default parameters
      const redirectUrl = req.baseUrl + req.path + (req.url.includes('?') ? '&' : '?') + defaultParams;
      console.log(redirectUrl)
      return res.redirect(redirectUrl);
    }
  
    next();
  });
  
  // POST /login route handling login request
  server.post('/login', (req: any, res: any, ) => {
    // Access query parameters or request body
    const { cid, redirectURI } = req.query;  // Assuming these are query parameters
    // Or if they're in the body:
    // const { cid, redirectURI } = req.body;
  
    const username = req.body.emailOrUsername;
    const password = req.body.password;
  
    // Validate or process the login (add your logic here)
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    // send request to authorization server.

  });
  // Serve static files with caching for the root route
  server.get('/login', express.static(browserDistFolder, {
    maxAge: '1y'  // Cache static files for 1 year
  }));
  

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
