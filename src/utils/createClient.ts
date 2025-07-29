import { HttpClient } from "../core/HttpClient";
import { Interceptors, RetryConfig, RetryConfigOption, RequestConfig, CacheConfig, CacheConfigOption, CachedResponse } from "../types/index";
import { 
  createCacheStorage, 
  createCacheKeyGenerator, 
  isCacheableRequest, 
  isCacheableResponse, 
  isExpired, 
  CacheHitError 
} from "./cache";

export interface ClientConfig {
  interceptors?: Interceptors;
  logging?: boolean; // Enable request/response logging
  timeout?: number; // Request timeout in milliseconds
  credentials?: RequestCredentials; // Credentials mode for cross-origin requests
  retry?: RetryConfigOption; // Auto retry configuration
  cache?: CacheConfigOption; // Request caching configuration
}

// Default retry configuration
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryOnStatus: [408, 429, 500, 502, 503, 504],
  retryOnNetworkError: true
};

// Default cache configuration
const DEFAULT_CACHE_CONFIG: CacheConfig = {
  enabled: true,
  maxAge: 5 * 60 * 1000, // 5 minutes
  maxSize: 100, // Maximum 100 cached items
  storage: 'memory',
  includeQueryParams: true,
  cacheableMethods: ['GET'],
  cacheableStatusCodes: [200]
};

// Default configuration
const DEFAULT_CONFIG: Partial<ClientConfig> = {
  logging: false,
  timeout: 30000, // 30 seconds
  credentials: 'same-origin'
};

export const createClient = (baseUrl: string, config?: ClientConfig) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const client = new HttpClient(baseUrl, finalConfig.interceptors, finalConfig.credentials);
  
  // Add built-in interceptors based on config
  if (finalConfig.logging) {
    // Auto-add logging interceptors
    client.addBefore((config, url) => {
      console.log(`🚀 ${config.method} ${url}`, config);
      return config;
    });

    client.addAfter((response, data, url) => {
      console.log(`✅ ${response.status} ${url}`, data);
      return data;
    });

    client.addErrorHandler((error, url, requestConfig) => {
      console.error(`❌ Error for ${url}:`, error);
      return error;
    });
  }

  if (finalConfig.timeout) {
    // Add timeout handling with proper cleanup
    client.setTimeout(finalConfig.timeout);
  }

  if (finalConfig.retry) {
    // Handle retry configuration
    const retryConfig = typeof finalConfig.retry === 'boolean' 
      ? (finalConfig.retry ? DEFAULT_RETRY_CONFIG : null)
      : { ...DEFAULT_RETRY_CONFIG, ...finalConfig.retry };
    
    if (retryConfig) {
      // Add retry logic with adaptive backoff
      client.addErrorHandler((error, url, requestConfig) => {
        return handleRetry(error, url, retryConfig, client, requestConfig);
      });
    }
  }

  if (finalConfig.cache !== undefined) {
    // Handle cache configuration
    const cacheConfig = typeof finalConfig.cache === 'boolean'
      ? (finalConfig.cache ? DEFAULT_CACHE_CONFIG : null)
      : { ...DEFAULT_CACHE_CONFIG, ...finalConfig.cache };
    
    if (cacheConfig && cacheConfig.enabled !== false) {
      // Add caching logic - create unique cache instance for this client
      const cacheStorage = createCacheStorage(cacheConfig.storage || 'memory', cacheConfig.maxSize || 100);
      const cacheKeyGenerator = createCacheKeyGenerator(cacheConfig.includeQueryParams || true);
      
      // Store request config for caching in after handler
      let currentRequestConfig: RequestConfig | null = null;
      
      // Create a unique client ID to isolate cache instances
      const clientId = Math.random().toString(36).substring(7);
      
      client.addBefore(async (config, url) => {
        // Store the current request config for use in after handler
        currentRequestConfig = config;
        
        // Check if request is cacheable
        if (!isCacheableRequest(config.method, cacheConfig.cacheableMethods || ['GET'])) {
          return config;
        }

        // Try to get cached response
        const cacheKey = `${clientId}:${cacheKeyGenerator.generate(config.method, url, config.body)}`;
        const cached = await cacheStorage.get(cacheKey);
        
        if (cached && !isExpired(cached, cacheConfig.maxAge || 5 * 60 * 1000)) {
          console.log(`💾 Cache hit for ${url}`);
          // Throw a special error to be caught by error handler
          throw new CacheHitError(cached);
        }
        
        return config;
      });

      client.addAfter(async (response, data, url) => {
        // Cache successful responses
        if (currentRequestConfig && isCacheableResponse(response.status, cacheConfig.cacheableStatusCodes || [200])) {
          const cacheKey = `${clientId}:${cacheKeyGenerator.generate(currentRequestConfig.method, url, currentRequestConfig.body)}`;
          const cachedResponse: CachedResponse = {
            data,
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            timestamp: Date.now(),
            url,
            method: currentRequestConfig.method
          };
          
          await cacheStorage.set(cacheKey, cachedResponse);
          console.log(`💾 Cached response for ${url}`);
        }
        
        // Clear the stored request config
        currentRequestConfig = null;
        
        return data;
      });

      client.addErrorHandler(async (error, url, requestConfig) => {
        // Handle cache hits
        if (error instanceof CacheHitError) {
          console.log(`💾 Returning cached response for ${url}`);
          return error.cachedResponse.data;
        }
        
        // Re-throw other errors to maintain error handling chain
        throw error;
      });
    }
  }
  
  return client;
};

