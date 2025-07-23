import { RequestConfig } from "../types";

function normalizeUrl(base: string, path: string): string {
    return base.replace(/\/+$/, '') + '/' + path.replace(/^\/+/, '');
}
export class HttpClient {
    private baseUrl: string;
    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
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
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
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
}