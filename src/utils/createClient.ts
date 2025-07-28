import { HttpClient } from "../core/HttpClient";

export interface ClientConfig {
  loginUrl?: string;
  refreshTokenUrl?: string;
  cookieDomain?: string;
  cookiePath?: string;
  cookieSecure?: boolean;
  cookieSameSite?: 'Strict' | 'Lax' | 'None';
}

export const createClient = (baseUrl: string, config?: ClientConfig) => {
  const client = new HttpClient(
    baseUrl, 
    config?.loginUrl, 
    config?.refreshTokenUrl
  );
  
  return client;
};
