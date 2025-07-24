// Token store interface for better type safety
interface TokenStore {
    accessToken: string | null;
    refreshToken: string | null;
    refreshExpiresAt: number | null;
    accessExpiresAt: number | null;
}

let tokenStore: TokenStore = {
    accessToken: null,
    refreshToken: null,
    refreshExpiresAt: null,
    accessExpiresAt: null,
}

export function setAccessToken(token: string , ageInSeconds?: number | null) {
    tokenStore.accessToken = token;
    tokenStore.accessExpiresAt = ageInSeconds ? Date.now() + (ageInSeconds * 1000) : null;
    localStorage.setItem('accessToken', token);
    localStorage.setItem('accessExpiresAt', tokenStore.accessExpiresAt?.toString() || '');
}

export function setRefreshToken(token: string , ageInSeconds?: number | null) {
    tokenStore.refreshToken = token;
    tokenStore.refreshExpiresAt = ageInSeconds ? Date.now() + (ageInSeconds * 1000) : null;
    localStorage.setItem('refreshToken', token);
    localStorage.setItem('refreshExpiresAt', tokenStore.refreshExpiresAt?.toString() || '');
}

export function setTokens(accessToken: string , refreshToken?: string | null, accessAgeInSeconds?: number | null, refreshAgeInSeconds?: number | null) {
    tokenStore.accessToken = accessToken;
    tokenStore.refreshToken = refreshToken || null;
    tokenStore.accessExpiresAt = accessAgeInSeconds ? Date.now() + (accessAgeInSeconds * 1000) : null;
    tokenStore.refreshExpiresAt = refreshAgeInSeconds ? Date.now() + (refreshAgeInSeconds * 1000) : null;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken || '');
    localStorage.setItem('accessExpiresAt', tokenStore.accessExpiresAt?.toString() || '');
    localStorage.setItem('refreshExpiresAt', tokenStore.refreshExpiresAt?.toString() || '');
    
}

// set Age function
const setAge = (tokenName: string, seconds: number): number => {
    localStorage.setItem(`${tokenName}_age`, seconds.toString());
    return seconds;
};


// Time utility functions for easy token age calculations
export const TokenAge = {
    seconds: (value: number, tokenName: string) => setAge(tokenName, value),
    minutes: (value: number, tokenName: string) => setAge(tokenName, value * 60),
    hours: (value: number, tokenName: string) => setAge(tokenName, value * 3600),
    days: (value: number, tokenName: string) => setAge(tokenName, value * 86400),
    months: (value: number, tokenName: string) => setAge(tokenName, value * 2592000), // 30 days
    years: (value: number, tokenName: string) => setAge(tokenName, value * 31536000), // 365 days

    // Convenience methods for common durations
    minute: () => 60,
    hour: () => 60 * 60,
    day: () => 24 * 60 * 60,
    week: () => 7 * 24 * 60 * 60,
    month: () => 30 * 24 * 60 * 60, // Approximate 30 days
    year: () => 365 * 24 * 60 * 60, // Approximate 365 days

};

export function isAccessTokenExpired(): boolean {
    return localStorage.getItem('accessExpiresAt')!=='' ? Date.now() >= parseInt(localStorage.getItem('accessExpiresAt') || '') : false;
}
export function isRefreshTokenExpired(): boolean {
    return localStorage.getItem('refreshExpiresAt')!=='' ? Date.now() >= parseInt(localStorage.getItem('refreshExpiresAt') || '') : false;
}
export function getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
}
export function getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
}
export function getAccessExpiresAt(): number | null {
    return localStorage.getItem('accessExpiresAt') ? parseInt(localStorage.getItem('accessExpiresAt') || '') : null;
}
export function getRefreshExpiresAt(): number | null {
    return localStorage.getItem('refreshExpiresAt') ? parseInt(localStorage.getItem('refreshExpiresAt') || '') : null;
}

export function logout(redirectUrl?: string) {
    // Clear in-memory token store
    tokenStore.accessToken = null;
    tokenStore.refreshToken = null;
    tokenStore.accessExpiresAt = null;
    tokenStore.refreshExpiresAt = null;
    
    // Remove from localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('accessExpiresAt');
    localStorage.removeItem('refreshExpiresAt');
    localStorage.removeItem('accessToken_age');
    localStorage.removeItem('refreshToken_age');

    // Optionally redirect to login or logout page
    if (redirectUrl) {
        window.location.href = redirectUrl;
    }
}