<p align="center">
  <img src="https://placehold.co/200x60?text=hyperwiz+logo" alt="hyperwiz logo" width="200"/>
</p>

<h1 align="center">hyperwiz</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/hyperwiz"><img src="https://img.shields.io/npm/v/hyperwiz.svg" alt="npm version"></a>
  <a href="https://github.com/wizforge/hyperwiz/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/hyperwiz.svg" alt="license"></a>
  <img src="https://img.shields.io/badge/TypeScript-Ready-blue.svg" alt="TypeScript ready">
  <img src="https://img.shields.io/badge/ESM%20%26%20CJS-supported-green" alt="ESM and CJS supported">
</p>

<h3 align="center">🔥 Hyper-modern HTTP client for TypeScript & JavaScript</h3>

**hyperwiz** is a modern, high-performance HTTP client but built for 2025. It supports smart retries, token-based authentication, request caching, telemetry, and more – in both Node.js and browser environments.

---

## 📦 Installation

```sh
npm install hyperwiz
# or
yarn add hyperwiz
# or
pnpm add hyperwiz
```

---

## ⚡ Quick Start

### TypeScript

```ts
import { createClient } from 'hyperwiz';

const client = createClient('https://api.example.com');

// GET request
const users = await client.get('/users');

// POST request
const newUser = await client.post('/users', { name: 'Alice' });
```

### JavaScript

```js
const { createClient } = require('hyperwiz');

const client = createClient('https://api.example.com');

// GET request
const users = await client.get('/users');

// POST request
const newUser = await client.post('/users', { name: 'Alice' });
```

---

## 🔒 Authenticated Requests

hyperwiz supports token-based authentication with automatic token refresh. Use the `createAuthMiddleware` to wrap your requests:

```ts
import { createClient, createAuthMiddleware, setTokens } from 'hyperwiz';

const client = createClient('https://api.example.com');
const withAuth = createAuthMiddleware(client);

// Set tokens (e.g., after login)
setTokens('access-token', 'refresh-token');

// Authenticated GET request
const data = await withAuth((headers) => client.get('/me', headers));

// Authenticated POST request with body
const newItem = await withAuth((headers) => client.post('/additem', { name: 'apple', price: 20 }, headers));
```

- The `withAuth` function automatically attaches the access token and refreshes it if expired.
- Pass the `headers` argument from the middleware into your client method; you do **not** need to construct the headers yourself.
- If both tokens are expired, it redirects to the login URL (if set via `client.setLoginPath(url)`).

---

## 🪪 Token Management

hyperwiz provides utility functions for managing JWT tokens:

```ts
import {
  setTokens,
  setAccessToken,
  setRefreshToken,
  getAccessToken,
  getRefreshToken,
  isAccessTokenExpired,
  isRefreshTokenExpired,
  logout,
  TokenAge
} from 'hyperwiz';

// Set tokens with optional expiry (in seconds)
setTokens('access-token', 'refresh-token', TokenAge.hour(2,"accessToken"), TokenAge.day(7,"refreshToken"));

// Check if tokens are expired
if (isAccessTokenExpired()) {
  // handle token refresh
}

// Logout and clear tokens
logout();
```

---

## ⚙️ API Reference

| Function / Method                        | Description                                                      |
|------------------------------------------|------------------------------------------------------------------|
| `createClient(baseUrl)`                  | Create a new HTTP client instance                                 |
| `client.get(path, headers?)`             | Perform GET request                                              |
| `client.post(path, body, headers?)`      | Perform POST request                                             |
| `client.put(path, body, headers?)`       | Perform PUT request                                              |
| `client.delete(path, headers?)`          | Perform DELETE request                                           |
| `client.patch(path, body, headers?)`     | Perform PATCH request                                            |
| `setTokens(access, refresh?, accessAge?, refreshAge?)` | Set JWT tokens manually with optional expiry         |
| `setAccessToken(token, age?)`            | Set access token with optional expiry (seconds)                  |
| `setRefreshToken(token, age?)`           | Set refresh token with optional expiry (seconds)                 |
| `getAccessToken()`                       | Get current access token                                         |
| `getRefreshToken()`                      | Get current refresh token                                        |
| `isAccessTokenExpired()`                 | Checks if access token is expired                                |
| `isRefreshTokenExpired()`                | Checks if refresh token is expired                               |
| `logout(redirectUrl?)`                   | Clears tokens and optionally redirects to login/logout page      |
| `createAuthMiddleware(client)`           | Creates a withAuth() wrapper for auth headers                    |
| `TokenAge`                               | Utility for token expiry: `TokenAge.hour(age,"refreshToken")`, `TokenAge.day(age,"accessToken")`, etc. |

---

## 📝 TypeScript Types

The `RequestConfig` type is used internally for advanced requests:

```ts
export interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: HeadersInit;
  body?: any;
}
```

---

## 📦 ESM & CJS Supported

Use in either environment:

- **ESM:** `import { createClient } from 'hyperwiz';`
- **CJS:** `const { createClient } = require('hyperwiz');`

---

## 🪪 License

Licensed under Apache 2.0.

---

## 🔗 Related Links

- [GitHub](https://github.com/wizforge/hyperwiz)
- [npm](https://www.npmjs.com/package/hyperwiz)

Website coming soon – stay tuned!
