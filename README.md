# HyperWiz 🔐

A secure, lightweight HTTP client library with built-in authentication, token management, and encryption for modern web applications.

## Features ✨

- 🔐 **Secure Token Management** - AES-256 encrypted token storage
- 🔄 **Automatic Token Refresh** - Seamless token renewal
- 🛡️ **Authentication Middleware** - Built-in auth handling
- 🔒 **Memory Security** - Automatic sensitive data cleanup
- ⚡ **Lightweight** - Minimal bundle size
- 🎯 **TypeScript Support** - Full type safety
- 🌐 **Browser-focused** - Optimized for web applications

## Installation 📦

```bash
npm install hyperwiz
# or
yarn add hyperwiz
```

## Quick Start 🚀

> **Note**: This library is designed for browser environments and uses `localStorage` for token storage.

### 1. Basic Setup

```typescript
import { createClient, createAuthMiddleware, setGlobalSecretKey, TokenAge } from 'hyperwiz';

// Create HTTP client
const client = createClient('https://api.example.com', {
  loginUrl: '/login',
  refreshTokenUrl: '/auth/refresh'
});

// Set your secret key (minimum 32 characters for AES-256)
setGlobalSecretKey('your-super-secret-key-at-least-32-chars-long');

// Create auth middleware
const withAuth = createAuthMiddleware(client, 'your-super-secret-key-at-least-32-chars-long');
```

### 2. Store Tokens

```typescript
import { setTokens, TokenAge } from 'hyperwiz';

// Store both access and refresh tokens
await setTokens(
  'your-access-token',
  'your-super-secret-key-at-least-32-chars-long',
  'your-refresh-token',
  TokenAge.hours(1),    // Access token expires in 1 hour
  TokenAge.days(7)      // Refresh token expires in 7 days
);

// Or store tokens individually
await setAccessToken('your-access-token', 'your-secret-key', TokenAge.hours(1));
await setRefreshToken('your-refresh-token', 'your-secret-key', TokenAge.days(7));
```

### 3. Make Authenticated Requests

```typescript
// Define your data types for better type safety
interface UserProfile {
  id: string;
  name: string;
  email: string;
}

// Simple GET request with auth
const userData = await withAuth((headers) => client.get<UserProfile>('/user/profile', headers));

// Check the response with proper TypeScript types
if (userData.success) {
  console.log('User data:', userData.data); // TypeScript knows this is UserProfile
} else {
  console.error('Request failed:', userData.error); // TypeScript knows this is string
  // Handle request failure
}

// POST request with auth
const newPost = await withAuth(async (headers) => {
  return await client.post('/posts', { title: 'Hello World' }, headers);
});

if (newPost.success) {
  console.log('Created post:', newPost.data);
} else {
  console.error('Failed to create post:', newPost.error);
}
```

## API Reference 📚

### Client Configuration

#### `createClient(baseUrl, config?)`

Creates an HTTP client instance.

```typescript
interface ClientConfig {
  loginUrl?: string;           // Login page URL for redirects
  refreshTokenUrl?: string;    // Token refresh endpoint
  cookieDomain?: string;       // Cookie domain (future use)
  cookiePath?: string;         // Cookie path (future use)
  cookieSecure?: boolean;      // Secure cookies (future use)
  cookieSameSite?: 'Strict' | 'Lax' | 'None'; // SameSite policy (future use)
}
```

### Token Management

#### `setGlobalSecretKey(secretKey: string)`

Sets the global secret key for token encryption/decryption.

```typescript
setGlobalSecretKey('your-super-secret-key-at-least-32-chars-long');
```

#### `setTokens(accessToken, secretKey, refreshToken?, accessAge?, refreshAge?)`

Stores both access and refresh tokens with expiration times.

```typescript
await setTokens(
  'access-token',
  'secret-key',
  'refresh-token',
  TokenAge.hours(1),    // Access token age
  TokenAge.days(7)      // Refresh token age
);
```

#### `setAccessToken(token, secretKey, ageInSeconds?)`

Stores only the access token.

```typescript
await setAccessToken('access-token', 'secret-key', TokenAge.hours(1));
```

#### `setRefreshToken(token, secretKey, ageInSeconds?)`

Stores only the refresh token.

```typescript
await setRefreshToken('refresh-token', 'secret-key', TokenAge.days(7));
```

#### `getAccessToken(): Promise<string | null>`

Retrieves the decrypted access token.

```typescript
const token = await getAccessToken();
```

#### `getRefreshToken(): Promise<string | null>`

Retrieves the decrypted refresh token.

```typescript
const token = await getRefreshToken();
```

#### `isAccessTokenExpired(): boolean`

Checks if the access token has expired.

```typescript
if (isAccessTokenExpired()) {
  // Handle expired token
}
```

#### `isRefreshTokenExpired(): boolean`

Checks if the refresh token has expired.

```typescript
if (isRefreshTokenExpired()) {
  // Handle expired refresh token
}
```

#### `logout(redirectUrl?)`

Clears all tokens and optionally redirects to login.

```typescript
logout('/login'); // Redirects to login page
logout();         // Just clears tokens
```

