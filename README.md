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

**hyperwiz** is a modern, high-performance HTTP client built for 2025. It features automatic token refresh, smart error handling, and a clean API designed for both Node.js and browser environments.

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

### JavaScript (Simple Usage)

```js
import { createClient } from 'hyperwiz';
// or: const { createClient } = require('hyperwiz');

const client = createClient('https://api.example.com');

// GET request
const response = await client.get('/users');
if (response.success) {
  console.log('Users:', response.data);
} else {
  console.error('Error:', response.error);
}

// POST request
const createResponse = await client.post('/users', { 
  name: 'Alice', 
  email: 'alice@example.com' 
});
if (createResponse.success) {
  console.log('New user:', createResponse.data);
}

// PUT request
const updateResponse = await client.put('/users/123', { name: 'Alice Updated' });

// DELETE request
const deleteResponse = await client.delete('/users/123');
```

### TypeScript (With Type Safety)

```ts
import { createClient } from 'hyperwiz';

// Define your API response types
interface User {
  id: number;
  email: string;
}

interface CreateUserRequest {
  name: string;
  email: string;
}

const client = createClient('https://api.example.com');

// GET request with type safety
const response = await client.get<User[]>('/users');
if (response.success) {
  const users: User[] = response.data;
  console.log('Users:', users);
} else {
  console.error('Error:', response.error);
}

// POST request with typed request and response
const userData: CreateUserRequest = {
  name: 'Alice',
  email: 'alice@example.com'
};
const createResponse = await client.post<User>('/users', userData);
if (createResponse.success) {
  const newUser: User = createResponse.data;
  console.log('New user:', newUser);
}
```

---

## 🔒 Authenticated Requests

hyperwiz supports token-based authentication with automatic token refresh. Use the `createAuthMiddleware` to wrap your requests:

### JavaScript (Simple Usage)

```js
import { createClient, createAuthMiddleware, setTokens } from 'hyperwiz';

const client = createClient('https://api.example.com');
const withAuth = createAuthMiddleware(client);

// Set tokens (e.g., after login)
setTokens('access-token', 'refresh-token');

// Authenticated GET request
const userData = await withAuth((headers) => client.get('/me', headers));
if (userData.success) {
  console.log('User data:', userData.data);
}

// Authenticated POST request with body
const newItem = await withAuth((headers) => 
  client.post('/items', { name: 'apple', price: 20 }, headers)
);

// Authenticated PUT request
const updatedUser = await withAuth((headers) =>
  client.put('/users/123', { name: 'John Updated' }, headers)
);

// Authenticated DELETE request
const result = await withAuth((headers) => client.delete('/items/456', headers));
```

### TypeScript (With Type Safety)

```ts
import { createClient, createAuthMiddleware, setTokens } from 'hyperwiz';

// Define your API types
interface User {
  id: number;
  name: string;
  email: string;
}

interface Item {
  id: number;
  name: string;
  price: number;
}

interface CreateItemRequest {
  name: string;
  price: number;
}

const client = createClient('https://api.example.com');
const withAuth = createAuthMiddleware(client);

// Set tokens (e.g., after login)
setTokens('access-token', 'refresh-token');

// Authenticated GET request with type safety
const userData = await withAuth((headers) => 
  client.get<User>('/me', headers)
);
if (userData.success) {
  const user: User = userData.data;
  console.log('User:', user);
}

// Authenticated POST request with typed request and response
const itemData: CreateItemRequest = { name: 'apple', price: 20 };
const newItem = await withAuth((headers) => 
  client.post<Item>('/items', itemData, headers)
);
if (newItem.success) {
  const item: Item = newItem.data;
  console.log('Created item:', item);
}
```

**How it works:**
- The `withAuth` function automatically attaches the access token to your requests
- If the access token is expired, it automatically refreshes it using the refresh token
- If both tokens are expired, it redirects to the login URL (if set via `client.setLoginPath(url)`)
- Pass the `headers` argument from the middleware into your client method
- The middleware returns the same `ApiResponse<T>` format as direct client methods

---

## 🪪 Token Management

hyperwiz provides utility functions for managing JWT tokens:

### JavaScript

