import { HttpClient } from "../core/HttpClient";

export async function tryRefreshToken(client: HttpClient, refreshToken: string | null) {
    const refreshUrl = client.getRefreshTokenURL();
    if (!refreshUrl || !refreshToken) return null;
    
    try {
        const response = await fetch(refreshUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
        });
        
        if (response.ok) {
            const data = await response.json();
            // Ensure the response contains the expected tokens
            if (data.accessToken) {
                return { 
                    accessToken: data.accessToken, 
                    refreshToken: data.refreshToken || refreshToken // fallback to existing if not provided
                };
            }
        }
        return null;
    } catch (error) {
        console.error('Error refreshing token:', error);
        return null;
    }
}
