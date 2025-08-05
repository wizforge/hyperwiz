import { RequestConfig, Interceptors, RequestHandler, ResponseHandler, ErrorHandler } from '../types/index';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS' | 'PURGE';

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; status?: number; error: string };

// Improved URL normalization with proper validation
function normalizeUrl(base: string, path: string): string {
  try {
    // Handle absolute URLs
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    // Normalize base URL
    const cleanBase = base.replace(/\/+$/, '');
    const cleanPath = path.replace(/^\/+/, '');

    // Validate URL format
    const fullUrl = `${cleanBase}/${cleanPath}`;
    new URL(fullUrl); // This will throw if URL is invalid
    
    return fullUrl;
  } catch (error) {
    throw new Error(`Invalid URL: ${base}/${path}`);
  }
}



// Automatic Content-Type detection (only for JSON, text, HTML, XML)
function detectContentType(body: unknown): { contentType: string; processedBody: unknown } {
  // Handle null/undefined
  if (body === null || body === undefined) {
    return { contentType: 'application/json', processedBody: null };
  }

  // Handle strings - Only detect JSON, HTML, XML, and text
  if (typeof body === 'string') {
    // Check if it's JSON
    try {
      JSON.parse(body);
      return { contentType: 'application/json', processedBody: body };
    } catch {
      // Check if it's HTML
      if (body.trim().startsWith('<') && body.includes('</')) {
        return { contentType: 'text/html', processedBody: body };
      }
      // Check if it's XML
      if (body.trim().startsWith('<?xml') || body.trim().startsWith('<')) {
        return { contentType: 'application/xml', processedBody: body };
      }
      // Default to plain text
      return { contentType: 'text/plain', processedBody: body };
    }
  }

  // Handle FormData
  if (body instanceof FormData) {
    return { contentType: 'multipart/form-data', processedBody: body };
  }

  // Handle URLSearchParams
  if (body instanceof URLSearchParams) {
    return { contentType: 'application/x-www-form-urlencoded', processedBody: body };
  }

  // Handle File - Use file's type or default to application/octet-stream
  if (body instanceof File) {
    const contentType = body.type || 'application/octet-stream';
    return { contentType, processedBody: body };
  }

  // Handle Blob - Use blob's type or default to application/octet-stream
  if (body instanceof Blob) {
    const contentType = body.type || 'application/octet-stream';
    return { contentType, processedBody: body };
  }

  // Handle ArrayBuffer - Default to application/octet-stream
  if (body instanceof ArrayBuffer) {
    return { contentType: 'application/octet-stream', processedBody: body };
  }

  // Handle TypedArrays - Default to application/octet-stream
  if (body instanceof Uint8Array || body instanceof Uint16Array || 
      body instanceof Uint32Array || body instanceof Int8Array || 
      body instanceof Int16Array || body instanceof Int32Array || 
      body instanceof Float32Array || body instanceof Float64Array) {
    return { contentType: 'application/octet-stream', processedBody: body };
  }

  // Handle Date objects
  if (body instanceof Date) {
    return { contentType: 'application/json', processedBody: body.toISOString() };
  }

  // Handle objects and arrays (JSON)
  if (typeof body === 'object') {
    return { contentType: 'application/json', processedBody: JSON.stringify(body) };
  }

  // Handle numbers, booleans, etc. (JSON)
  return { contentType: 'application/json', processedBody: JSON.stringify(body) };
}

// Check if Content-Type header should be automatically set
function shouldSetContentType(method: string, body: unknown): boolean {
  return body !== null && body !== undefined && ['POST', 'PUT', 'PATCH'].includes(method);
}

// Improved content-type parsing
function isJsonResponse(contentType: string | null): boolean {
  if (!contentType) return false;
  
  // More precise JSON detection
  const normalizedType = contentType.toLowerCase().trim();
  return normalizedType === 'application/json' || 
         normalizedType.startsWith('application/json;');
}

// Improved response parsing with error handling
async function parseResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("Content-Type");
  
  try {
    if (isJsonResponse(contentType)) {
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    } else {
      return await response.text();
    }
  } catch (error) {
    console.warn('Failed to parse response:', error);
    return null;
  }
}

export class HttpClient {
  private baseUrl: string;
  private interceptors: Interceptors;
  private timeoutControllers = new Map<string, AbortController>();
  private credentials: RequestCredentials = 'same-origin';
  private timeoutHandler?: RequestHandler; // Store timeout interceptor reference
  public enableLogging?: boolean; // Add logging flag

  constructor(baseUrl: string, interceptors?: Interceptors, credentials?: RequestCredentials) {
    // Check if AbortController is available
    if (typeof AbortController === 'undefined') {
      throw new Error('AbortController is not available. Please use a polyfill for older browsers.');
    }
    
    this.baseUrl = baseUrl;
    this.interceptors = interceptors || {};
    this.credentials = credentials || 'same-origin';
  }