```js
import {
  setTokens,
  setAccessToken,
  setRefreshToken,
  getAccessToken,
  getRefreshToken,
  isAccessTokenExpired,
  isRefreshTokenExpired,
  getAccessExpiresAt,
  logout,
  TokenAge
} from 'hyperwiz';

// Set tokens with optional expiry (in seconds)
setTokens(
  'access-token', 
  'refresh-token', 
  TokenAge.hours(2, "accessToken"), 
  TokenAge.days(7, "refreshToken")
);

// Set individual tokens
setAccessToken('new-access-token', TokenAge.hours(1, "accessToken"));
setRefreshToken('new-refresh-token', TokenAge.days(30, "refreshToken"));

// Get current tokens
const accessToken = getAccessToken();
const refreshToken = getRefreshToken();

// Get expiry timestamps
const accessExpiry = getAccessExpiresAt();

// Check if tokens are expired
if (isAccessTokenExpired()) {
  console.log('Access token is expired');
}

if (isRefreshTokenExpired()) {
  console.log('Refresh token is expired');
}

// Logout and clear tokens
logout();
// or logout with redirect
logout('/login');
```

### TypeScript

```ts
import {
  setTokens,
  setAccessToken,
  setRefreshToken,
  getAccessToken,
  getRefreshToken,
  isAccessTokenExpired,
  isRefreshTokenExpired,
  getAccessExpiresAt,
  logout,
  TokenAge
} from 'hyperwiz';

// Set tokens with optional expiry (in seconds)
setTokens(
  'access-token', 
  'refresh-token', 
  TokenAge.hours(2, "accessToken"), 
  TokenAge.days(7, "refreshToken")
);

// Set individual tokens
setAccessToken('new-access-token', TokenAge.hours(1, "accessToken"));
setRefreshToken('new-refresh-token', TokenAge.days(30, "refreshToken"));

// Get current tokens (returns string | null)
const accessToken: string | null = getAccessToken();
const refreshToken: string | null = getRefreshToken();

// Get expiry timestamps (returns number | null)
const accessExpiry: number | null = getAccessExpiresAt();

// Check if tokens are expired (returns boolean)
const isAccessExpired: boolean = isAccessTokenExpired();
const isRefreshExpired: boolean = isRefreshTokenExpired();

if (isAccessExpired) {
  console.log('Access token is expired');
}

if (isRefreshExpired) {
  console.log('Refresh token is expired');
}

// Logout and clear tokens
logout();
// or logout with redirect
logout('/login');
```

### TokenAge Utilities

The `TokenAge` utility provides convenient methods for setting token expiry:

```js
import { TokenAge } from 'hyperwiz';

// Time calculation methods
TokenAge.seconds(30, "accessToken")    // 30 seconds
TokenAge.minutes(15, "accessToken")    // 15 minutes 
TokenAge.hours(2, "accessToken")       // 2 hours
TokenAge.days(7, "refreshToken")       // 7 days
TokenAge.months(1, "refreshToken")     // 1 month (30 days)
TokenAge.years(1, "refreshToken")      // 1 year (365 days)

// Convenience methods (return seconds, no storage)
TokenAge.minute()   // 60 seconds
TokenAge.hour()     // 3600 seconds  
TokenAge.day()      // 86400 seconds
TokenAge.week()     // 604800 seconds
TokenAge.month()    // 2592000 seconds (30 days)
TokenAge.year()     // 31536000 seconds (365 days)
```

---

## 🚨 Error Handling

hyperwiz uses a consistent `ApiResponse<T>` format for all HTTP methods:

```ts
type ApiResponse<T> = 
  | { success: true; data: T }
  | { success: false; status?: number; error: string };
```

### JavaScript (Proper Response Handling)

