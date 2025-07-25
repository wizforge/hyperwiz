import { RequestConfig } from "../types";
import { tryRefreshToken } from "../utils/tokenUtils";
import { setTokens } from "./TokenManager";

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
      let response = await fetch(fullUrl, {
        method: config.method,
        headers,
        body: config.body ? JSON.stringify(config.body) : undefined,
      });

      if (response.status === 401) {
        if (this.loginPath) {
          window.location.href = this.loginPath;
          return Promise.reject(new Error("Redirecting to login"));
        }
        return { success: false, status: 401, error: "Unauthorized access" };
      }

      if (response.status === 403) {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          if (this.loginPath) window.location.href = this.loginPath;
          return { success: false, status: 403, error: "No refresh token available" };
        }

        try {
          const refreshResponse = await tryRefreshToken(this, refreshToken);
          const ageInSeconds = parseInt(localStorage.getItem('accessToken_age') || '') || null;
          const existingRefreshExpiresAt = parseInt(localStorage.getItem('refreshExpiresAt') || '') || null;

          if (refreshResponse?.accessToken) {
            setTokens(refreshResponse.accessToken, refreshResponse.refreshToken, ageInSeconds, null);
            if (existingRefreshExpiresAt) {
              localStorage.setItem('refreshExpiresAt', existingRefreshExpiresAt.toString());
            }

            const authHeaders = refreshResponse.accessToken
              ? { Authorization: `Bearer ${refreshResponse.accessToken}` }
              : {};
            const retryHeaders = Object.fromEntries(
              Object.entries({ ...defaultHeaders, ...(config.headers || {}), ...authHeaders }).filter(
                ([_, v]) => v !== undefined
              )
            );

            response = await fetch(fullUrl, {
              method: config.method,
              headers: retryHeaders,
              body: config.body ? JSON.stringify(config.body) : undefined,
            });

            if ([401, 402, 403].includes(response.status)) {
              if (this.loginPath) window.location.href = this.loginPath;
              return await this.parseResponse<T>(response);
            }

            if (!response.ok) {
              const text = await response.text();
              return { success: false, status: response.status, error: text };
            }

            return await this.parseResponse<T>(response);
          } else {
            if (this.loginPath) window.location.href = this.loginPath;
            return { success: false, status: 403, error: "Token refresh failed" };
          }
        } catch (err) {
          if (this.loginPath) window.location.href = this.loginPath;
          return { success: false, status: 403, error: "Token refresh failed" };
        }
      }

      if (!response.ok) {
        const text = await response.text();
        return { success: false, status: response.status, error: text };
      }

      return await this.parseResponse<T>(response);

    } catch (error: any) {
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

  async requestRaw(url: string, config: RequestConfig): Promise<Response> {
    const fullUrl = normalizeUrl(this.baseUrl, url);
    const defaultHeaders = { 'Content-Type': 'application/json' };
    const headers = { ...defaultHeaders, ...(config.headers || {}) };

    try {
      return await fetch(fullUrl, {
        method: config.method,
        headers,
        body: config.body ? JSON.stringify(config.body) : undefined,
      });
    } catch (error: any) {
      throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