  // Set credentials for cross-origin requests
  setCredentials(credentials: RequestCredentials): void {
    this.credentials = credentials;
  }

  // Improved interceptor execution with error handling
  private async runBeforeHandlers(config: RequestConfig, url: string): Promise<RequestConfig> {
    let modifiedConfig = { ...config };
    
    if (this.interceptors.before) {
      for (const handler of this.interceptors.before) {
        try {
          modifiedConfig = await handler(modifiedConfig, url);
        } catch (error) {
          console.error('Request interceptor error:', error);
          // Continue with original config if interceptor fails
        }
      }
    }
    
    return modifiedConfig;
  }

  private async runAfterHandlers<T>(response: Response, data: T, url: string): Promise<T> {
    let modifiedData = data;
    
    if (this.interceptors.after) {
      for (const handler of this.interceptors.after) {
        try {
          modifiedData = await handler(response, modifiedData, url) as T;
        } catch (error) {
          console.error('Response interceptor error:', error);
          // Continue with original data if interceptor fails
        }
      }
    }
    
    return modifiedData;
  }

  private async runErrorHandlers(error: unknown, url: string, requestConfig?: RequestConfig): Promise<unknown> {
    let modifiedError = error;
    
    if (this.interceptors.onError) {
      for (const handler of this.interceptors.onError) {
        try {
          modifiedError = await handler(modifiedError, url, requestConfig);
        } catch (handlerError) {
          console.error('Error interceptor error:', handlerError);
          // Continue with original error if interceptor fails
        }
      }
    }
    
    return modifiedError;
  }

