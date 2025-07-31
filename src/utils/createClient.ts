import { HttpClient } from "../core/HttpClient";
import { Interceptors, RetryConfig, RetryConfigOption, RequestConfig, CacheConfig, CacheConfigOption, CachedResponse } from "../types/index";
import { 
  createCacheStorage, 
  createCacheKeyGenerator, 
  isCacheableRequest, 
  isCacheableResponse, 
  isExpired, 
  isValidCachedResponse,
  CacheResult 
} from "./cache";

export interface ClientConfig {
  interceptors?: Interceptors;
  logging?: boolean;
  timeout?: number;
  credentials?: RequestCredentials;
  retry?: RetryConfigOption;
  cache?: CacheConfigOption;
}

// Circuit breaker state
interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

// Global circuit breaker instances
const circuitBreakers = new Map<string, CircuitBreakerState>();

// Request deduplication
const pendingRequests = new Map<string, Promise<unknown>>();

// Global cache storage instances to share across client instances
const globalCacheStorages = new Map<string, any>();

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
  maxAge: 5 * 60 * 1000,
  maxSize: 100,
  storage: 'memory',
  includeQueryParams: true,
  cacheableMethods: ['GET'],
  cacheableStatusCodes: [200]
};

// Default configuration
const DEFAULT_CONFIG: Partial<ClientConfig> = {
  logging: false,
  timeout: 30000,
  credentials: 'same-origin'
};