```js
import { createClient } from 'hyperwiz';

const client = createClient('https://api.example.com');

// Handle success/error responses
const response = await client.get('/users');
if (response.success) {
  console.log('Users:', response.data);
} else {
  console.error('Error:', response.error);
  
  // Handle different error types
  if (response.error.includes('Network error')) {
    alert('Unable to connect. Please check your internet connection.');
    
  } else if (response.error === 'Unauthorized access') {
    window.location.href = '/login';
    
  } else if (response.error === 'Token refresh failed') {
    localStorage.clear();
    window.location.href = '/login';
    
  } else if (response.status) {
    // Handle HTTP status codes
    switch (response.status) {
      case 400:
        alert(`Bad Request: ${response.error}`);
        break;
      case 404:
        alert('Resource not found');
        break;
      case 500:
        alert('Server error. Please try again later.');
        break;
      default:
        alert(`HTTP ${response.status}: ${response.error}`);
    }
  }
}
```

### TypeScript (Typed Error Handling)

```ts
import { createClient } from 'hyperwiz';

interface User {
  id: number;
  name: string;
  email: string;
}

const client = createClient('https://api.example.com');

// Handle typed responses
const response = await client.get<User[]>('/users');
if (response.success) {
  // TypeScript knows response.data is User[]
  const users: User[] = response.data;
  console.log('Users:', users);
} else {
  // TypeScript knows response.error is string and response.status is number | undefined
  console.error('Error:', response.error);
  
  if (response.error.includes('Network error')) {
    alert('Unable to connect. Please check your internet connection.');
    
  } else if (response.error === 'Unauthorized access') {
    window.location.href = '/login';
    
  } else if (response.error === 'Token refresh failed') {
    localStorage.clear();
    window.location.href = '/login';
    
  } else if (response.status) {
    switch (response.status) {
      case 400:
        alert(`Bad Request: ${response.error}`);
        break;
      case 404:
        alert('Resource not found');
        break;
      case 500:
        alert('Server error. Please try again later.');
        break;
      default:
        alert(`HTTP ${response.status}: ${response.error}`);
    }
  }
}
```

### Common Error Responses

| Error Type | Response Format | How to Handle |
|------------|----------------|---------------|
| **Network Error** | `{ success: false, error: "Network error: ..." }` | Show connection message |
| **Unauthorized** | `{ success: false, status: 401, error: "Unauthorized access" }` | Redirect to login |
| **Token Refresh Failed** | `{ success: false, status: 403, error: "Token refresh failed" }` | Clear storage, redirect to login |
| **Bad Request** | `{ success: false, status: 400, error: "..." }` | Show validation errors |
| **Not Found** | `{ success: false, status: 404, error: "..." }` | Show "not found" message |
| **Server Error** | `{ success: false, status: 500, error: "..." }` | Show "try again later" |
| **Invalid JSON** | `{ success: false, status?: number, error: "Invalid JSON response" }` | Show "invalid response" message |

### Reusable Error Handler

Create a simple, reusable error handler:

#### JavaScript

```js
function handleApiError(response) {
  if (response.success) return true;
  
  const { error, status } = response;
  
  if (error.includes('Network error')) {
    showNotification('Connection problem. Please try again.', 'error');
    return false;
  }
  
  if (error === 'Unauthorized access') {
    window.location.href = '/login';
    return false;
  }
  
  if (error === 'Token refresh failed') {
    localStorage.clear();
    window.location.href = '/login';
    return false;
  }
  
  if (status) {
    if (status >= 400 && status < 500) {
      showNotification(`Request error: ${error}`, 'error');
    } else if (status >= 500) {
      showNotification('Server error. Please try again later.', 'error');
    }
    return false;
  }
  
  // Unknown error
  showNotification('An unexpected error occurred.', 'error');
  return false;
}

// Usage
async function fetchUsers() {
  const response = await client.get('/users');
  if (handleApiError(response)) {
    return response.data;
  }
  return null;
}

function showNotification(message, type) {
  console.log(`[${type.toUpperCase()}] ${message}`);
  // Implement your notification system here
}
```

#### TypeScript

