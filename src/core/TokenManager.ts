// Token store interface for better type safety
import { encryptToken, decryptToken } from "../utils/tokenUtils";

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

// Global secret key for decryption
let globalSecretKey: string | null = null;

export function setGlobalSecretKey(secretKey: string) {
    if (!secretKey || secretKey.length < 32) {
        throw new Error('Secret key must be at least 32 characters long for AES-256 encryption');
    }
    globalSecretKey = secretKey;
}

export async function setAccessToken(token: string, secretKey: string, ageInSeconds?: number | null) {
    if (!secretKey || secretKey.length < 32) {
        throw new Error('Secret key must be at least 32 characters long for AES-256 encryption');
    }
    
    try {
        const encryptedToken = await encryptToken(token, secretKey);
        tokenStore.accessToken = encryptedToken;
        tokenStore.accessExpiresAt = ageInSeconds ? Date.now() + (ageInSeconds * 1000) : null;
        localStorage.setItem('accessToken', encryptedToken);
        localStorage.setItem('accessExpiresAt', tokenStore.accessExpiresAt?.toString() || '');
        
        // Store age for middleware
        if (ageInSeconds) {
            localStorage.setItem('accessToken_age', ageInSeconds.toString());
        }
        
        // Store secret key for decryption
        if (!globalSecretKey) {
            globalSecretKey = secretKey;
        }
    } catch (error) {
        console.error('Failed to encrypt access token:', error);
        throw new Error('Failed to encrypt access token');
    }
}

export async function setRefreshToken(token: string, secretKey: string, ageInSeconds?: number | null) {
    if (!secretKey || secretKey.length < 32) {
        throw new Error('Secret key must be at least 32 characters long for AES-256 encryption');
    }
    
    try {
        const encryptedToken = await encryptToken(token, secretKey);
        tokenStore.refreshToken = encryptedToken;
        tokenStore.refreshExpiresAt = ageInSeconds ? Date.now() + (ageInSeconds * 1000) : null;
        localStorage.setItem('refreshToken', encryptedToken);
        localStorage.setItem('refreshExpiresAt', tokenStore.refreshExpiresAt?.toString() || '');
        
        // Store age for middleware
        if (ageInSeconds) {
            localStorage.setItem('refreshToken_age', ageInSeconds.toString());
        }
        
        // Store secret key for decryption
        if (!globalSecretKey) {
            globalSecretKey = secretKey;
        }
    } catch (error) {
        console.error('Failed to encrypt refresh token:', error);
        throw new Error('Failed to encrypt refresh token');
    }
}

export async function setTokens(accessToken: string, secretKey: string, refreshToken?: string | null, accessAgeInSeconds?: number | null, refreshAgeInSeconds?: number | null) {
    if (!secretKey || secretKey.length < 32) {
        throw new Error('Secret key must be at least 32 characters long for AES-256 encryption');
    }
    
    try {
        const encryptedAccessToken = await encryptToken(accessToken, secretKey);
        const encryptedRefreshToken = refreshToken ? await encryptToken(refreshToken, secretKey) : '';
        
        tokenStore.accessToken = encryptedAccessToken;
        tokenStore.refreshToken = encryptedRefreshToken;
        tokenStore.accessExpiresAt = accessAgeInSeconds ? Date.now() + (accessAgeInSeconds * 1000) : null;
        tokenStore.refreshExpiresAt = refreshAgeInSeconds ? Date.now() + (refreshAgeInSeconds * 1000) : null;
        
        localStorage.setItem('accessToken', encryptedAccessToken);
        localStorage.setItem('refreshToken', encryptedRefreshToken);
        localStorage.setItem('accessExpiresAt', tokenStore.accessExpiresAt?.toString() || '');
        localStorage.setItem('refreshExpiresAt', tokenStore.refreshExpiresAt?.toString() || '');
        
        // Store ages for middleware
        if (accessAgeInSeconds) {
            localStorage.setItem('accessToken_age', accessAgeInSeconds.toString());
        }
        if (refreshAgeInSeconds) {
            localStorage.setItem('refreshToken_age', refreshAgeInSeconds.toString());
        }
        
        // Store secret key for decryption
        globalSecretKey = secretKey;
    } catch (error) {
        console.error('Failed to encrypt tokens:', error);
        throw new Error('Failed to encrypt tokens');
    }
}

// Time utility functions for easy token age calculations
export const TokenAge = {
    // Duration methods that return seconds
    seconds: (value: number) => value,
    minutes: (value: number) => value * 60,
    hours: (value: number) => value * 3600,
    days: (value: number) => value * 86400,
    weeks: (value: number) => value * 7 * 86400,
    months: (value: number) => value * 30 * 86400, // Approximate 30 days
    years: (value: number) => value * 365 * 86400, // Approximate 365 days

    // Convenience methods for common durations
    minute: () => 60,
    hour: () => 60 * 60,
    day: () => 24 * 60 * 60,
    week: () => 7 * 24 * 60 * 60,
    month: () => 30 * 24 * 60 * 60, // Approximate 30 days
    year: () => 365 * 24 * 60 * 60, // Approximate 365 days
};

export function isAccessTokenExpired(): boolean {
    const expiresAt = localStorage.getItem('accessExpiresAt');
    return expiresAt && expiresAt !== '' ? Date.now() >= parseInt(expiresAt) : false;
}

export function isRefreshTokenExpired(): boolean {
    const expiresAt = localStorage.getItem('refreshExpiresAt');
    return expiresAt && expiresAt !== '' ? Date.now() >= parseInt(expiresAt) : false;
}

export async function getAccessToken(): Promise<string | null> {
    try {
        const encryptedToken = localStorage.getItem('accessToken');
        if (!encryptedToken || !globalSecretKey) {
            return null;
        }
        return await decryptToken(encryptedToken, globalSecretKey);
    } catch (error) {
        console.error('Failed to decrypt access token:', error);
        return null;
    }
}

export async function getRefreshToken(): Promise<string | null> {
    try {
        const encryptedToken = localStorage.getItem('refreshToken');
        if (!encryptedToken || !globalSecretKey) {
            return null;
        }
        return await decryptToken(encryptedToken, globalSecretKey);
    } catch (error) {
        console.error('Failed to decrypt refresh token:', error);
        return null;
    }
}

export function getAccessExpiresAt(): number | null {
    const expiresAt = localStorage.getItem('accessExpiresAt');
    return expiresAt && expiresAt !== '' ? parseInt(expiresAt) : null;
}

export function getRefreshExpiresAt(): number | null {
    const expiresAt = localStorage.getItem('refreshExpiresAt');
    return expiresAt && expiresAt !== '' ? parseInt(expiresAt) : null;
}

export function logout(redirectUrl?: string) {
    // Clear in-memory token store
    tokenStore.accessToken = null;
    tokenStore.refreshToken = null;
    tokenStore.accessExpiresAt = null;
    tokenStore.refreshExpiresAt = null;
    globalSecretKey = null;
    
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