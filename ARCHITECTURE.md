# Keplara Website Starter - Architecture Overview

## New Microservice Architecture

The application is now split into two independent services following industry best practices:

### 1. Admin Client (Angular SSR) - Port 8087
**Location**: `admin-client/`

**Responsibilities**:
- Server-side rendering of Angular UI
- Session management (Redis)
- Static asset serving
- OAuth/authentication flows
- Proxies database API calls to Management API

**Technology**:
- Angular 17 with SSR
- Express.js for server
- Redis for sessions
- No Mongoose/MongoDB direct access

**Key Files**:
- `server.ts` - SSR Express server (clean, no DB logic)
- `src/app/` - Angular components
- `src/serverModules/api/auth.ts` - OAuth routing only

---

### 2. Management API (Node.js/Express) - Port 3001
**Location**: `management-api/`

**Responsibilities**:
- All database operations (Mongoose/MongoDB)
- Policy CRUD endpoints
- Business logic
- Data validation

**Technology**:
- Node.js with Express
- Mongoose for ODM
- MongoDB 4.x+ with TLS
- CORS enabled for admin-client requests

**Key Files**:
- `src/server.ts` - Standalone Express server with MongoDB
- `src/api/models.ts` - Mongoose schemas
- `src/api/policy.ts` - Policy routes
- `.env` - MongoDB credentials

---

## API Communication Flow

```
Browser (Admin Client UI)
    ↓
Admin Client Server (port 8087)
    ↓ [HTTP Proxy]
Management API Server (port 3001)
    ↓
MongoDB
```

**Request Example**:
```
GET http://localhost:8087/api/policies
→ Proxied to http://localhost:3001/api/policies
→ Mongoose query to MongoDB
→ Response back to client
```

---

## Setup Instructions

### Prerequisites
- MongoDB running on localhost:27020
- Redis running on localhost:6366
- Node.js 18+

### Installation

**Admin Client**:
```bash
cd admin-client
npm install
npm run build    # Build SSR bundle
npm run serve:ssr:client  # Start SSR server on 8087
```

**Management API**:
```bash
cd management-api
npm install
npm run dev      # Development mode with hot reload
# OR
npm run serve    # Production mode
```

---

## API Endpoints

All endpoints are proxied through `/api`:

### Policies (Management API)
```
GET    /api/policies           - List all policies
POST   /api/policies           - Create policy
GET    /api/policies/:id       - Get single policy
PUT    /api/policies/:id       - Update policy
DELETE /api/policies/:id       - Delete policy
```

---

## Environment Variables

### Admin Client (`.env`)
```
PORT=8087
API_BASE_URL=http://localhost:8087
MANAGEMENT_API_URL=http://localhost:3001
SESSION_SECRET=your_session_secret_here
REDIS_USERNAME=Supervisor
REDIS_PASSWORD=Supervisor
REDIS_HOST=localhost
REDIS_PORT=6366
```

### Management API (`.env`)
```
MONGO_HOST=localhost
MONGO_PORT=27020
MONGO_USER=Supervisor
MONGO_PASS=Supervisor
MONGO_DB=mysite
MONGO_CA_FILE=../certs/mongo-ca.pem
NODE_ENV=development
PORT=3001
```

---

## Why This Architecture?

### ✅ Solves SSR + MongoDB Issues
- **No bundling conflicts**: Mongoose never gets bundled into SSR output
- **No whatwg-url errors**: MongoDB driver runs in separate process
- **Clean separation**: UI concerns separate from data concerns

### ✅ Industry Standard
- Microservices architecture is recommended best practice
- Allows independent scaling and deployment
- Easier testing and debugging
- Follows Angular SSR documentation

### ✅ Better Maintainability
- Clear responsibility boundaries
- Easier to add new features
- Simpler error tracking and debugging
- Can scale each service independently

### ✅ Production Ready
- Each service can run on different servers
- Easy to containerize with Docker
- Can use load balancers
- Supports horizontal scaling

---

## Deployment

### Local Development
```bash
# Terminal 1: Start Management API
cd management-api && npm run dev

# Terminal 2: Start Admin Client SSR
cd admin-client && npm run serve:ssr:client

# Admin Client will automatically proxy to Management API
```

### Docker Deployment
Each service can have its own Dockerfile:
- `admin-client/Dockerfile` - Angular SSR
- `management-api/Dockerfile` - API service

### Kubernetes Deployment
Both services can be independently deployed as pods with their own services.

---

## Migration Notes

✅ **Completed**:
- Removed all MongoDB/Mongoose imports from admin-client
- Created standalone management-api with full MongoDB support
- Set up HTTP proxy in admin-client to forward API calls
- Environment configuration for both services

✅ **What Still Works**:
- OAuth authentication
- Session management in Redis
- Angular SSR rendering
- All existing UI code

✅ **What Changed**:
- Database logic moved to separate service
- Admin-client server is now pure SSR + proxy
- No more dynamic imports or workarounds needed

---

## Testing

### Management API
```bash
cd management-api
curl http://localhost:3001/health
curl http://localhost:3001/api/policies
```

### Admin Client Proxy
```bash
curl http://localhost:8087/api/policies
# Should be proxied to management-api and return data
```

---

## Future Enhancements

- Add Docker Compose for easy local development
- Add Kubernetes manifests for production
- Implement API authentication between services
- Add service discovery
- Add metrics and logging
- Add circuit breaker pattern
