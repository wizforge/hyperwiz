import { 
    getAccessToken, 
    getRefreshToken, 
    getAccessExpiresAt, 
    logout, 
    getRefreshExpiresAt, 
    setTokens, 
    isAccessTokenExpired, 
    isRefreshTokenExpired,
    setGlobalSecretKey
} from "../core/TokenManager";
import { HttpClient } from "../core/HttpClient";
import { tryRefreshToken } from "../utils/tokenUtils";

// Import the ApiResponse type from HttpClient
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; status?: number; error: string };

// Helper function to calculate refresh token expiration time
function calculateRefreshTokenExpiration(shouldUpdate: boolean, newAgeInSeconds: number | null, existingExpiresAt: number | null): number | null {
    if (shouldUpdate && newAgeInSeconds) {
        // If we should update and have a new age, calculate new expiration
        return Date.now() + (newAgeInSeconds * 1000);
    } else if (existingExpiresAt) {
        // If we shouldn't update but have existing expiration, preserve it
        return existingExpiresAt;
    } else {
        // If no existing expiration and no update, return null
        return null;
    }
}

export function createAuthMiddleware(client: HttpClient, secretKey?: string) {
    return async function withAuth<T>(requestFn: (headers: HeadersInit) => Promise<ApiResponse<T>>): Promise<ApiResponse<T>> {
        // Set global secret key if provided
        if (secretKey) {
            setGlobalSecretKey(secretKey);
        }

        let accessToken = await getAccessToken();
        let refreshToken = await getRefreshToken();
        let ageInSeconds = parseInt(localStorage.getItem('accessToken_age') || '') || null;
        let refreshAgeInSeconds = parseInt(localStorage.getItem('refreshToken_age') || '') || null;
        let authHeaders: HeadersInit = {};
        
        // CRITICAL FIX: Check if we have any tokens at all
        if (!accessToken && !refreshToken) {
            console.warn('No tokens available - redirecting to login');
            redirectToLogin(client);
            throw new Error("No authentication tokens available");
        }
        
        // If no access token but have refresh token, try to refresh
        if (!accessToken && refreshToken) {
            if (isRefreshTokenExpired()) {
                console.warn('Refresh token expired - redirecting to login');
                redirectToLogin(client);
                throw new Error("Refresh token expired");
            } else {
                try {
                    const refreshResponse = await tryRefreshToken(client, refreshToken);
                    if (refreshResponse?.accessToken && secretKey) {
                        // Only update access token expiration, preserve refresh token expiration
                        // If server returns a new refresh token, use it; otherwise keep the existing one
                        const newRefreshToken = refreshResponse.refreshToken || refreshToken;
                        
                        // If server returned a new refresh token, it should have its own expiration
                        // If server didn't return a new refresh token, don't update the expiration
                        const shouldUpdateRefreshExpiration = refreshResponse.refreshToken && refreshResponse.refreshToken !== refreshToken;
                        
                        // Ensure we always pass a valid refresh token (existing one if no new one provided)
                        const refreshTokenToUse = newRefreshToken || refreshToken;
                        
                        // Get existing refresh token expiration time
                        const existingRefreshExpiresAt = getRefreshExpiresAt();
                        
                        // Calculate the correct refresh token expiration time
                        const calculatedRefreshExpiration = calculateRefreshTokenExpiration(
                            shouldUpdateRefreshExpiration, 
                            refreshAgeInSeconds, 
                            existingRefreshExpiresAt
                        );
                        
                        await setTokens(
                            refreshResponse.accessToken, 
                            secretKey, 
                            refreshTokenToUse, 
                            ageInSeconds, 
                            shouldUpdateRefreshExpiration ? refreshAgeInSeconds : null
                        );
                        // Update refresh token expiration in localStorage if we calculated a new one
                        if (calculatedRefreshExpiration) {
                            localStorage.setItem('refreshExpiresAt', calculatedRefreshExpiration.toString());
                        }
                        authHeaders = { Authorization: `Bearer ${refreshResponse.accessToken}` };
                        return await requestFn(authHeaders);
                    } else {
                        console.warn('Token refresh failed - redirecting to login');
                        redirectToLogin(client);
                        throw new Error("Token refresh failed");
                    }
                } catch (error) {
                    console.error('Token refresh error:', error);
                    redirectToLogin(client);
                    throw new Error("Token refresh failed");
                }
            }
        }
        
        // Check if access token is expired and try to refresh
        if (accessToken && isAccessTokenExpired()) {
            if (!refreshToken || isRefreshTokenExpired()) {
                console.warn('Access token expired and no valid refresh token - redirecting to login');
                redirectToLogin(client);
                throw new Error("Session expired - both tokens are invalid");
            } else {
                try {
                    const refreshResponse = await tryRefreshToken(client, refreshToken);
                    if (refreshResponse?.accessToken && secretKey) {
                        // Only update access token expiration, preserve refresh token expiration
                        // If server returns a new refresh token, use it; otherwise keep the existing one
                        const newRefreshToken = refreshResponse.refreshToken || refreshToken;
                        
                        // If server returned a new refresh token, it should have its own expiration
                        // If server didn't return a new refresh token, don't update the expiration
                        const shouldUpdateRefreshExpiration = refreshResponse.refreshToken && refreshResponse.refreshToken !== refreshToken;
                        
                        // Ensure we always pass a valid refresh token (existing one if no new one provided)
                        const refreshTokenToUse = newRefreshToken || refreshToken;
                        
                        // Get existing refresh token expiration time
                        const existingRefreshExpiresAt = getRefreshExpiresAt();
                        
                        // Calculate the correct refresh token expiration time
                        const calculatedRefreshExpiration = calculateRefreshTokenExpiration(
                            shouldUpdateRefreshExpiration, 
                            refreshAgeInSeconds, 
                            existingRefreshExpiresAt
                        );
                        
                        await setTokens(
                            refreshResponse.accessToken, 
                            secretKey, 
                            refreshTokenToUse, 
                            ageInSeconds, 
                            shouldUpdateRefreshExpiration ? refreshAgeInSeconds : null
                        );
                        // Update refresh token expiration in localStorage if we calculated a new one
                        if (calculatedRefreshExpiration) {
                            localStorage.setItem('refreshExpiresAt', calculatedRefreshExpiration.toString());
                        }
                        authHeaders = { Authorization: `Bearer ${refreshResponse.accessToken}` };
                        return await requestFn(authHeaders);
                    } else {
                        console.warn('Token refresh failed - redirecting to login');
                        redirectToLogin(client);
                        throw new Error("Token refresh failed");
                    }
                } catch (error) {
                    console.error('Token refresh error:', error);
                    redirectToLogin(client);
                    throw new Error("Token refresh failed");
                }
            }
        }
        
        // CRITICAL FIX: Ensure we have a valid access token before proceeding
        if (!accessToken) {
            console.warn('No valid access token available - redirecting to login');
            redirectToLogin(client);
            throw new Error("No valid access token available");
        }
        
        // Set auth headers with current access token
        authHeaders = { Authorization: `Bearer ${accessToken}` };
        
        try {
            return await requestFn(authHeaders);
        } catch (error) {
            // If we get a 403 error, try to refresh token and retry
            if (error instanceof Error && error.message.includes('HTTP error! status: 403')) {
                if (refreshToken && secretKey && !isRefreshTokenExpired()) {
                    try {
                        const refreshed = await tryRefreshToken(client, refreshToken);
                        if (refreshed && refreshed.accessToken) {
                            // Only update access token expiration, preserve refresh token expiration
                            // If server returns a new refresh token, use it; otherwise keep the existing one
                            const newRefreshToken = refreshed.refreshToken || refreshToken;
                            
                            // If server returned a new refresh token, it should have its own expiration
                            // If server didn't return a new refresh token, don't update the expiration
                            const shouldUpdateRefreshExpiration = refreshed.refreshToken && refreshed.refreshToken !== refreshToken;
                            
                            // Ensure we always pass a valid refresh token (existing one if no new one provided)
                            const refreshTokenToUse = newRefreshToken || refreshToken;
                            
                            // Get existing refresh token expiration time
                            const existingRefreshExpiresAt = getRefreshExpiresAt();
                            
                            // Calculate the correct refresh token expiration time
                            const calculatedRefreshExpiration = calculateRefreshTokenExpiration(
                                shouldUpdateRefreshExpiration, 
                                refreshAgeInSeconds, 
                                existingRefreshExpiresAt
                            );
                            
                            await setTokens(
                                refreshed.accessToken, 
                                secretKey, 
                                refreshTokenToUse, 
                                ageInSeconds, 
                                shouldUpdateRefreshExpiration ? refreshAgeInSeconds : null
                            );
                            // Update refresh token expiration in localStorage if we calculated a new one
                            if (calculatedRefreshExpiration) {
                                localStorage.setItem('refreshExpiresAt', calculatedRefreshExpiration.toString());
                            }
                            authHeaders = { Authorization: `Bearer ${refreshed.accessToken}` };
                            return await requestFn(authHeaders);
                        } else {
                            console.warn('Token refresh failed after 403 - redirecting to login');
                            redirectToLogin(client);
                            throw new Error("Token refresh failed after 403 error");
                        }
                    } catch (refreshError) {
                        console.error('Token refresh error after 403:', refreshError);
                        redirectToLogin(client);
                        throw new Error("Token refresh failed after 403 error");
                    }
                } else {
                    console.warn('No valid refresh token available for retry - redirecting to login');
                    redirectToLogin(client);
                    throw new Error("No valid refresh token available for retry");
                }
            }
            // Re-throw other errors
            throw error;
        }
    };
}

function redirectToLogin(client: HttpClient) {
    const loginUrl = client.getLoginURL();
    if (loginUrl) {
        console.log(`Redirecting to login: ${loginUrl}`);
        logout(loginUrl);
    } else {
        console.warn('No login URL configured - clearing tokens only');
        logout();
    }
}


