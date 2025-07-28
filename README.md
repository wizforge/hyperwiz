# hyperwiz

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

### Cross-Origin Requests

```typescript
// For cross-origin requests with cookies
const api = createClient('https://api.example.com', {
  credentials: 'include', // Important for cookies
  logging: true
});

// Cookies are automatically sent, developer adds any other headers
const profile = await api.get('/user/profile', {
  'X-API-Key': 'your-api-key'
});
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

// Public client (with logging)
createPublicClient(baseUrl: string): HttpClient
```

### HTTP Methods

```typescript
// All methods return Promise<ApiResponse<T>>
api.get<T>(url: string, headers?: HeadersInit)
api.post<T>(url: string, body: unknown, headers?: HeadersInit)
api.put<T>(url: string, body: unknown, headers?: HeadersInit)
api.patch<T>(url: string, body: unknown, headers?: HeadersInit)
api.delete<T>(url: string, headers?: HeadersInit)
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

### 9. **Server-Side Usage (Node.js)**

```typescript
import { createClient } from 'hyperwiz';

const api = createClient('https://api.example.com', {
  retry: true,
  timeout: 30000
});

// Server-side API calls with environment variables
const response = await api.get('/data', {
  'Authorization': `Bearer ${process.env.API_TOKEN}`,
  'X-Server-ID': process.env.SERVER_ID,
  'User-Agent': 'MyApp/1.0'
});
```

### 10. **Custom Error Handling with Retry**

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

```typescript
class EcommerceAPI {
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
}
```

### Server-Side Usage (Node.js)

```typescript
import { createClient } from 'hyperwiz';

const api = createClient('https://api.example.com');

// Server-side token
const response = await api.get('/data', {
  'Authorization': `Bearer ${process.env.API_TOKEN}`,
  'X-Server-ID': process.env.SERVER_ID
});
```

## 🔒 TypeScript Support

```typescript
// Full type safety
interface User {
  id: number;
  name: string;
  email: string;
}

const api = createClient('https://api.example.com');

// TypeScript knows the response type
const users = await api.get<User[]>('/users');
if (users.success) {
  users.data.forEach(user => {
    console.log(user.name); // TypeScript autocomplete works
  });
}
```

## 🛡️ Error Handling

```typescript
const api = createClient('https://api.example.com');

// All responses are wrapped in ApiResponse<T>
const response = await api.get('/users');

if (response.success) {
  // Handle success
  console.log('Users:', response.data);
} else {
  // Handle error
  console.error('Error:', response.error);
  console.error('Status:', response.status);
}
```

## 🔄 Response Format

All requests return a consistent response format:

```typescript
type ApiResponse<T> = 
  | { success: true; data: T }
  | { success: false; status?: number; error: string };
```

## 📦 Installation

```bash
npm install hyperwiz
```

## 🌟 Why Choose hyperwiz?

- **🚀 Simple** - One-line setup, no complex configuration needed
- **🔧 Flexible** - Manual control over authentication or automatic via interceptors
- **🔄 Auto Retry** - Built-in adaptive backoff with exponential delay and jitter
- **🍪 Cookie Ready** - Built-in support for session-based authentication
- **🔐 Token Ready** - Easy Bearer token handling (manual or automatic)
- **⚡ Lightweight** - Small bundle size, no unnecessary dependencies
- **🛡️ Type Safe** - Full TypeScript support with proper type inference
- **🌐 Modern** - Built for modern web applications with fetch API
- **📝 Developer Friendly** - Clear API, comprehensive logging, and error handling
- **🎯 Production Ready** - Timeout handling, request cancellation, and robust error recovery

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.