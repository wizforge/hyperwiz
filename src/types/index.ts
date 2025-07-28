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

