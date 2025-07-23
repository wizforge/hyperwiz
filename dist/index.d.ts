declare class HttpClient {
    private baseUrl;
    constructor(baseUrl: string);
    private request;
    get<T>(url: string, headers?: HeadersInit): Promise<T>;
    post<T>(url: string, body: any, headers?: HeadersInit): Promise<T>;
    put<T>(url: string, body: any, headers?: HeadersInit): Promise<T>;
    delete<T>(url: string, headers?: HeadersInit): Promise<T>;
    patch<T>(url: string, body: any, headers?: HeadersInit): Promise<T>;
}

declare const createClient: (baseUrl: string) => HttpClient;

interface RequestConfig {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers?: HeadersInit;
    body?: any;
}

export { type RequestConfig, createClient };
