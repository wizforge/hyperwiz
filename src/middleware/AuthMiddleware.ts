import { getAccessToken, getRefreshToken, getAccessExpiresAt,logout, getRefreshExpiresAt, setTokens, isAccessTokenExpired, isRefreshTokenExpired } from "../core/TokenManager";
import { HttpClient } from "../core/HttpClient";
import { TokenAge } from "../core/TokenManager";

export function createAuthMiddleware(client: HttpClient) {
    return async function withAuth(requestFn: (headers: HeadersInit) => Promise<Response>) {
        let accessToken = getAccessToken();
        let refreshToken = getRefreshToken();
        let accessExpiresAt = getAccessExpiresAt();
        let refreshExpiresAt = getRefreshExpiresAt();
        let ageInSeconds = parseInt(localStorage.getItem('accessToken_age') || '') || TokenAge.seconds(60, 'accessToken');
        let response: Response | null = null;
        let authHeaders = {};
        if (isAccessTokenExpired()) {
            if (isRefreshTokenExpired()) {
                redirectToLogin(client);
                return new Response("Unauthorized", { status: 401 });
            } else {
                const response = await tryRefreshToken(client, refreshToken);
                if (response?.accessToken) {
                    setTokens(response.accessToken, response.refreshToken,Date.now() + (ageInSeconds * 1000), refreshExpiresAt);
                    authHeaders = response.accessToken ? { Authorization: `Bearer ${response.accessToken}` } : {};
                    return await requestFn(authHeaders);
                } else {
                    redirectToLogin(client);
                }
            }
        }
        authHeaders = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
        response = await requestFn(authHeaders);
        if(response.status===403){
            if (refreshToken != null) {
                const refreshed = await tryRefreshToken(client, refreshToken);
                if (refreshed && refreshed.accessToken) {
                    setTokens(refreshed.accessToken, refreshed.refreshToken, Date.now() + (ageInSeconds * 1000), refreshExpiresAt);
                    authHeaders = refreshed.accessToken ? { Authorization: `Bearer ${refreshed.accessToken}` } : {};
                    response = await requestFn(authHeaders);
                    if(response.status==403){
                        redirectToLogin(client);
                        return new Response("Unauthorized", { status: 401 });
                    }
                }
            } else {
                redirectToLogin(client);
                return new Response("Unauthorized", { status: 401 });
            }
        }
        return response;
    };
}

function redirectToLogin(client: HttpClient) {

    const loginUrl = client.getLoginURL();
    if (loginUrl) {
        logout(loginUrl);
    }
}

async function tryRefreshToken(client: HttpClient, refreshToken: string | null) {

    const refreshUrl = client.getRefreshTokenURL();
    if (!refreshUrl || !refreshToken) return null;
    const response = await fetch(refreshUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
    });
    if (response.ok) {
        const data = await response.json();
        return { accessToken: data.accessToken, refreshToken: data.refreshToken };
    } else {
        return null;
    }
}


