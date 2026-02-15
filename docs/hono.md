# Hono Web Framework - Complete Documentation

## Overview

Hono is a lightweight, high-performance web framework built on Web Standards. The name means "flame" in Japanese. It functions across multiple JavaScript runtimes including Cloudflare Workers, Deno, Bun, Node.js, and others.

## Key Features

**Performance:** The framework uses RegExpRouter, described as "really fast. Not using linear loops," achieving over 402,820 operations per second in benchmarks.

**Size:** The `hono/tiny` preset is "under 14kB" when minified, with zero dependencies.

**Multi-Runtime Support:** The same codebase runs on Cloudflare Workers, Fastly Compute, Deno, Bun, AWS Lambda, and Node.js through a dedicated adapter.

**Built-in Tools:** Hono includes middleware and helpers for authentication, caching, compression, CORS, logging, JWT validation, and more.

**Developer Experience:** Features first-class TypeScript support with literal type inference for path parameters and RPC mode for type-safe client-server communication.

## Use Cases

The framework suits building Web APIs, backend proxies, CDN edge applications, serverless functions, and full-stack applications. Notable users include cdnjs, Cloudflare D1, Unkey, and OpenStatus.

## Quick Start

Installation requires a single command: `npm create hono@latest` (with equivalents for other package managers).

The minimal application is straightforward, with routing and response handling in just a few lines of code.

## References
- https://hono.dev/docs/
- https://hono.dev/docs/getting-started/bun
- https://hono.dev/docs/api/routing
- https://hono.dev/docs/guides/middleware
- https://hono.dev/docs/helpers/websocket
- https://hono.dev/docs/getting-started/bun#serve-static-files