```ts
type ApiResponse<T> = 
  | { success: true; data: T }
  | { success: false; status?: number; error: string };

function handleApiError<T>(response: ApiResponse<T>): response is { success: true; data: T } {
  if (response.success) return true;
  
  const { error, status } = response;
  
  if (error.includes('Network error')) {
    showNotification('Connection problem. Please try again.', 'error');
    return false;
  }
  
  if (error === 'Unauthorized access') {
    window.location.href = '/login';
    return false;
  }
  
  if (error === 'Token refresh failed') {
    localStorage.clear();
    window.location.href = '/login';
    return false;
  }
  
  if (status) {
    if (status >= 400 && status < 500) {
      showNotification(`Request error: ${error}`, 'error');
    } else if (status >= 500) {
      showNotification('Server error. Please try again later.', 'error');
    }
    return false;
  }
  
  // Unknown error
  showNotification('An unexpected error occurred.', 'error');
  return false;
}

// Usage with type narrowing
async function fetchUsers(): Promise<User[] | null> {
  const response = await client.get<User[]>('/users');
  if (handleApiError(response)) {
    // TypeScript knows response.data is User[]
    return response.data;
  }
  return null;
}

function showNotification(message: string, type: 'error' | 'success' | 'warning'): void {
  console.log(`[${type.toUpperCase()}] ${message}`);
  // Implement your notification system here
}
```

### Error Handling with Auth Middleware

The authentication middleware returns the same `ApiResponse<T>` format, but may throw errors for auth-related issues:

#### JavaScript

```js
import { createClient, createAuthMiddleware } from 'hyperwiz';

const client = createClient('https://api.example.com');
const withAuth = createAuthMiddleware(client);

try {
  // Auth middleware may throw for session issues
  const response = await withAuth((headers) => client.get('/users', headers));
  
  if (response.success) {
    console.log('Users:', response.data);
  } else {
    // Handle regular API errors
    handleApiError(response);
  }
} catch (error) {
  // Handle auth middleware errors
  const message = error.message;
  
  if (message.includes('Session expired') || message.includes('Token refresh failed')) {
    alert('Your session has expired. Please log in again.');
    window.location.href = '/login';
  } else {
    console.error('Unexpected auth error:', message);
  }
}
```

#### TypeScript

```ts
import { createClient, createAuthMiddleware } from 'hyperwiz';

interface User {
  id: number;
  name: string;
  email: string;
}

const client = createClient('https://api.example.com');
const withAuth = createAuthMiddleware(client);

try {
  // Auth middleware may throw for session issues
  const response = await withAuth((headers) => 
    client.get<User[]>('/users', headers)
  );
  
  if (response.success) {
    const users: User[] = response.data;
    console.log('Users:', users);
  } else {
    // Handle regular API errors
    handleApiError(response);
  }
} catch (error) {
  // Handle auth middleware errors
  const message = (error as Error).message;
  
  if (message.includes('Session expired') || message.includes('Token refresh failed')) {
    alert('Your session has expired. Please log in again.');
    window.location.href = '/login';
  } else {
    console.error('Unexpected auth error:', message);
  }
}
```

---

## ⚙️ API Reference

### Core Functions

| Function / Method                        | Description                                                      |
|------------------------------------------|------------------------------------------------------------------|
| `createClient(baseUrl)`                  | Create a new HTTP client instance                                 |
| `client.get<T>(path, headers?)`          | Perform GET request, returns `ApiResponse<T>`                    |
| `client.post<T>(path, body, headers?)`   | Perform POST request, returns `ApiResponse<T>`                   |
| `client.put<T>(path, body, headers?)`    | Perform PUT request, returns `ApiResponse<T>`                    |
| `client.delete<T>(path, headers?)`       | Perform DELETE request, returns `ApiResponse<T>`                 |
| `client.patch<T>(path, body, headers?)`  | Perform PATCH request, returns `ApiResponse<T>`                  |
| `client.setLoginPath(url)`               | Set login redirect URL for auth failures                         |
| `client.setRefreshTokenPath(url)`        | Set refresh token endpoint URL                                   |
| `createAuthMiddleware(client)`           | Creates a withAuth() wrapper for authenticated requests          |

### Token Management