// Circuit breaker functions
function getCircuitBreakerKey(url: string): string {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.hostname}`;
  } catch {
    return url.split('/')[0] || url;
  }
}

function shouldAllowRequest(circuitBreakerKey: string): boolean {
  const breaker = circuitBreakers.get(circuitBreakerKey);
  if (!breaker) return true;
  const now = Date.now();
  const timeout = 30000;
  switch (breaker.state) {
    case 'CLOSED': return true;
    case 'OPEN':
      if (now - breaker.lastFailureTime > timeout) {
        breaker.state = 'HALF_OPEN';
        return true;
      }
      return false;
    case 'HALF_OPEN': return true;
    default: return true;
  }
}

function recordSuccess(circuitBreakerKey: string): void {
  const breaker = circuitBreakers.get(circuitBreakerKey);
  if (breaker) {
    breaker.failures = 0;
    breaker.state = 'CLOSED';
  }
}

function recordFailure(circuitBreakerKey: string): void {
  let breaker = circuitBreakers.get(circuitBreakerKey);
  if (!breaker) {
    breaker = { failures: 0, lastFailureTime: 0, state: 'CLOSED' };
    circuitBreakers.set(circuitBreakerKey, breaker);
  }
  breaker.failures++;
  breaker.lastFailureTime = Date.now();
  if (breaker.failures >= 10) {
    breaker.state = 'OPEN';
  }
}

// Retry functions
function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.name === 'TypeError' || 
           error.message.includes('fetch') ||
           error.message.includes('network') ||
           error.message.includes('Failed to fetch');
  }
  return false;
}

function isHttpError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'status' in error;
}

function getHttpStatus(error: unknown): number {
  if (isHttpError(error)) {
    const httpError = error as { status?: number };
    return httpError.status || 0;
  }
  return 0;
}

function shouldRetry(error: unknown, retryConfig: RetryConfig): boolean {
  if (retryConfig.retryOnNetworkError && isNetworkError(error)) {
    return true;
  }
  if (isHttpError(error) && retryConfig.retryOnStatus) {
    const status = getHttpStatus(error);
    return retryConfig.retryOnStatus.includes(status);
  }
  return false;
}

function calculateDelay(attempt: number, retryConfig: RetryConfig): number {
  const baseDelay = retryConfig.retryDelay!;
  const multiplier = retryConfig.backoffMultiplier!;
  const maxDelay = retryConfig.maxDelay!;
  const delay = baseDelay * Math.pow(multiplier, attempt);
  const jitter = Math.random() * 0.1 * delay;
  return Math.min(delay + jitter, maxDelay);
}

function getRetryAttempt(url: string): number {
  const match = url.match(/__retry_attempt=(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

function addRetryAttempt(url: string, attempt: number): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}__retry_attempt=${attempt}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Retry handler
async function handleRetry(
  error: unknown, 
  url: string, 
  retryConfig: RetryConfig, 
  client: HttpClient,
  originalConfig?: RequestConfig
): Promise<unknown> {
  if (!shouldRetry(error, retryConfig)) {
    const circuitBreakerKey = getCircuitBreakerKey(url);
    recordFailure(circuitBreakerKey);
    return error;
  }

  const retryAttempt = getRetryAttempt(url);
  if (retryAttempt >= retryConfig.maxRetries!) {
    const circuitBreakerKey = getCircuitBreakerKey(url);
    recordFailure(circuitBreakerKey);
    return error;
  }

  const delay = calculateDelay(retryAttempt, retryConfig);
  await sleep(delay);
  
  try {
    const retryUrl = addRetryAttempt(url, retryAttempt + 1);
    let result: unknown;
    
    if (originalConfig) {
      switch (originalConfig.method) {
        case 'GET':
          result = await client.get(retryUrl, originalConfig.headers);
          break;
        case 'POST':
          result = await client.post(retryUrl, originalConfig.body, originalConfig.headers);
          break;
        case 'PUT':
          result = await client.put(retryUrl, originalConfig.body, originalConfig.headers);
          break;
        case 'PATCH':
          result = await client.patch(retryUrl, originalConfig.body, originalConfig.headers);
          break;
        case 'DELETE':
          result = await client.delete(retryUrl, originalConfig.headers);
          break;
        default:
          result = await client.get(retryUrl);
      }
    } else {
      result = await client.get(retryUrl);
    }

    const circuitBreakerKey = getCircuitBreakerKey(url);
    if (result && typeof result === 'object' && 'success' in result && result.success) {
      recordSuccess(circuitBreakerKey);
    } else {
      recordFailure(circuitBreakerKey);
    }

    return result;
  } catch (retryError) {
    const circuitBreakerKey = getCircuitBreakerKey(url);
    recordFailure(circuitBreakerKey);
    return handleRetry(retryError, url, retryConfig, client, originalConfig);
  }
}

export const createClient = (baseUrl: string, config?: ClientConfig) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const client = new HttpClient(baseUrl, finalConfig.interceptors, finalConfig.credentials);
  
  if (finalConfig.logging) {
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
    client.setTimeout(finalConfig.timeout);
  }

  if (finalConfig.retry) {
    const retryConfig = typeof finalConfig.retry === 'boolean' 
      ? (finalConfig.retry ? DEFAULT_RETRY_CONFIG : null)
      : { ...DEFAULT_RETRY_CONFIG, ...finalConfig.retry };
    
    if (retryConfig) {
      client.addErrorHandler((error, url, requestConfig) => {
        const circuitBreakerKey = getCircuitBreakerKey(url);
        if (!shouldAllowRequest(circuitBreakerKey)) {
          return error;
        }
        return handleRetry(error, url, retryConfig, client, requestConfig);
      });
    }
  }

  if (finalConfig.cache !== undefined) {
    const cacheConfig = typeof finalConfig.cache === 'boolean'
      ? (finalConfig.cache ? DEFAULT_CACHE_CONFIG : null)
      : { ...DEFAULT_CACHE_CONFIG, ...finalConfig.cache };
    
    if (cacheConfig && cacheConfig.enabled !== false) {
      // Create a unique cache key based on storage type and maxSize
      const cacheStorageKey = `${cacheConfig.storage || 'memory'}-${cacheConfig.maxSize || 100}`;
      
      // Use global cache storage or create new one
      let cacheStorage = globalCacheStorages.get(cacheStorageKey);
      if (!cacheStorage) {
        cacheStorage = createCacheStorage(cacheConfig.storage || 'memory', cacheConfig.maxSize || 100);
        globalCacheStorages.set(cacheStorageKey, cacheStorage);
      }
      
      const cacheKeyGenerator = createCacheKeyGenerator(cacheConfig.includeQueryParams || true);
      const clientId = Math.random().toString(36).substring(7);
      
      const originalGet = client.get.bind(client);
      const originalPost = client.post.bind(client);
      const originalPut = client.put.bind(client);
      const originalPatch = client.patch.bind(client);
      const originalDelete = client.delete.bind(client);

      client.get = async <T>(url: string, headers?: HeadersInit) => {
        const startTime = Date.now();
        
        // Check cache first for GET requests
        const cacheKey = `${clientId}:${cacheKeyGenerator.generate('GET', url)}`;
        const cached = await cacheStorage.get(cacheKey);
        

        
        if (cached && !isExpired(cached, cacheConfig.maxAge || 5 * 60 * 1000)) {
          const responseTime = Date.now() - startTime;
          if (finalConfig.logging) {
            console.log(`💾 Cache HIT for ${url} (${responseTime}ms)`);
            // Log cache statistics if available
            if ('getStats' in cacheStorage) {
              const stats = (cacheStorage as any).getStats();
              console.log(`📊 Cache stats: ${stats.hitRate}% hit rate, ${stats.size}/${stats.maxSize} items`);
            }
          }
          return { success: true, data: cached.data as T };
        }
        
        // Check for pending requests to avoid duplicates
        const requestKey = `GET:${url}:${JSON.stringify(headers || {})}`;
        const pendingRequest = pendingRequests.get(requestKey);
        
        if (pendingRequest) {
          return pendingRequest as Promise<{ success: true; data: T } | { success: false; status?: number; error: string }>;
        }
        
        // No cache hit or pending request, make the request
        const requestPromise = originalGet<T>(url, headers).then(async (result) => {
          const responseTime = Date.now() - startTime;
          
          if (finalConfig.logging) {
            console.log(`📡 Cache MISS for ${url} (${responseTime}ms)`);
          }
          
          // Cache successful responses
          if (result.success && isCacheableResponse(200, cacheConfig.cacheableStatusCodes || [200])) {
            const cachedResponse: CachedResponse = {
              data: result.data,
              status: 200,
              statusText: 'OK',
              headers: {},
              timestamp: Date.now(),
              url: url.startsWith('http') ? url : `${baseUrl}${url}`,
              method: 'GET'
            };
            
            await cacheStorage.set(cacheKey, cachedResponse);
            if (finalConfig.logging) {
              console.log(`💾 Cached response for ${url} (${responseTime}ms)`);
            }
          }
          
          return result;
        }).finally(() => {
          // Clean up pending request
          pendingRequests.delete(requestKey);
        });
        
        // Store the pending request
        pendingRequests.set(requestKey, requestPromise);
        
        return requestPromise;
      };

      client.post = async <T>(url: string, body: unknown, headers?: HeadersInit) => {
        const startTime = Date.now();
        const result = await originalPost<T>(url, body, headers);
        const responseTime = Date.now() - startTime;
        
        if (result.success && isCacheableResponse(200, cacheConfig.cacheableStatusCodes || [200])) {
          const cacheKey = `${clientId}:${cacheKeyGenerator.generate('POST', url, body)}`;
          const cachedResponse: CachedResponse = {
            data: result.data,
            status: 200,
            statusText: 'OK',
            headers: {},
            timestamp: Date.now(),
            url: url.startsWith('http') ? url : `${baseUrl}${url}`,
            method: 'POST'
          };
          await cacheStorage.set(cacheKey, cachedResponse);
          if (finalConfig.logging) {
            console.log(`💾 Cached response for ${url} (${responseTime}ms)`);
          }
        }
        return result;
      };

      client.put = async <T>(url: string, body: unknown, headers?: HeadersInit) => {
        const startTime = Date.now();
        const result = await originalPut<T>(url, body, headers);
        const responseTime = Date.now() - startTime;
        
        if (result.success && isCacheableResponse(200, cacheConfig.cacheableStatusCodes || [200])) {
          const cacheKey = `${clientId}:${cacheKeyGenerator.generate('PUT', url, body)}`;
          const cachedResponse: CachedResponse = {
            data: result.data,
            status: 200,
            statusText: 'OK',
            headers: {},
            timestamp: Date.now(),
            url: url.startsWith('http') ? url : `${baseUrl}${url}`,
            method: 'PUT'
          };
          await cacheStorage.set(cacheKey, cachedResponse);
          if (finalConfig.logging) {
            console.log(`💾 Cached response for ${url} (${responseTime}ms)`);
          }
        }
        return result;
      };

      client.patch = async <T>(url: string, body: unknown, headers?: HeadersInit) => {
        const startTime = Date.now();
        const result = await originalPatch<T>(url, body, headers);
        const responseTime = Date.now() - startTime;
        
        if (result.success && isCacheableResponse(200, cacheConfig.cacheableStatusCodes || [200])) {
          const cacheKey = `${clientId}:${cacheKeyGenerator.generate('PATCH', url, body)}`;
          const cachedResponse: CachedResponse = {
            data: result.data,
            status: 200,
            statusText: 'OK',
            headers: {},
            timestamp: Date.now(),
            url: url.startsWith('http') ? url : `${baseUrl}${url}`,
            method: 'PATCH'
          };
          await cacheStorage.set(cacheKey, cachedResponse);
          if (finalConfig.logging) {
            console.log(`💾 Cached response for ${url} (${responseTime}ms)`);
          }
        }
        return result;
      };

      client.delete = async <T>(url: string, headers?: HeadersInit) => {
        const startTime = Date.now();
        const result = await originalDelete<T>(url, headers);
        const responseTime = Date.now() - startTime;
        
        if (result.success && isCacheableResponse(200, cacheConfig.cacheableStatusCodes || [200])) {
          const cacheKey = `${clientId}:${cacheKeyGenerator.generate('DELETE', url)}`;
          const cachedResponse: CachedResponse = {
            data: result.data,
            status: 200,
            statusText: 'OK',
            headers: {},
            timestamp: Date.now(),
            url: url.startsWith('http') ? url : `${baseUrl}${url}`,
            method: 'DELETE'
          };
          await cacheStorage.set(cacheKey, cachedResponse);
          if (finalConfig.logging) {
            console.log(`💾 Cached response for ${url} (${responseTime}ms)`);
          }
        }
        return result;
      };
    }
  }
  
  return client;
};

export const createPublicClient = (baseUrl: string) => createClient(baseUrl, { logging: true }); 