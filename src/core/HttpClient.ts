import { RequestConfig } from "../types";

function normalizeUrl(base: string, path: string): string {
  return base.replace(/\/+$/, '') + '/' + path.replace(/^\/+/, '');
}

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; status?: number; error: string };

export class HttpClient {
  private baseUrl: string;
  private loginPath: string;
  private refreshTokenUrl: string;

  constructor(baseUrl: string, loginUrl?: string, refreshTokenUrl?: string) {
    this.baseUrl = baseUrl;
    this.loginPath = loginUrl || '';
    this.refreshTokenUrl = refreshTokenUrl || '';
  }

  setLoginPath(url: string) {
    this.loginPath = url;
  }

  setRefreshTokenPath(url: string) {
    this.refreshTokenUrl = url;
  }

  getLoginURL(): string {
    return this.loginPath || '';
  }

  getRefreshTokenURL(): string {
    return this.refreshTokenUrl
      ? normalizeUrl(this.baseUrl, this.refreshTokenUrl)
      : '';
  }

  private async parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      const json = await response.json();
      return { success: true, data: json };
    } catch (e) {
      return { success: false, status: response.status, error: "Invalid JSON response" };
    }
  }

  private async request<T>(url: string, config: RequestConfig): Promise<ApiResponse<T>> {
    const fullUrl = normalizeUrl(this.baseUrl, url);
    const defaultHeaders = { 'Content-Type': 'application/json' };
    const headers = { ...defaultHeaders, ...(config.headers || {}) };

    try {
      const response = await fetch(fullUrl, {
        method: config.method,
        headers,
        body: config.body ? JSON.stringify(config.body) : undefined,
      });

      if (response.status === 401) {
        console.warn('401 Unauthorized - redirecting to login');
        if (this.loginPath) {
          window.location.href = this.loginPath;
          return {success: false,status: 401,error: "Unauthorized Redirecting to login"}
        }
        return { success: false, status: 401, error: "Unauthorized access" };
      }

      if (response.status === 403) {
        console.warn('403 Forbidden - token may be invalid');
        // Throw error for middleware to catch and handle token refresh
        return {success: false,status: 403,error: "Forbidden - Token may be invalid"}
      }

      if (!response.ok) {
        const text = await response.text();
        return { success: false, status: response.status, error: text };
      }

      return await this.parseResponse<T>(response);

    } catch (error: any) {
      // Re-throw 403 errors for middleware
      if (error.message.includes('HTTP error! status: 403')) {
        return {success: false,status: 403,error: "Forbidden - Token may be invalid"}
      }
      
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  get<T>(url: string, headers?: HeadersInit): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'GET', headers });
  }

  post<T>(url: string, body: any, headers?: HeadersInit): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'POST', body, headers });
  }

  put<T>(url: string, body: any, headers?: HeadersInit): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'PUT', body, headers });
  }

  delete<T>(url: string, headers?: HeadersInit): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'DELETE', headers });
  }

  patch<T>(url: string, body: any, headers?: HeadersInit): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'PATCH', body, headers });
  }
}
