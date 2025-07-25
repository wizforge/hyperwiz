import { getAccessToken, getRefreshToken, getAccessExpiresAt,logout, getRefreshExpiresAt, setTokens, isAccessTokenExpired, isRefreshTokenExpired } from "../core/TokenManager";
import { HttpClient } from "../core/HttpClient";
import { TokenAge } from "../core/TokenManager";
import { tryRefreshToken } from "../utils/tokenUtils";

export function createAuthMiddleware(client: HttpClient) {
    return async function withAuth<T>(requestFn: (headers: HeadersInit) => Promise<T>): Promise<T> {
        let accessToken = getAccessToken();
        let refreshToken = getRefreshToken();
        let ageInSeconds = parseInt(localStorage.getItem('accessToken_age') || '') || TokenAge.seconds(60, 'accessToken');
        let refreshAgeInSeconds = parseInt(localStorage.getItem('refreshToken_age') || '') || null;
        let authHeaders: HeadersInit = {};
        
        // Check if access token is expired and try to refresh
        if (isAccessTokenExpired() && accessToken) {
            if (isRefreshTokenExpired() && refreshToken) {
                redirectToLogin(client);
                throw new Error("Session expired - both tokens are invalid");
            } else if (refreshToken) {
                const refreshResponse = await tryRefreshToken(client, refreshToken);
                if (refreshResponse?.accessToken) {
                    setTokens(refreshResponse.accessToken, refreshResponse.refreshToken, ageInSeconds, refreshAgeInSeconds);
                    authHeaders = { Authorization: `Bearer ${refreshResponse.accessToken}` };
                    return await requestFn(authHeaders);
                } else {
                    redirectToLogin(client);
                    throw new Error("Token refresh failed");
                }
            }
        }
        
        // Set auth headers with current access token
        authHeaders = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
        
        try {
            return await requestFn(authHeaders);
        } catch (error) {
            // If we get a 403 error, try to refresh token and retry
            if (error instanceof Error && error.message.includes('HTTP error! status: 403')) {
                if (refreshToken) {
                    const refreshed = await tryRefreshToken(client, refreshToken);
                    if (refreshed && refreshed.accessToken) {
                        setTokens(refreshed.accessToken, refreshed.refreshToken, ageInSeconds, refreshAgeInSeconds);
                        authHeaders = { Authorization: `Bearer ${refreshed.accessToken}` };
                        return await requestFn(authHeaders);
                    } else {
                        redirectToLogin(client);
                        throw new Error("Token refresh failed after 403 error");
                    }
                } else {
                    redirectToLogin(client);
                    throw new Error("No refresh token available for retry");
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
        logout(loginUrl);
    }
}


