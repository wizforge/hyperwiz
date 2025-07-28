import { RequestConfig, Interceptors, RequestHandler, ResponseHandler, ErrorHandler } from '../types/index';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

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

  constructor(baseUrl: string, interceptors?: Interceptors, credentials?: RequestCredentials) {
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
      
      // Set default headers
      const headers = {
        'Content-Type': 'application/json',
        ...(finalConfig.headers || {}),
      };

      // Create abort controller for timeout
      const controller = new AbortController();
      this.timeoutControllers.set(requestId, controller);

      // Make the request with credentials support
      const response = await fetch(fullUrl, {
        method: finalConfig.method,
        headers,
        body: finalConfig.body ? JSON.stringify(finalConfig.body) : undefined,
        signal: finalConfig.signal || controller.signal,
        credentials: this.credentials, // Include credentials for cookies
      });

      // Clean up timeout controller
      this.timeoutControllers.delete(requestId);

      // Parse response
      const data = await parseResponse(response);

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

      // Run after handlers (response interceptors)
      const processedData = await this.runAfterHandlers(response, data as T, fullUrl);

      return { success: true, data: processedData };
    } catch (err) {
      // Clean up timeout controller on error
      this.timeoutControllers.delete(requestId);
      
      const error = err instanceof Error ? err.message : 'Network error';
      const processedError = await this.runErrorHandlers(error, fullUrl, config);
      
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

      // Clean up timeout when request completes
      const originalSignal = config.signal;
      if (originalSignal) {
        originalSignal.addEventListener('abort', () => {
          clearTimeout(timeoutId);
        });
      }

      return {
        ...config,
        signal: controller.signal
      };
    };

    // Add the new timeout interceptor
    this.addBefore(this.timeoutHandler);
  }
}
