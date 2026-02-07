# Management API

Standalone API service for managing admin operations (policies, users, products, etc.) with direct MongoDB access.

This API runs independently from the Angular SSR application, avoiding bundling issues with Mongoose and allowing clean separation of concerns.

## Setup

```bash
cd management-api
npm install
npm run dev
```

## Environment Variables

See `.env` file for configuration.

### Auth settings
- `OAUTH_SERVER_BASE_URL`: Base URL of authorization server (default `http://localhost:8084`).
- `JWKS_URI`: JWKS endpoint (default `${OAUTH_SERVER_BASE_URL}/.well-known/jwks.json`).

This service validates JWTs locally with JWKS (RS256 only). Assumed roles use session-based state:
- To assume a role, call IAM `POST /api/assume-role` which returns `{ sessionId, expiresAt, assumedRole }`.
- Send the session id in header `X-Assumed-Role-Session` on admin requests.
- Admin routes require an assumed role of `Admin` and will verify the session against MongoDB.
	- Sessions are stored in Redis with TTL; default expiration is 2 hours (override via `ASSUMED_ROLE_SESSION_TTL_SECONDS`). When expired, they self-delete.

## API Endpoints

### Policies
- `GET /api/policies` - List all policies
- `POST /api/policies` - Create policy
- `GET /api/policies/:id` - Get single policy
- `PUT /api/policies/:id` - Update policy
- `DELETE /api/policies/:id` - Delete policy

## Architecture

This service is completely separate from the Angular SSR application:
- **No SSR bundling constraints** - Can use Mongoose directly
- **Independent scaling** - Run on different port/machine if needed
- **Clean separation** - Admin client calls this API via HTTP

The admin-client calls this API as a microservice.