// Retry handler with adaptive backoff
async function handleRetry(
  error: unknown, 
  url: string, 
  retryConfig: RetryConfig, 
  client: HttpClient,
  originalConfig?: RequestConfig
): Promise<unknown> {
  // Check if we should retry
  if (!shouldRetry(error, retryConfig)) {
    return error;
  }

  // Get retry attempt from URL or create new one
  const retryAttempt = getRetryAttempt(url);
  if (retryAttempt >= retryConfig.maxRetries!) {
    console.warn(`Max retries (${retryConfig.maxRetries}) reached for ${url}`);
    return error;
  }

  // Calculate delay with exponential backoff
  const delay = calculateDelay(retryAttempt, retryConfig);
  
  console.log(`🔄 Retrying ${url} in ${delay}ms (attempt ${retryAttempt + 1}/${retryConfig.maxRetries})`);
  
  // Wait for delay
  await sleep(delay);
  
  // Retry the request using the original configuration
  try {
    const retryUrl = addRetryAttempt(url, retryAttempt + 1);
    
    // Use the original request method if available, otherwise use GET
    if (originalConfig) {
      // Use the appropriate HTTP method based on original config
      switch (originalConfig.method) {
        case 'GET':
          return await client.get(retryUrl, originalConfig.headers);
        case 'POST':
          return await client.post(retryUrl, originalConfig.body, originalConfig.headers);
        case 'PUT':
          return await client.put(retryUrl, originalConfig.body, originalConfig.headers);
        case 'PATCH':
          return await client.patch(retryUrl, originalConfig.body, originalConfig.headers);
        case 'DELETE':
          return await client.delete(retryUrl, originalConfig.headers);
        default:
          return await client.get(retryUrl);
      }
    } else {
      // Fallback to GET if no original config
      return await client.get(retryUrl);
    }
  } catch (retryError) {
    // Continue retrying with the same configuration
    return handleRetry(retryError, url, retryConfig, client, originalConfig);
  }
}

// Check if error should be retried
function shouldRetry(error: unknown, retryConfig: RetryConfig): boolean {
  // Check network errors
  if (retryConfig.retryOnNetworkError && isNetworkError(error)) {
    return true;
  }
  
  // Check HTTP status codes
  if (isHttpError(error) && retryConfig.retryOnStatus) {
    const status = getHttpStatus(error);
    return retryConfig.retryOnStatus.includes(status);
  }
  
  return false;
}

// Check if it's a network error
function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.name === 'TypeError' || 
           error.message.includes('fetch') ||
           error.message.includes('network') ||
           error.message.includes('Failed to fetch');
  }
  return false;
}

// Check if it's an HTTP error
function isHttpError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'status' in error;
}

// Get HTTP status from error
function getHttpStatus(error: unknown): number {
  if (isHttpError(error)) {
    return (error as any).status || 0;
  }
  return 0;
}

// Calculate delay with exponential backoff
function calculateDelay(attempt: number, retryConfig: RetryConfig): number {
  const baseDelay = retryConfig.retryDelay!;
  const multiplier = retryConfig.backoffMultiplier!;
  const maxDelay = retryConfig.maxDelay!;
  
  // Exponential backoff: delay = baseDelay * (multiplier ^ attempt)
  const delay = baseDelay * Math.pow(multiplier, attempt);
  
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.1 * delay;
  
  // Cap at max delay
  return Math.min(delay + jitter, maxDelay);
}

// Get retry attempt from URL
function getRetryAttempt(url: string): number {
  const match = url.match(/__retry_attempt=(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

// Add retry attempt to URL
function addRetryAttempt(url: string, attempt: number): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}__retry_attempt=${attempt}`;
}

// Sleep utility
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Simple convenience function for public clients
export const createPublicClient = (baseUrl: string) => {
  return createClient(baseUrl, { logging: true });
};
