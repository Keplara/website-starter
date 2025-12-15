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