  // Main request method with improved error handling and credentials support
  private async request<T>(url: string, config: RequestConfig): Promise<ApiResponse<T>> {
    const fullUrl = normalizeUrl(this.baseUrl, url);
    const requestId = `${config.method}-${fullUrl}-${Date.now()}`;
    
    try {
      // Run before handlers (request interceptors)
      const finalConfig = await this.runBeforeHandlers(config, fullUrl);
      
      // Automatic Content-Type detection and body processing
      let processedBody: BodyInit | null | undefined = finalConfig.body as BodyInit | null | undefined;
      let contentType: string | undefined;

      if (shouldSetContentType(finalConfig.method, finalConfig.body)) {
        const { contentType: detectedType, processedBody: processed } = detectContentType(finalConfig.body);
        contentType = detectedType;
        processedBody = processed as BodyInit | null | undefined;
      }

      // Log request details after all interceptors have run
      if (this.enableLogging) {
        const finalHeaders: Record<string, string> = {};
        
        // Copy existing headers
        if (finalConfig.headers) {
          if (typeof finalConfig.headers === 'object' && !Array.isArray(finalConfig.headers)) {
            Object.assign(finalHeaders, finalConfig.headers);
          }
        }
        
        // Add detected Content-Type for logging
        if (contentType && !finalHeaders['Content-Type']) {
          finalHeaders['Content-Type'] = contentType;
        }
        
        console.log(`🚀 ${finalConfig.method} ${fullUrl}`, {
          method: finalConfig.method,
          headers: finalHeaders,
          body: processedBody
        });
      }

      // Set default headers
      const headers: Record<string, string> = {};
      
      // Copy existing headers
      if (finalConfig.headers) {
        if (typeof finalConfig.headers === 'object' && !Array.isArray(finalConfig.headers)) {
          Object.assign(headers, finalConfig.headers);
        }
      }
      
      // Add detected Content-Type if not already set
      if (contentType && !headers['Content-Type']) {
        headers['Content-Type'] = contentType;
      }

      // Create abort controller for timeout
      const controller = new AbortController();
      this.timeoutControllers.set(requestId, controller);

      // Check if fetch is available
      if (typeof fetch === 'undefined') {
        throw new Error('Fetch API is not available. Please use a polyfill for older browsers.');
      }

      // Make the request with credentials support
      const response = await fetch(fullUrl, {
        method: finalConfig.method,
        headers,
        body: processedBody,
        signal: finalConfig.signal || controller.signal,
        credentials: this.credentials, // Include credentials for cookies
      });

      // Clean up timeout controller
      this.timeoutControllers.delete(requestId);

      // Parse response with error boundary
      let data: unknown;
      try {
        data = await parseResponse(response);
      } catch (parseError) {
        console.warn('Failed to parse response:', parseError);
        data = null;
      }

      // Handle errors
      if (!response.ok) {
        const error = typeof data === 'string' ? data : 'Request failed';
        const processedError = await this.runErrorHandlers(error, fullUrl, finalConfig);
        
        return {
          success: false,
          status: response.status,
          error: String(processedError),
        };
      }

      // Run after handlers (response interceptors) with error boundary
      let processedData: T;
      try {
        processedData = await this.runAfterHandlers(response, data as T, fullUrl);
      } catch (afterError) {
        console.warn('Response interceptor failed:', afterError);
        processedData = data as T;
      }

      return { success: true, data: processedData };
    } catch (err) {
      // Clean up timeout controller on error
      this.timeoutControllers.delete(requestId);
      
      // Enhanced error handling with proper error boundaries
      let errorMessage: string;
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = String((err as { message: unknown }).message);
      } else {
        errorMessage = 'Unknown network error';
      }
      
      const processedError = await this.runErrorHandlers(errorMessage, fullUrl, config);
      
      return {
        success: false,
        error: String(processedError),
      };
    }
  }



  // Simplified HTTP methods with better naming
  get<T>(url: string, headers?: HeadersInit) {
    return this.request<T>(url, { method: 'GET', headers });
  }

  post<T>(url: string, body: unknown, headers?: HeadersInit) {
    return this.request<T>(url, { method: 'POST', body, headers });
  }

  put<T>(url: string, body: unknown, headers?: HeadersInit) {
    return this.request<T>(url, { method: 'PUT', body, headers });
  }

  patch<T>(url: string, body: unknown, headers?: HeadersInit) {
    return this.request<T>(url, { method: 'PATCH', body, headers });
  }

  delete<T>(url: string, headers?: HeadersInit) {
    return this.request<T>(url, { method: 'DELETE', headers });
  }

  // Additional HTTP methods for enhanced functionality
  head<T>(url: string, headers?: HeadersInit) {
    return this.request<T>(url, { method: 'HEAD', headers });
  }

  options<T>(url: string, headers?: HeadersInit) {
    return this.request<T>(url, { method: 'OPTIONS', headers });
  }

  purge<T>(url: string, headers?: HeadersInit) {
    return this.request<T>(url, { method: 'PURGE', headers });
  }

  // Convenience methods for common use cases
  async fetch<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const config: RequestConfig = {
      method: (options?.method as HttpMethod) || 'GET',
      headers: options?.headers,
      body: options?.body,
      signal: options?.signal || undefined
    };
    
    return this.request<T>(url, config);
  }

  // Add interceptor methods for dynamic configuration
  addBefore(handler: RequestHandler): void {
    if (!this.interceptors.before) {
      this.interceptors.before = [];
    }
    this.interceptors.before.push(handler);
  }

  addAfter(handler: ResponseHandler): void {
    if (!this.interceptors.after) {
      this.interceptors.after = [];
    }
    this.interceptors.after.push(handler);
  }

  addErrorHandler(handler: ErrorHandler): void {
    if (!this.interceptors.onError) {
      this.interceptors.onError = [];
    }
    this.interceptors.onError.push(handler);
  }

  // Remove interceptor methods
  removeBefore(handler: RequestHandler): void {
    if (this.interceptors.before) {
      const index = this.interceptors.before.indexOf(handler);
      if (index > -1) {
        this.interceptors.before.splice(index, 1);
      }
    }
  }

  removeAfter(handler: ResponseHandler): void {
    if (this.interceptors.after) {
      const index = this.interceptors.after.indexOf(handler);
      if (index > -1) {
        this.interceptors.after.splice(index, 1);
      }
    }
  }

  removeErrorHandler(handler: ErrorHandler): void {
    if (this.interceptors.onError) {
      const index = this.interceptors.onError.indexOf(handler);
      if (index > -1) {
        this.interceptors.onError.splice(index, 1);
      }
    }
  }

  // Clear all interceptors
  clearInterceptors(): void {
    this.interceptors = {};
    this.timeoutHandler = undefined; // Clear timeout handler reference
  }

  // Cancel all pending requests
  cancelAllRequests(): void {
    this.timeoutControllers.forEach(controller => {
      controller.abort();
    });
    this.timeoutControllers.clear();
  }

  // Set timeout for requests (fixed memory leak)
  setTimeout(timeoutMs: number): void {
    // Remove previous timeout interceptor if exists
    if (this.timeoutHandler) {
      this.removeBefore(this.timeoutHandler);
    }

    // Create new timeout interceptor
    this.timeoutHandler = (config, url) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, timeoutMs);

      // Clean up timeout when request completes or is aborted
      const cleanup = () => {
        clearTimeout(timeoutId);
      };

      // Add cleanup to both original and controller signals
      const originalSignal = config.signal;
      if (originalSignal) {
        originalSignal.addEventListener('abort', cleanup, { once: true });
      }

      // Always add cleanup to controller signal
      controller.signal.addEventListener('abort', cleanup, { once: true });

      return {
        ...config,
        signal: controller.signal
      };
    };

    // Add the new timeout interceptor
    this.addBefore(this.timeoutHandler);
  }
}
