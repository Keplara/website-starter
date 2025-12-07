import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import bootstrap from './src/main.server';
import session from 'express-session';
import dotenv from 'dotenv';
import { RedisStore } from 'connect-redis';
import { createClient } from 'redis';
import type { RedisClientOptions } from 'redis';
import { createProxyMiddleware } from 'http-proxy-middleware';

// Mount resource server routes at /api/resource
import authRouter from './src/serverModules/auth';

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

  // Proxy all /api requests to the management API service
  const managementApiUrl = process.env['MANAGEMENT_API_URL'] || 'http://localhost:3001';
  server.use('/api', createProxyMiddleware({
    target: managementApiUrl,
    changeOrigin: true,
    pathRewrite: {
      '^/api': '/api' // Keep the /api prefix
    },
    onError: (err, req, res) => {
      console.error('Proxy error:', err);
      res.status(503).json({ error: 'Management API unavailable' });
    }
  }));

  server.use('/oauth', authRouter);



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
    const refreshTokenExpiresAt = (req.session as any).refreshTokenExpiresAt;

    const now = Date.now();
    const accessTokenValid = accessToken && accessTokenExpiresAt && now < accessTokenExpiresAt;
    const refreshTokenValid = refreshToken && refreshTokenExpiresAt && now < refreshTokenExpiresAt;

    let loggedIn = false;
    let accessTokenExpired = false;
    let refreshTokenExpired = false;

    if (accessTokenValid) {
      loggedIn = true;
      accessTokenExpired = false;
      refreshTokenExpired = false;
    } else if (refreshTokenValid) {
      loggedIn = true;
      accessTokenExpired = true;
      refreshTokenExpired = false;
    } else {
      loggedIn = false;
      accessTokenExpired = true;
      refreshTokenExpired = true;
      if (req.session) {
        req.session.destroy(() => { });
      }
    }
    res.json({ loggedIn, accessTokenExpired, refreshTokenExpired });
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
  const port = process.env['PORT'] || 8087;

  // Start up the Node server
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

run();
