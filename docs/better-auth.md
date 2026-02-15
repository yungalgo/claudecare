# Better Auth Documentation

## Overview
Better Auth is a framework-agnostic, universal authentication and authorization framework for TypeScript. Features 2FA, passkeys, multi-tenancy, and enterprise features like SSO.

## Key Features
- Email & password authentication
- Social providers (Google, GitHub, etc.)
- Session management
- Two-factor authentication
- Passkeys / WebAuthn
- Multi-tenancy
- Plugin system for extensibility

## Hono Integration

```typescript
import { betterAuth } from "better-auth";
import { Hono } from "hono";

const auth = betterAuth({
  database: {
    type: "postgres",
    url: process.env.DATABASE_URL,
  },
  secret: process.env.BETTER_AUTH_SECRET,
});

const app = new Hono();

// Mount auth routes
app.on(["GET", "POST"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});
```

## References
- https://www.better-auth.com/docs
- https://www.better-auth.com/docs/integrations/hono