| Function                                 | Description                                                      |
|------------------------------------------|------------------------------------------------------------------|
| `setTokens(access, refresh?, accessAge?, refreshAge?)` | Set JWT tokens with optional expiry (seconds)        |
| `setAccessToken(token, ageInSeconds?)`   | Set access token with optional expiry                           |
| `setRefreshToken(token, ageInSeconds?)`  | Set refresh token with optional expiry                          |
| `getAccessToken()`                       | Get current access token (returns `string \| null`)             |
| `getRefreshToken()`                      | Get current refresh token (returns `string \| null`)            |
| `getAccessExpiresAt()`                   | Get access token expiry timestamp (returns `number \| null`)    |
| `isAccessTokenExpired()`                 | Check if access token is expired (returns `boolean`)            |
| `isRefreshTokenExpired()`                | Check if refresh token is expired (returns `boolean`)           |
| `logout(redirectUrl?)`                   | Clear all tokens and optionally redirect                        |

### TokenAge Utilities

| Function                                 | Description                                                      |
|------------------------------------------|------------------------------------------------------------------|
| `TokenAge.seconds(value, tokenName)`     | Calculate seconds and store age preference                       |
| `TokenAge.minutes(value, tokenName)`     | Calculate minutes and store age preference                       |
| `TokenAge.hours(value, tokenName)`       | Calculate hours and store age preference                         |
| `TokenAge.days(value, tokenName)`        | Calculate days and store age preference                          |
| `TokenAge.months(value, tokenName)`      | Calculate months (30 days) and store age preference             |
| `TokenAge.years(value, tokenName)`       | Calculate years (365 days) and store age preference             |
| `TokenAge.minute()`                      | Returns 60 (convenience method)                                 |
| `TokenAge.hour()`                        | Returns 3600 (convenience method)                               |
| `TokenAge.day()`                         | Returns 86400 (convenience method)                              |
| `TokenAge.week()`                        | Returns 604800 (convenience method)                             |
| `TokenAge.month()`                       | Returns 2592000 (convenience method)                            |
| `TokenAge.year()`                        | Returns 31536000 (convenience method)                           |

---

## 📝 TypeScript Types

### Core Types

```ts
// Request configuration (used internally)
export interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: HeadersInit;
  body?: any;
}

// API response format (returned by all HTTP methods)
type ApiResponse<T> = 
  | { success: true; data: T }
  | { success: false; status?: number; error: string };
```

### Usage Examples

**For TypeScript users:** Define your own API response types based on your server's API:

```ts
// Define your API types
interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

interface CreateUserRequest {
  name: string;
  email: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Use with typed requests
const response = await client.get<User[]>('/users');
if (response.success) {
  const users: User[] = response.data;
}

const paginatedResponse = await client.get<PaginatedResponse<User>>('/users?page=1');
if (paginatedResponse.success) {
  const { data, total, page, limit } = paginatedResponse.data;
}

// Create user with typed request
const userData: CreateUserRequest = { name: 'Alice', email: 'alice@example.com' };
const createResponse = await client.post<User>('/users', userData);
if (createResponse.success) {
  const newUser: User = createResponse.data;
}
```

---

## 🔧 Advanced Configuration

### Setting Login and Refresh URLs

```js
import { createClient } from 'hyperwiz';

const client = createClient('https://api.example.com');

// Set login redirect URL (used when auth fails)
client.setLoginPath('/login');

// Set refresh token endpoint (used for automatic token refresh)
client.setRefreshTokenPath('/auth/refresh');
```

### Client Configuration

```js
// Create client with base URL
const client = createClient('https://api.example.com');

// All requests will be relative to the base URL
await client.get('/users');        // GET https://api.example.com/users
await client.post('/posts', data); // POST https://api.example.com/posts
```

---

## 📦 Module Support

hyperwiz supports both ESM and CommonJS:

**ESM (Recommended):**
```js
import { createClient, setTokens, TokenAge } from 'hyperwiz';
```

**CommonJS:**
```js
const { createClient, setTokens, TokenAge } = require('hyperwiz');
```

---

## 🪪 License

Licensed under the Apache License 2.0.

---

## 🔗 Related Links

- **GitHub:** [https://github.com/wizforge/hyperwiz](https://github.com/wizforge/hyperwiz)
- **npm:** [https://www.npmjs.com/package/hyperwiz](https://www.npmjs.com/package/hyperwiz)
- **Homepage:** [https://wizforge.dev/hyperwiz](https://wizforge.dev/hyperwiz)

---

<p align="center">Made with ❤️ for modern web development</p>