### Time Utilities

#### `TokenAge`

Convenient time duration helpers.

```typescript
// Duration methods
TokenAge.seconds(30)    // 30 seconds
TokenAge.minutes(5)     // 5 minutes
TokenAge.hours(2)       // 2 hours
TokenAge.days(7)        // 7 days
TokenAge.weeks(2)       // 2 weeks
TokenAge.months(1)      // 1 month
TokenAge.years(1)       // 1 year

// Convenience methods
TokenAge.minute()       // 60 seconds
TokenAge.hour()         // 3600 seconds
TokenAge.day()          // 86400 seconds
TokenAge.week()         // 604800 seconds
TokenAge.month()        // 2592000 seconds
TokenAge.year()         // 31536000 seconds
```

### Authentication Middleware

#### `createAuthMiddleware(client, secretKey?)`

Creates authentication middleware that handles token refresh automatically.

```typescript
const withAuth = createAuthMiddleware(client, 'your-secret-key');

// Use with any async function that needs auth headers
const result = await withAuth(async (headers) => {
  // Your API call here
  return await client.get('/protected-endpoint', headers);
});

// Check the response
if (result.success) {
  console.log('Success:', result.data);
} else {
  console.error('Request failed:', result.error);
  // Handle request failure
}
```

**Note:** The middleware uses the same response format as HttpClient:
```typescript
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; status?: number; error: string };
```

### HTTP Client Methods

#### `client.get(url, headers?)`

```typescript
const response = await client.get('/users', { 'Custom-Header': 'value' });
```

#### `client.post(url, body, headers?)`

```typescript
const response = await client.post('/users', { name: 'John' }, headers);
```

#### `client.put(url, body, headers?)`

```typescript
const response = await client.put('/users/1', { name: 'Jane' }, headers);
```

#### `client.patch(url, body, headers?)`

```typescript
const response = await client.patch('/users/1', { name: 'Jane' }, headers);
```

#### `client.delete(url, headers?)`

```typescript
const response = await client.delete('/users/1', headers);
```

## Complete Example 📝

```typescript
import { 
  createClient, 
  createAuthMiddleware, 
  setGlobalSecretKey, 
  setTokens, 
  TokenAge 
} from 'hyperwiz';

// 1. Setup
const client = createClient('https://api.example.com', {
  loginUrl: '/login',
  refreshTokenUrl: '/auth/refresh'
});

setGlobalSecretKey('your-super-secret-key-at-least-32-chars-long');
const withAuth = createAuthMiddleware(client, 'your-super-secret-key-at-least-32-chars-long');

// 2. Login and store tokens
async function login(email: string, password: string) {
  const response = await client.post('/auth/login', { email, password });
  
  if (response.success) {
    await setTokens(
      response.data.accessToken,
      'your-super-secret-key-at-least-32-chars-long',
      response.data.refreshToken,
      TokenAge.hours(1),
      TokenAge.days(7)
    );
    return response.data;
  }
  
  throw new Error(response.error);
}

// 3. Make authenticated requests
async function getUserProfile() {
  return await withAuth(async (headers) => {
    const response = await client.get('/user/profile', headers);
    return response.data;
  });
}

async function createPost(title: string, content: string) {
  return await withAuth(async (headers) => {
    const response = await client.post('/posts', { title, content }, headers);
    return response.data;
  });
}

// 4. Usage
async function main() {
  try {
    // Login
    await login('user@example.com', 'password123');
    
    // Get user profile
    const profile = await getUserProfile();
    console.log('Profile:', profile);
    
    // Create a post
    const post = await createPost('Hello World', 'This is my first post!');
    console.log('Created post:', post);
    
  } catch (error) {
    console.error('Error:', error);
  }
}
```

## Security Features 🔒

### Token Storage
- **localStorage encryption** - Tokens stored encrypted in browser localStorage
- **AES-256-GCM** encryption for all tokens
- **PBKDF2** key derivation with 600,000 iterations
- **Secure salt** for key derivation
- **Memory protection** - sensitive data automatically cleared

### Automatic Token Refresh
- **Seamless refresh** - handles token expiration automatically
- **Retry logic** - retries failed requests after token refresh
- **Fallback handling** - redirects to login when refresh fails

### Error Handling
- **Comprehensive validation** - input validation for all parameters
- **Descriptive errors** - clear error messages for debugging
- **Graceful degradation** - handles network and crypto errors

### Browser Security
- **Same-origin policy** - Tokens only accessible from same domain
- **HTTPS recommended** - Use HTTPS in production for secure token transmission
- **Session management** - Automatic cleanup on logout

## Environment Support 🌐

### Browser Support ✅
- **Modern browsers** with Web Crypto API support
- **Chrome 37+**
- **Firefox 34+**
- **Safari 11+**
- **Edge 12+**

### Node.js Support ❌
**Currently not supported** - This library uses `localStorage` for token storage, which is only available in browser environments.

For Node.js applications, consider:
- Using a different storage mechanism (files, databases)
- Implementing a custom storage adapter
- Using browser-based authentication flows

## License 📄

Apache License 2.0 - see [LICENSE](LICENSE) file for details.
