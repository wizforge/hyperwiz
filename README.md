# hyperwiz

<div align="center">
  <img src="https://github.com/wizforge/hyperwiz/blob/main/logo.png" alt="hyperwiz logo" width="200" height="200">
</div>

<div align="center">

[![npm version](https://img.shields.io/npm/v/hyperwiz.svg?style=flat-square)](https://www.npmjs.com/package/hyperwiz)
[![npm downloads](https://img.shields.io/npm/dm/hyperwiz.svg?style=flat-square)](https://www.npmjs.com/package/hyperwiz)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg?style=flat-square)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/npm/l/hyperwiz.svg?style=flat-square)](https://github.com/wizforge/hyperwiz/blob/main/LICENSE)

</div>

A lightweight, flexible HTTP client library with powerful interceptors for modern web applications.

## ✨ Features

- **🚀 Simple Setup** - One-line client creation
- **🔧 Flexible Interceptors** - Add request/response/error handlers
- **🍪 Cookie Support** - Works with credentials and cross-origin requests
- **🔐 Bearer Token Support** - Manual or automatic token handling
- **🔄 Auto Retry** - Adaptive backoff with exponential delay
- **⚡ Built-in Features** - Logging, timeout, and error handling
- **🛡️ TypeScript Support** - Full type safety and IntelliSense
- **🌐 Cross-Origin Ready** - Built-in credentials support
- **🔒 Developer Control** - You decide how to handle authentication

## 🚀 Quick Start

```typescript
import { createClient } from 'hyperwiz';

// Simple client
const api = createClient('https://api.example.com', { logging: true });

// Make requests
const users = await api.get('/users');
const newUser = await api.post('/users', { name: 'John' });
```

## 📖 Usage Examples

### Basic HTTP Methods

```typescript
const api = createClient('https://api.example.com');

// GET request
const users = await api.get('/users');

// POST request
const newUser = await api.post('/users', { name: 'John', email: 'john@example.com' });

// PUT request
const updatedUser = await api.put('/users/1', { name: 'John Updated' });

// PATCH request
const patchedUser = await api.patch('/users/1', { email: 'john.new@example.com' });

// DELETE request
const deleted = await api.delete('/users/1');

// HEAD request - Get headers only (useful for checking if resource exists)
const userExists = await api.head('/users/123');

// OPTIONS request - Get allowed methods for a resource (CORS preflight)
const allowedMethods = await api.options('/users');

// PURGE request - Clear cache (useful for CDNs like Cloudflare)
const cacheCleared = await api.purge('/cache/clear');
```

### Auto Retry with Adaptive Backoff

```typescript
// Option 1: Simple boolean (uses default retry configuration)
const api1 = createClient('https://api.example.com', {
  retry: true, // Uses default: 3 retries, 1s delay, exponential backoff
  logging: true
});

// Option 2: Custom retry configuration
const api2 = createClient('https://api.example.com', {
  retry: {
    maxRetries: 5,           // Retry up to 5 times
    retryDelay: 500,         // Start with 500ms delay
    maxDelay: 5000,          // Maximum 5 second delay
    backoffMultiplier: 1.5,  // Gentler backoff (1.5x instead of 2x)
    retryOnStatus: [408, 429, 500, 502, 503, 504], // Retry on these status codes
    retryOnNetworkError: true // Retry on network errors
  },
  logging: true
});

// Option 3: Disable retry
const api3 = createClient('https://api.example.com', {
  retry: false, // No retry attempts
  logging: true
});

// All requests automatically retry if they fail
// Retries preserve the original HTTP method, headers, and body
const data = await api1.get('/unreliable-endpoint');
const user = await api2.post('/users', { name: 'John' }); // POST retries as POST
```

### Request Caching (Smart In-Memory or IndexedDB)

```typescript
// Option 1: Simple boolean (uses default cache configuration)
const api1 = createClient('https://api.example.com', {
  cache: true, // Uses default: 5min cache, memory storage, GET requests only
  logging: true
});

// Option 2: Custom cache configuration
const api2 = createClient('https://api.example.com', {
  cache: {
    enabled: true,
    maxAge: 10 * 60 * 1000,  // Cache for 10 minutes
    maxSize: 50,             // Maximum 50 cached items
    storage: 'indexeddb',    // Use IndexedDB for persistence
    includeQueryParams: true, // Include query params in cache key
    cacheableMethods: ['GET', 'HEAD'], // Cache GET and HEAD requests
    cacheableStatusCodes: [200, 304]   // Cache 200 and 304 responses
  },
  logging: true
});

// Option 3: Memory cache with custom settings
const api3 = createClient('https://api.example.com', {
  cache: {
    enabled: true,
    maxAge: 2 * 60 * 1000,   // Cache for 2 minutes
    maxSize: 20,             // Maximum 20 cached items
    storage: 'memory',       // Use in-memory storage (faster)
    includeQueryParams: false // Ignore query params for cache key
  },
  logging: true
});

// Option 4: Disable caching
const api4 = createClient('https://api.example.com', {
  cache: false, // No caching
  logging: true
});

// First request: fetches from server
const users1 = await api1.get('/users'); // ⏳ Network request

// Second request: served from cache (instant)
const users2 = await api1.get('/users'); // 💾 Cache hit (instant)

// Cache automatically expires after maxAge
// Cache automatically evicts old entries when maxSize is reached
```

### Additional HTTP Methods

hyperwiz supports additional HTTP methods beyond the standard REST operations for enhanced functionality:

```typescript
const api = createClient('https://api.example.com');

// HEAD - Get headers only (no body)
// Useful for checking if resource exists without downloading data
const userExists = await api.head('/users/123');
if (userExists.success) {
  console.log('User exists!');
  console.log('Last modified:', userExists.data.headers['last-modified']);
}

// OPTIONS - Get allowed methods for a resource
// Essential for CORS preflight requests and API discovery
const capabilities = await api.options('/users');
if (capabilities.success) {
  console.log('Allowed methods:', capabilities.data.headers['allow']);
  console.log('CORS headers:', capabilities.data.headers['access-control-allow-methods']);
}

// PURGE - Clear cache
// Useful for CDNs like Cloudflare, Fastly, etc.
const cacheCleared = await api.purge('/cache/clear');
if (cacheCleared.success) {
  console.log('Cache cleared successfully');
}
```

**Use Cases:**

- **HEAD**: Check resource existence, get metadata, validate URLs
- **OPTIONS**: CORS preflight, API discovery, check server capabilities  
- **PURGE**: Cache invalidation, CDN management, content updates

### Automatic Content-Type Detection

hyperwiz automatically detects and sets the appropriate `Content-Type` header for common data types:

```typescript
const api = createClient('https://api.example.com');

// 📊 JSON objects/arrays - automatically sets 'application/json'
const user = await api.post('/users', { name: 'John', email: 'john@example.com' });
// Content-Type: application/json

// 📝 Plain text - automatically sets 'text/plain'
const message = await api.post('/messages', 'Hello, world!');
// Content-Type: text/plain

// 🌐 HTML content - automatically sets 'text/html'
const htmlContent = await api.post('/content', '<h1>Hello</h1><p>World</p>');
// Content-Type: text/html

// 📋 XML content - automatically sets 'application/xml'
const xmlData = await api.post('/data', '<?xml version="1.0"?><root><item>value</item></root>');
// Content-Type: application/xml

// 📦 FormData - automatically sets 'multipart/form-data'
const formData = new FormData();
formData.append('name', 'John');
formData.append('file', fileInput.files[0]);
const result = await api.post('/upload', formData);
// Content-Type: multipart/form-data

// 🔗 URLSearchParams - automatically sets 'application/x-www-form-urlencoded'
const params = new URLSearchParams();
params.append('name', 'John');
params.append('email', 'john@example.com');
const response = await api.post('/users', params);
// Content-Type: application/x-www-form-urlencoded

// 📁 File/Blob objects - uses their built-in type property
await api.post('/upload', file); // Uses file.type
await api.post('/upload', blob); // Uses blob.type

// 💾 Binary data - defaults to 'application/octet-stream'
const buffer = new ArrayBuffer(8);
const binary = await api.post('/binary', buffer);
// Content-Type: application/octet-stream

// 📅 Dates - automatically converts to ISO string and sets 'application/json'
const date = new Date();
const event = await api.post('/events', date);
// Content-Type: application/json, body: "2024-01-01T00:00:00.000Z"

// 🔢 Numbers/Booleans - automatically sets 'application/json'
await api.post('/config', { enabled: true, count: 42 });
// Content-Type: application/json
```

**Supported Data Types:**

| Data Type | Content-Type | Detection Method |
|-----------|-------------|------------------|
| Objects/Arrays | `application/json` | Automatic |
| Strings (JSON) | `application/json` | Content analysis |
| Strings (HTML) | `text/html` | Content analysis |
| Strings (XML) | `application/xml` | Content analysis |
| Strings (other) | `text/plain` | Default |
| FormData | `multipart/form-data` | Type check |
| URLSearchParams | `application/x-www-form-urlencoded` | Type check |
| File | `file.type` | File properties |
| Blob | `blob.type` | Blob properties |
| ArrayBuffer | `application/octet-stream` | Default |
| TypedArrays | `application/octet-stream` | Default |
| Date | `application/json` | Automatic |
| Numbers/Booleans | `application/json` | Automatic |

**Manual Override:**

You can always manually override the Content-Type header:

```typescript
// Override automatic detection
const response = await api.post('/custom', data, {
  'Content-Type': 'application/custom+json'
});
```

### 📁 File Upload Examples

**Simple file upload with automatic Content-Type detection:**

```typescript
const api = createClient('https://api.example.com');

// 🖼️ Profile Picture Upload - Send actual file
const fileInput = document.getElementById('fileInput') as HTMLInputElement;
const file = fileInput.files[0];
await api.post('/profile/upload', file);
// Content-Type: image/jpeg (from file.type)

// 📄 Document Upload - Send actual file
const pdfFile = new File(['pdf content'], 'document.pdf', { type: 'application/pdf' });
await api.post('/documents/upload', pdfFile);
// Content-Type: application/pdf (from file.type)

// 🎵 Audio Upload - Send actual file
const audioBlob = new Blob(['audio content'], { type: 'audio/mpeg' });
await api.post('/audio/upload', audioBlob);
// Content-Type: audio/mpeg (from blob.type)

// 🎬 Video Upload - Send actual file
const videoFile = new File(['video content'], 'movie.mp4', { type: 'video/mp4' });
await api.post('/video/upload', videoFile);
// Content-Type: video/mp4 (from file.type)

// 📦 Multiple Files - Use FormData
const formData = new FormData();
formData.append('photo', photoFile);
formData.append('document', documentFile);
formData.append('audio', audioFile);
await api.post('/upload-multiple', formData);
// Content-Type: multipart/form-data

// 🖼️ Image Gallery Upload - Use FormData
const galleryForm = new FormData();
galleryFiles.forEach((file, index) => {
  galleryForm.append(`image${index}`, file);
});
await api.post('/gallery/upload', galleryForm);
// Content-Type: multipart/form-data
```

**How it works:**
- **Step 1**: Developer sends actual file objects (`File`, `Blob`, `FormData`)
- **Step 2**: Library uses the file's built-in `type` property
- **Step 3**: Automatically sets the correct `Content-Type` header
- **Step 4**: Sends the request with proper Content-Type
- **Result**: Developer sends actual file content - **zero configuration needed!**
- **Supports**: All file types that have proper MIME types

### Manual Bearer Token Authentication

```typescript
const api = createClient('https://api.example.com');

// Developer sends token manually in each request
const profile = await api.get('/user/profile', {
  'Authorization': 'Bearer your-token-here'
});

const newPost = await api.post('/posts', { title: 'Hello' }, {
  'Authorization': 'Bearer your-token-here'
});
```

### Automatic Bearer Token with Interceptors

```typescript
const api = createClient('https://api.example.com');

// Add token interceptor
api.addBefore((config, url) => {
  const token = localStorage.getItem('token');
  if (token) {
    return {
      ...config,
      headers: {
        ...config.headers,
        'Authorization': `Bearer ${token}`
      }
    };
  }
  return config;
});

// Login (no token yet - works correctly)
const login = await api.post('/login', { username: 'admin', password: '123' });

// Store token after successful login
if (login.success) {
  localStorage.setItem('token', login.data.token);
}

// Now all requests automatically include the token
const profile = await api.get('/user/profile');
const posts = await api.get('/user/posts');
```

### Cookie-Based Authentication

```typescript
// For session-based authentication with cookies
const api = createClient('http://localhost:4000', {
  credentials: 'include', // Important for cookies
  logging: true
});

// Login - server sets session cookie
const login = await api.post('/login', { username: 'admin' });

// Subsequent requests - cookies are automatically sent
const profile = await api.get('/user/profile');
const data = await api.get('/protected-data');
```

### Custom Interceptors

```typescript
const api = createClient('https://api.example.com');

// Request interceptor - runs before each request
api.addBefore((config, url) => {
  console.log(`🚀 Making ${config.method} request to ${url}`);
  return config;
});

// Response interceptor - runs after successful responses
api.addAfter((response, data, url) => {
  console.log(`✅ Response from ${url}:`, data);
  return data;
});

// Error interceptor - runs when errors occur (includes request config)
api.addErrorHandler((error, url, requestConfig) => {
  console.error(`❌ Error for ${requestConfig?.method} ${url}:`, error);
  return error;
});
```

### Token Refresh Logic

```typescript
const api = createClient('https://api.example.com');

api.addAfter((response, data, url) => {
  if (response.status === 401) {
    // Token expired, refresh it
    refreshToken();
  }
  return data;
});

// Or use error handler for more control
api.addErrorHandler((error, url, requestConfig) => {
  if (isAuthError(error)) {
    // Refresh token and retry the original request
    return handleAuthRetry(error, url, requestConfig);
  }
  return error;
});
```

### Request Timeout

```typescript
const api = createClient('https://api.example.com', {
  timeout: 5000 // 5 second timeout
});

// All requests will timeout after 5 seconds
const data = await api.get('/slow-endpoint');
```

## ⚙️ Configuration Options

```typescript
const api = createClient('https://api.example.com', {
  logging: true,           // Enable request/response logging
  timeout: 30000,          // Request timeout in milliseconds
  credentials: 'include',  // Credentials mode for cross-origin
  retry: true,             // Auto retry (boolean) or retry config object
  // retry: {              // Custom retry configuration
  //   maxRetries: 3,      // Maximum retry attempts
  //   retryDelay: 1000,   // Initial delay in milliseconds
  //   maxDelay: 10000,    // Maximum delay in milliseconds
  //   backoffMultiplier: 2, // Exponential backoff multiplier
  //   retryOnStatus: [408, 429, 500, 502, 503, 504], // HTTP status codes to retry
  //   retryOnNetworkError: true // Retry on network errors
  // },
  cache: true,             // Request caching (boolean) or cache config object
  // cache: {              // Custom cache configuration
  //   enabled: true,      // Enable/disable caching
  //   maxAge: 300000,     // Cache duration in milliseconds (5 minutes)
  //   maxSize: 100,       // Maximum number of cached items
  //   storage: 'memory',  // Storage type: 'memory' or 'indexeddb'
  //   includeQueryParams: true, // Include query params in cache key
  //   cacheableMethods: ['GET', 'HEAD'], // HTTP methods that can be cached
  //   cacheableStatusCodes: [200] // Status codes that can be cached
  // },
      interceptors: {          // Custom interceptors
      before: [(config, url) => { /* ... */ }],
      after: [(response, data, url) => { /* ... */ }],
      onError: [(error, url, requestConfig) => { /* ... */ }]
    }
});
```

## 🔧 API Reference

### Client Creation

```typescript
// Basic client
createClient(baseUrl: string, config?: ClientConfig): HttpClient

// Public client (with logging enabled by default)
createPublicClient(baseUrl: string): HttpClient
```

### createPublicClient - Quick Development Setup

The `createPublicClient` function is a convenience method that creates an HTTP client with logging enabled by default. Perfect for development and debugging.

```typescript
import { createPublicClient } from 'hyperwiz';

// Creates a client with automatic logging
const api = createPublicClient('https://api.example.com');

// Equivalent to:
// const api = createClient('https://api.example.com', { logging: true });

// All requests are automatically logged to console
const users = await api.get('/users');
// Console output: ✅ 200 https://api.example.com/users [response data]

const newUser = await api.post('/users', { name: 'John' });
// Console output: ✅ 201 https://api.example.com/users [created user data]
```

### Memory Management Functions

For long-running applications, hyperwiz provides memory management utilities to prevent memory leaks and monitor resource usage:

```typescript
import { 
  cleanupCircuitBreakers,
  cleanupRetryAttempts, 
  cleanupPendingRequests,
  getMemoryStats 
} from 'hyperwiz';
```

#### cleanupCircuitBreakers()
Manually cleans up circuit breaker states that are older than 1 hour.

```typescript
// Clean up circuit breaker tracking data
cleanupCircuitBreakers();

// Use in maintenance routines
setInterval(() => {
  cleanupCircuitBreakers();
  console.log('Circuit breakers cleaned up');
}, 30 * 60 * 1000); // Every 30 minutes
```

#### cleanupRetryAttempts()
Manually cleans up retry attempt tracking data older than 30 minutes.

```typescript
// Clean up retry tracking data
cleanupRetryAttempts();

// Use during user session changes
function logout() {
  cleanupRetryAttempts(); // Clear retry history
  // ... other logout logic
}
```

#### cleanupPendingRequests()
Immediately clears all pending request deduplication data.

```typescript
// Clear all pending requests (useful during app shutdown)
cleanupPendingRequests();

// Use when switching contexts or during cleanup
function resetApplication() {
  cleanupPendingRequests(); // Clear any ongoing requests
  // ... other reset logic
}
```

#### getMemoryStats()
Returns statistics about memory usage for monitoring and debugging.

```typescript
// Monitor memory usage
const stats = getMemoryStats();
console.log('Memory stats:', stats);
// Output: {
//   circuitBreakers: 5,        // Number of active circuit breakers
//   retryAttempts: 12,         // Number of tracked retry attempts
//   pendingRequests: 3,        // Number of pending requests
//   globalCacheStorages: 2     // Number of cache storage instances
// }

// Use in monitoring dashboards
function monitorMemoryUsage() {
  const stats = getMemoryStats();
  
  if (stats.pendingRequests > 50) {
    console.warn('High number of pending requests:', stats.pendingRequests);
  }
  
  if (stats.circuitBreakers > 20) {
    console.warn('Many circuit breakers active, consider cleanup');
  }
  
  // Send to analytics or monitoring service
  analytics.track('hyperwiz_memory_stats', stats);
}
```

#### Complete Memory Management Example

```typescript
import { 
  createClient, 
  cleanupCircuitBreakers, 
  cleanupRetryAttempts, 
  cleanupPendingRequests,
  getMemoryStats 
} from 'hyperwiz';

class ApiService {
  private api = createClient('https://api.example.com', {
    retry: true,
    cache: true,
    logging: process.env.NODE_ENV === 'development'
  });

  constructor() {
    this.startMaintenanceTimer();
  }

  // Periodic cleanup for memory management
  private startMaintenanceTimer() {
    setInterval(() => {
      // Clean up old data
      cleanupCircuitBreakers();
      cleanupRetryAttempts();
      
      // Monitor memory usage
      const stats = getMemoryStats();
      console.log('Memory cleanup completed:', stats);
      
      // Alert if memory usage is high
      if (stats.pendingRequests > 100) {
        console.warn('Memory leak warning: Too many pending requests');
      }
    }, 10 * 60 * 1000); // Every 10 minutes
  }

  // Clean shutdown
  async shutdown() {
    console.log('Shutting down API service...');
    
    // Force clear all pending requests
    cleanupPendingRequests();
    
    // Clean up tracking data
    cleanupCircuitBreakers();
    cleanupRetryAttempts();
    
    const finalStats = getMemoryStats();
    console.log('Final memory stats after cleanup:', finalStats);
  }

  // User logout - clear sensitive data
  async logout() {
    // Clear pending requests for security
    cleanupPendingRequests();
    console.log('User session cleaned up');
  }
}

// Usage
const apiService = new ApiService();

// During app shutdown
window.addEventListener('beforeunload', () => {
  apiService.shutdown();
});
```

**Note:** The library automatically runs cleanup every 10 minutes, but these manual functions give you fine-grained control for specific use cases like application shutdown, user logout, or custom maintenance schedules.

### HTTP Methods

```typescript
// All methods return Promise<ApiResponse<T>>
api.get<T>(url: string, headers?: HeadersInit)
api.post<T>(url: string, body: unknown, headers?: HeadersInit)
api.put<T>(url: string, body: unknown, headers?: HeadersInit)
api.patch<T>(url: string, body: unknown, headers?: HeadersInit)
api.delete<T>(url: string, headers?: HeadersInit)

// Additional HTTP methods
api.head<T>(url: string, headers?: HeadersInit)
api.options<T>(url: string, headers?: HeadersInit)
api.purge<T>(url: string, headers?: HeadersInit)
```

### Interceptor Methods

```typescript
// Add interceptors
api.addBefore(handler: RequestHandler)
api.addAfter(handler: ResponseHandler)
api.addErrorHandler(handler: ErrorHandler)

// Remove interceptors
api.removeBefore(handler: RequestHandler)
api.removeAfter(handler: ResponseHandler)
api.removeErrorHandler(handler: ErrorHandler)

// Clear all interceptors
api.clearInterceptors()

// Set timeout
api.setTimeout(timeoutMs: number)

// Cancel all requests
api.cancelAllRequests()
```

## 🎯 How Developers Use This Library

### 1. **Simple API Client** - Most Common Use Case

```typescript
import { createClient } from 'hyperwiz';

// Create a simple API client
const api = createClient('https://api.example.com', {
  logging: true,  // See all requests in console
  retry: true     // Auto-retry failed requests
});

// Use it like fetch but simpler
const users = await api.get('/users');
const newUser = await api.post('/users', { name: 'John' });
const updatedUser = await api.put('/users/1', { name: 'John Updated' });
const deleted = await api.delete('/users/1');
```

### 2. **Authentication with Bearer Tokens** - Manual Control

```typescript
const api = createClient('https://api.example.com');

// Developer manually adds tokens to each request
const profile = await api.get('/user/profile', {
  'Authorization': 'Bearer your-token-here'
});

const newPost = await api.post('/posts', { title: 'Hello' }, {
  'Authorization': 'Bearer your-token-here'
});
```

### 3. **Automatic Token Injection** - Using Interceptors

```typescript
const api = createClient('https://api.example.com');

// Add token interceptor - automatically adds token to all requests
api.addBefore((config, url) => {
  const token = localStorage.getItem('token');
  if (token) {
    return {
      ...config,
      headers: {
        ...config.headers,
        'Authorization': `Bearer ${token}`
      }
    };
  }
  return config;
});

// Now all requests automatically include the token
const profile = await api.get('/user/profile'); // ✅ Token added automatically
const posts = await api.post('/posts', { title: 'New Post' }); // ✅ Token added automatically
```

### 4. **Session-Based Authentication** - Cookies

```typescript
// For server-side sessions (like Express.js sessions)
const api = createClient('http://localhost:4000', {
  credentials: 'include', // Important: sends cookies automatically
  logging: true
});

// Login - server sets session cookie
const login = await api.post('/login', { username: 'admin', password: '123' });

// All subsequent requests automatically include the session cookie
const profile = await api.get('/user/profile'); // ✅ Cookie sent automatically
const data = await api.get('/protected-data'); // ✅ Cookie sent automatically
```

### 5. **Reliable API with Auto-Retry** - Production Ready

```typescript
const api = createClient('https://api.example.com', {
  retry: {
    maxRetries: 3,           // Retry failed requests up to 3 times
    retryDelay: 1000,        // Start with 1 second delay
    maxDelay: 10000,         // Maximum 10 second delay
    backoffMultiplier: 2,    // Double the delay each retry
    retryOnStatus: [408, 429, 500, 502, 503, 504], // Retry on these errors
    retryOnNetworkError: true // Retry on network failures
  },
  timeout: 10000,            // 10 second timeout
  logging: true              // Log all requests and retries
});

// This request will automatically retry if it fails
// Retries preserve the original method (POST), body, and headers
const result = await api.post('/orders', { 
  productId: 123, 
  quantity: 2 
});
```

### 6. **React Hook Pattern** - Modern React Apps

```typescript
import { useState, useCallback } from 'react';
import { createClient } from 'hyperwiz';

function useApi() {
  const [api] = useState(() => createClient('https://api.example.com', {
    retry: true,
    logging: process.env.NODE_ENV === 'development'
  }));

  const login = useCallback(async (credentials: any) => {
    const response = await api.post('/auth/login', credentials);
    if (response.success) {
      localStorage.setItem('auth-token', response.data.token);
    }
    return response;
  }, [api]);

  const logout = useCallback(() => {
    localStorage.removeItem('auth-token');
  }, []);

  const getProfile = useCallback(async () => {
    const token = localStorage.getItem('auth-token');
    return await api.get('/user/profile', {
      'Authorization': `Bearer ${token}`
    });
  }, [api]);

  return { api, login, logout, getProfile };
}

// Usage in component
function ProfileComponent() {
  const { getProfile } = useApi();
  
  const handleLoadProfile = async () => {
    const profile = await getProfile();
    if (profile.success) {
      console.log('Profile:', profile.data);
    }
  };
}
```

### 7. **API Service Class** - Organized Code

```typescript
class UserAPI {
  private api = createClient('https://api.example.com', { 
    retry: true,
    logging: true 
  });

  constructor() {
    // Add authentication interceptor
    this.api.addBefore((config, url) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers = { 
          ...config.headers, 
          'Authorization': `Bearer ${token}` 
        };
      }
      return config;
    });

    // Add error logging
    this.api.addErrorHandler((error, url, requestConfig) => {
      console.error(`API Error: ${requestConfig?.method} ${url}`, error);
      return error;
    });
  }

  async getUsers() {
    const response = await this.api.get('/users');
    return response.success ? response.data : [];
  }

  async createUser(userData: any) {
    const response = await this.api.post('/users', userData);
    return response.success ? response.data : null;
  }

  async updateUser(id: string, userData: any) {
    const response = await this.api.put(`/users/${id}`, userData);
    return response.success ? response.data : null;
  }

  async deleteUser(id: string) {
    const response = await this.api.delete(`/users/${id}`);
    return response.success;
  }
}

// Usage
const userAPI = new UserAPI();
const users = await userAPI.getUsers();
const newUser = await userAPI.createUser({ name: 'John', email: 'john@example.com' });
```

### 8. **E-commerce with Different Retry Strategies**

```typescript
class EcommerceAPI {
  // Critical operations (payments, orders) - aggressive retry
  private criticalApi = createClient('https://api.shop.com', {
    retry: {
      maxRetries: 5,           // More retries for critical operations
      retryDelay: 500,         // Start with shorter delay
      maxDelay: 5000,          // Shorter max delay
      backoffMultiplier: 1.5,  // Gentler backoff
      retryOnStatus: [500, 502, 503, 504], // Only retry server errors
      retryOnNetworkError: true
    }
  });

  // Normal operations (products, reviews) - standard retry
  private normalApi = createClient('https://api.shop.com', {
    retry: {
      maxRetries: 3,           // Standard retries
      retryDelay: 1000,        // Standard delay
      maxDelay: 10000,         // Standard max delay
      backoffMultiplier: 2,    // Standard backoff
      retryOnStatus: [408, 429, 500, 502, 503, 504],
      retryOnNetworkError: true
    }
  });

  // Critical operation - aggressive retry
  async createOrder(orderData: any) {
    return await this.criticalApi.post('/orders', orderData);
  }

  // Normal operation - standard retry
  async getProducts() {
    return await this.normalApi.get('/products');
  }

  async getProductReviews(productId: string) {
    return await this.normalApi.get(`/products/${productId}/reviews`);
  }
}
```

### 9. **Custom Error Handling with Retry**

```typescript
const api = createClient('https://api.example.com', {
  retry: true,
  logging: true
});

// Custom error handling
api.addErrorHandler((error, url, requestConfig) => {
  // Log specific errors
  if (requestConfig?.method === 'POST' && url.includes('/orders')) {
    console.error('Order creation failed:', error);
  }
  
  // Handle specific error types
  if (isRateLimitError(error)) {
    console.warn('Rate limit hit, will retry with backoff');
  }
  
  return error; // Let the retry mechanism handle it
});

function isRateLimitError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 
         'status' in error && (error as any).status === 429;
}
```

### 10. **Smart Caching for Performance**

```typescript
// E-commerce app with different caching strategies
class ProductAPI {
  // Product catalog - long cache (rarely changes)
  private catalogApi = createClient('https://api.shop.com', {
    cache: {
      enabled: true,
      maxAge: 30 * 60 * 1000,  // 30 minutes
      maxSize: 100,
      storage: 'indexeddb',     // Persistent across sessions
      cacheableMethods: ['GET', 'HEAD'],
      cacheableStatusCodes: [200]
    }
  });

  // User-specific data - short cache (changes frequently)
  private userApi = createClient('https://api.shop.com', {
    cache: {
      enabled: true,
      maxAge: 2 * 60 * 1000,   // 2 minutes
      maxSize: 20,
      storage: 'memory',        // Fast access
      cacheableMethods: ['GET', 'HEAD'],
      cacheableStatusCodes: [200]
    }
  });

  // Real-time data - no cache
  private realtimeApi = createClient('https://api.shop.com', {
    cache: false, // Always fresh data
    retry: true
  });

  // Product catalog (cached for 30 minutes)
  async getProducts(category?: string) {
    const url = category ? `/products?category=${category}` : '/products';
    return await this.catalogApi.get(url);
  }

  // User cart (cached for 2 minutes)
  async getUserCart() {
    return await this.userApi.get('/user/cart', {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    });
  }

  // Stock levels (no cache, always fresh)
  async getStockLevels(productId: string) {
    return await this.realtimeApi.get(`/products/${productId}/stock`);
  }

  // Clear cache when user logs out
  clearUserCache() {
    // Note: In a real app, you'd want to clear specific cache entries
    // This is a simplified example
    console.log('User logged out, cache will expire naturally');
  }
}

// Usage
const productAPI = new ProductAPI();

// First load: fetches from server
const products = await productAPI.getProducts('electronics'); // ⏳ Network request

// Subsequent loads: instant from cache
const products2 = await productAPI.getProducts('electronics'); // 💾 Cache hit (instant)

// User cart: cached briefly for performance
const cart = await productAPI.getUserCart(); // ⏳ Network request
const cart2 = await productAPI.getUserCart(); // 💾 Cache hit (instant)

// Stock levels: always fresh
const stock = await productAPI.getStockLevels('123'); // ⏳ Always network request
```

### 12. **Advanced Caching with Cache Management**

```typescript
import { createClient } from 'hyperwiz';

// Create client with custom cache storage
const api = createClient('https://api.example.com', {
  cache: {
    enabled: true,
    maxAge: 5 * 60 * 1000,  // 5 minutes
    maxSize: 50,
    storage: 'indexeddb',    // Persistent storage
    includeQueryParams: true,
    cacheableMethods: ['GET', 'HEAD'],
    cacheableStatusCodes: [200]
  },
  logging: true
});

// Cache management functions
class CacheManager {
  static async clearCache() {
    // Clear all cached responses
    const cacheStorage = new IndexedDBCacheStorage();
    await cacheStorage.clear();
    console.log('Cache cleared');
  }

  static async getCacheStats() {
    const cacheStorage = new IndexedDBCacheStorage();
    const keys = await cacheStorage.keys();
    console.log(`Cache contains ${keys.length} items:`, keys);
    return keys;
  }

  static async removeExpiredCache() {
    const cacheStorage = new IndexedDBCacheStorage();
    const keys = await cacheStorage.keys();
    const now = Date.now();
    
    for (const key of keys) {
      const cached = await cacheStorage.get(key);
      if (cached && (now - cached.timestamp) > 5 * 60 * 1000) {
        await cacheStorage.delete(key);
        console.log(`Removed expired cache: ${key}`);
      }
    }
  }
}

// Usage
const users = await api.get('/users'); // First request: network
const users2 = await api.get('/users'); // Second request: cache

// Manage cache
await CacheManager.getCacheStats(); // See what's cached
await CacheManager.removeExpiredCache(); // Clean up expired entries
await CacheManager.clearCache(); // Clear all cache
```

## 🎯 Real-World Examples

### React Hook with Token Management

```typescript
import { useState } from 'react';
import { createClient } from 'hyperwiz';

function useApi() {
  const [api] = useState(() => createClient('https://api.example.com'));

  const login = async (credentials: any) => {
    const response = await api.post('/auth/login', credentials);
    if (response.success) {
      localStorage.setItem('auth-token', response.data.token);
    }
    return response;
  };

  const logout = () => {
    localStorage.removeItem('auth-token');
  };

  const makeAuthenticatedRequest = async (url: string, token: string) => {
    return await api.get(url, {
      'Authorization': `Bearer ${token}`
    });
  };

  return { api, login, logout, makeAuthenticatedRequest };
}
```

### API Service Class

```typescript
class UserAPI {
  private api = createClient('https://api.example.com', { logging: true });

  constructor() {
    // Add authentication interceptor
    this.api.addBefore((config, url) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers = { ...config.headers, 'Authorization': `Bearer ${token}` };
      }
      return config;
    });
  }

  async getUsers() {
    const response = await this.api.get('/users');
    return response.success ? response.data : [];
  }

  async createUser(userData: any) {
    const response = await this.api.post('/users', userData);
    return response.success ? response.data : null;
  }

  async updateUser(id: string, userData: any) {
    const response = await this.api.put(`/users/${id}`, userData);
    return response.success ? response.data : null;
  }
}
```

### E-commerce with Retry Strategies

```