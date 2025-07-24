import { RequestConfig } from "../types";

function normalizeUrl(base: string, path: string): string {
    return base.replace(/\/+$/, '') + '/' + path.replace(/^\/+/, '');
}

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
    getLoginURL(): string|undefined {
        return this.loginPath ;
    }
    getRefreshTokenURL(): string|undefined {
        return this.refreshTokenUrl ? normalizeUrl(this.baseUrl, this.refreshTokenUrl) : undefined; 
    }
    private async request<T>(url: string, config: RequestConfig): Promise<T> {
        const fullUrl = normalizeUrl(this.baseUrl, url);
        const defaultHeaders = { 'Content-Type': 'application/json' };
        const headers={...defaultHeaders, ...(config.headers || {})};
        const response=await fetch(fullUrl,{
            method:config.method,
            headers,
            body: config.body ? JSON.stringify(config.body) : undefined,
        });
        
        // Handle 401 (Unauthorized) responses
        if(response.status === 401){
            if (this.loginPath) {
                window.location.href = this.loginPath;
                return new Promise(() => {});
            }
            return Promise.reject(new Error("Unauthorized access"));
        }
        
        // Handle 403 (Forbidden) responses - let AuthMiddleware handle token refresh first
        if(response.status === 403){
            // Don't automatically redirect on 403, let AuthMiddleware try to refresh token
            // Only redirect if this is a direct HttpClient call (not through AuthMiddleware)
            const hasAuthHeader = headers && (
                (typeof headers === 'object' && 'Authorization' in headers) ||
                (Array.isArray(headers) && headers.some(([key]) => key.toLowerCase() === 'authorization'))
            );
            if (!hasAuthHeader && this.loginPath) {
                window.location.href = this.loginPath;
                return new Promise(() => {})
            }
            else{
                // If AuthMiddleware is handling this, it will take care of the 403 response
                window.location.href = this.loginPath;
                return new Promise(()=>{});
            }
        }
        
        if (!response.ok) {
            const errorText = await response.text();
            return Promise.reject(new Error(`HTTP error! status: ${response.status}, body: ${errorText}`));
        }
        return response.json() as Promise<T>;
    }
    get<T>(url: string, headers?: HeadersInit): Promise<T> {
        return this.request<T>(url, { method: 'GET', headers });
    }
    post<T>(url: string, body: any, headers?: HeadersInit): Promise<T> {
        return this.request<T>(url, { method: 'POST', body, headers });
    }
    put<T>(url: string, body: any, headers?: HeadersInit): Promise<T> {
        return this.request<T>(url, { method: 'PUT', body, headers });
    }
    delete<T>(url: string, headers?: HeadersInit): Promise<T> {
        return this.request<T>(url, { method: 'DELETE', headers });
    }
    patch<T>(url: string, body: any, headers?: HeadersInit): Promise<T> {
        return this.request<T>(url, { method: 'PATCH', body, headers });
    }

    // Raw request method that returns Response object (used by AuthMiddleware)
    async requestRaw(url: string, config: RequestConfig): Promise<Response> {
        const fullUrl = normalizeUrl(this.baseUrl, url);
        const defaultHeaders = { 'Content-Type': 'application/json' };
        const headers={...defaultHeaders, ...(config.headers || {})};
        return fetch(fullUrl,{
            method:config.method,
            headers,
            body: config.body ? JSON.stringify(config.body) : undefined,
        });
    }
}