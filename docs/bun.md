# Bun Documentation

## Overview
Bun is an all-in-one toolkit for JavaScript/TypeScript: runtime, package manager, test runner, and bundler.

## Core Components
1. **Runtime** — JavaScript execution environment built in Zig using JavaScriptCore, 4x faster startup than Node.js
2. **Package Manager** — Up to 30x faster than npm
3. **Test Runner** — Jest-compatible with TypeScript-first support
4. **Bundler** — Native bundling for TypeScript, JSX, React, CSS

## Bun.serve — HTTP + WebSocket

```typescript
const server = Bun.serve({
  port: 3000,
  fetch(req, server) {
    // Handle HTTP requests
    // Upgrade WebSocket connections
    if (new URL(req.url).pathname === "/ws") {
      const upgraded = server.upgrade(req);
      if (upgraded) return undefined;
    }
    return new Response("Hello");
  },
  websocket: {
    open(ws) { console.log("Connected"); },
    message(ws, msg) { console.log("Message:", msg); },
    close(ws) { console.log("Closed"); },
  },
});
```

## Key APIs
- `Bun.serve()` — HTTP + WebSocket server
- `Bun.file()` — Fast file I/O
- `Bun.env` — Environment variables
- `Bun.write()` — Write files
- `bun:test` — Test runner
- Direct `.ts`, `.tsx`, `.jsx` execution without transpile step

## References
- https://bun.sh/docs
- https://bun.sh/docs/api/http
- https://bun.sh/docs/api/websockets
