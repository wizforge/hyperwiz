export interface RequestConfig {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers?: HeadersInit;
    body?: unknown; // Changed from 'any' to 'unknown' for better type safety
    signal?: AbortSignal;
}

// Retry configuration interface
export interface RetryConfig {
  maxRetries?: number;           // Maximum number of retry attempts (default: 3)
  retryDelay?: number;           // Initial delay in milliseconds (default: 1000)
  maxDelay?: number;             // Maximum delay in milliseconds (default: 10000)
  backoffMultiplier?: number;    // Exponential backoff multiplier (default: 2)
  retryOnStatus?: number[];      // HTTP status codes to retry on (default: [408, 429, 500, 502, 503, 504])
  retryOnNetworkError?: boolean; // Retry on network errors (default: true)
}

// Retry configuration can be boolean or object
export type RetryConfigOption = boolean | RetryConfig;

// Cache Configuration
export interface CacheConfig {
  enabled?: boolean;
  maxAge?: number; // Cache duration in milliseconds
  maxSize?: number; // Maximum number of cached items
  storage?: 'memory' | 'indexeddb';
  includeQueryParams?: boolean; // Whether to include query params in cache key
  cacheableMethods?: string[]; // HTTP methods that can be cached (default: ['GET'])
  cacheableStatusCodes?: number[]; // Status codes that can be cached (default: [200])
}

export type CacheConfigOption = boolean | CacheConfig;

// Cache Storage Interface
export interface CacheStorage {
  get(key: string): Promise<CachedResponse | null>;
  set(key: string, value: CachedResponse): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
}

// Cached Response Structure
export interface CachedResponse {
  data: unknown;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  timestamp: number;
  url: string;
  method: string;
}

// Cache Key Generator
export interface CacheKeyGenerator {
  generate(method: string, url: string, body?: unknown): string;
}

// Improved interceptor types with better type safety
export type RequestHandler = (config: RequestConfig, url: string) => RequestConfig | Promise<RequestConfig>;
export type ResponseHandler<T = unknown> = (response: Response, data: T, url: string) => T | Promise<T>;
export type ErrorHandler = (error: unknown, url: string, requestConfig?: RequestConfig) => unknown | Promise<unknown>;

// Simplified interceptor configuration
export interface Interceptors {
  before?: RequestHandler[];    // Before request is sent
  after?: ResponseHandler[];    // After successful response
  onError?: ErrorHandler[];     // When error occurs
}



// Legacy types for backward compatibility
export type RequestInterceptor = RequestHandler;
export type ResponseInterceptor<T = unknown> = ResponseHandler<T>;
export type ErrorInterceptor = ErrorHandler;

