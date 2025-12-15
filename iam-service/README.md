# IAM Service

Authorization decision service that evaluates access control based on principal identity, requested action, resource, and contextual conditions.

Takes in principal (IAM User), action, resource, and context to make fine-grained authorization decisions.

Standalone API service for managing policies and enforcing access control across the platform with direct MongoDB access.

This API runs independently from other services, allowing clean separation and decoupled authorization logic.

## Setup

```bash
cd iam-service
npm install
npm run dev
```

## Environment Variables

See `.env` file for configuration.

## API Endpoints

### Authorization
- `POST /authorize` - Evaluate access decision for a principal, action, and resource
  - Request body:
    ```json
    {
      "principal": "user/john-doe",
      "action": "product:write",
      "resource": "/api/products/42",
      "context": {
        "method": "POST",
        "sourceIp": "192.0.2.1",
        "userAgent": "Mozilla/5.0...",
        "timestamp": "2024-12-14T10:00:00Z",
        "scopes": ["product:write", "user:read"],
        "roles": ["editor"],
        "authorities": ["ROLE_USER", "SCOPE_product.write"]
      }
    }
    ```
  - Response:
    ```json
    {
      "allow": true,
      "reason": "Policy matches user role and scope"
    }
    ```
    or
    ```json
    {
      "allow": false,
      "reason": "User lacks required scope"
    }
    ```

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
- **Clean separation** - Other services call this API via HTTP for authorization decisions

The management-api and resource servers call this API to enforce access control.

## Authorization Model

Supports AWS IAM-like decision making:
- **Principal:** The identity making the request (user, service account, role)
- **Action:** The specific operation (e.g., `product:write`, `user:read`)
- **Resource:** The target being accessed (path, ARN, ID)
- **Context:** Environmental conditions (IP, time, user agent, scopes, roles)
