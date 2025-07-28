import { HttpClient } from "../core/HttpClient";

export async function tryRefreshToken(client: HttpClient, refreshToken: string | null) {
    // Input validation
    if (!client) {
        throw new Error('HttpClient instance is required');
    }
    
    if (!refreshToken || typeof refreshToken !== 'string' || refreshToken.trim() === '') {
        throw new Error('Valid refresh token is required');
    }
    
    const refreshUrl = client.getRefreshTokenURL();
    if (!refreshUrl) {
        throw new Error('Refresh token URL not configured in HttpClient');
    }
    
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
            if (data.accessToken && typeof data.accessToken === 'string') {
                return { 
                    accessToken: data.accessToken, 
                    refreshToken: data.refreshToken || refreshToken // fallback to existing if not provided
                };
            } else {
                throw new Error('Invalid response: missing or invalid access token');
            }
        } else {
            throw new Error(`Token refresh failed with status: ${response.status}`);
        }
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error refreshing token:', error.message);
            throw error; // Re-throw to allow caller to handle
        } else {
            const unknownError = new Error('Unknown error during token refresh');
            console.error('Unknown error refreshing token:', error);
            throw unknownError;
        }
    }
}

// Use a hardcoded salt for consistent encryption/decryption
const SALT = "hyperwiz-secure-salt-2025-v1";

export async function encryptToken(token: string, secretKey: string): Promise<string> {
    // Input validation
    if (!token || typeof token !== 'string' || token.trim() === '') {
        throw new Error('Token cannot be empty or null');
    }
    
    if (!secretKey || typeof secretKey !== 'string' || secretKey.trim() === '') {
        throw new Error('Secret key cannot be empty or null');
    }
    
    // Validate secret key strength (minimum 32 characters for AES-256)
    if (secretKey.length < 32) {
        throw new Error('Secret key must be at least 32 characters long for AES-256 encryption');
    }
    
    // Create arrays to store sensitive data
    let iv: Uint8Array | null = null;
    let keyMaterial: CryptoKey | null = null;
    let cryptoKey: CryptoKey | null = null;
    let encrypted: ArrayBuffer | null = null;
    let tokenBytes: Uint8Array | null = null;
    let secretKeyBytes: Uint8Array | null = null;
    
    try {
        const encoder = new TextEncoder();
        
        // Generate random IV and use hardcoded salt
        iv = crypto.getRandomValues(new Uint8Array(12));
        
        // Convert strings to bytes
        secretKeyBytes = encoder.encode(secretKey);
        tokenBytes = encoder.encode(token);
      
        keyMaterial = await crypto.subtle.importKey(
          "raw",
          secretKeyBytes,
          { name: "PBKDF2" },
          false,
          ["deriveKey"]
        );
      
        cryptoKey = await crypto.subtle.deriveKey(
          {
            name: "PBKDF2",
            salt: encoder.encode(SALT),
            iterations: 600000, // Increased to 600k iterations for better security
            hash: "SHA-256",
          },
          keyMaterial,
          { name: "AES-GCM", length: 256 },
          false,
          ["encrypt"]
        );
      
        encrypted = await crypto.subtle.encrypt(
          { name: "AES-GCM", iv },
          cryptoKey,
          tokenBytes
        );
      
        const payload: EncryptedPayload = {
          iv: Array.from(iv),
          data: Array.from(new Uint8Array(encrypted)),
        };
      
        return JSON.stringify(payload);
    } catch (error) {
        if (error instanceof Error) {
            console.error('Encryption error:', error.message);
            throw new Error(`Encryption failed: ${error.message}`);
        } else {
            console.error('Unknown encryption error:', error);
            throw new Error('Encryption failed: Unknown error occurred');
        }
    } finally {
        // Clear sensitive data from memory
        if (iv) {
            iv.fill(0);
            iv = null;
        }
        if (tokenBytes) {
            tokenBytes.fill(0);
            tokenBytes = null;
        }
        if (secretKeyBytes) {
            secretKeyBytes.fill(0);
            secretKeyBytes = null;
        }
        if (encrypted) {
            // Clear the encrypted buffer
            new Uint8Array(encrypted).fill(0);
            encrypted = null;
        }
        // CryptoKey objects are automatically garbage collected
        keyMaterial = null;
        cryptoKey = null;
    }
  }

  
  export interface EncryptedPayload {
    iv: number[];
    data: number[];
  }
  

  
  export async function decryptToken(encryptedJson: string, secretKey: string): Promise<string> {
    // Input validation
    if (!encryptedJson || typeof encryptedJson !== 'string' || encryptedJson.trim() === '') {
        throw new Error('Encrypted JSON cannot be empty or null');
    }
    
    if (!secretKey || typeof secretKey !== 'string' || secretKey.trim() === '') {
        throw new Error('Secret key cannot be empty or null');
    }
    
    // Validate secret key strength
    if (secretKey.length < 32) {
        throw new Error('Secret key must be at least 32 characters long for AES-256 decryption');
    }
    
    // Create arrays to store sensitive data
    let ivArray: Uint8Array | null = null;
    let dataArray: Uint8Array | null = null;
    let keyMaterial: CryptoKey | null = null;
    let cryptoKey: CryptoKey | null = null;
    let decrypted: ArrayBuffer | null = null;
    let secretKeyBytes: Uint8Array | null = null;
    let result: string | null = null;
    
    try {
        // Validate JSON format
        let parsedData: any;
        try {
            parsedData = JSON.parse(encryptedJson);
        } catch (jsonError) {
            throw new Error('Invalid JSON format in encrypted data');
        }
        
        // Validate payload structure
        if (!parsedData || typeof parsedData !== 'object') {
            throw new Error('Invalid encrypted payload structure');
        }
        
        if (!Array.isArray(parsedData.iv) || !Array.isArray(parsedData.data)) {
            throw new Error('Missing required fields in encrypted payload');
        }
        
        // Validate array lengths
        if (parsedData.iv.length !== 12) {
            throw new Error('Invalid IV length (expected 12 bytes)');
        }
        
        const { iv, data }: EncryptedPayload = parsedData;
        
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        
        // Create Uint8Arrays from the parsed data and use hardcoded salt
        ivArray = new Uint8Array(iv);
        dataArray = new Uint8Array(data);
        secretKeyBytes = encoder.encode(secretKey);
      
        keyMaterial = await crypto.subtle.importKey(
          "raw",
          secretKeyBytes,
          { name: "PBKDF2" },
          false,
          ["deriveKey"]
        );
      
        cryptoKey = await crypto.subtle.deriveKey(
          {
            name: "PBKDF2",
            salt: encoder.encode(SALT),
            iterations: 600000, // Increased to 600k iterations for better security
            hash: "SHA-256",
          },
          keyMaterial,
          { name: "AES-GCM", length: 256 },
          false,
          ["decrypt"]
        );
      
        decrypted = await crypto.subtle.decrypt(
          {
            name: "AES-GCM",
            iv: ivArray,
          },
          cryptoKey,
          dataArray
        );
      
        result = decoder.decode(decrypted);
        return result;
    } catch (error) {
        if (error instanceof Error) {
            console.error('Decryption error:', error.message);
            throw new Error(`Decryption failed: ${error.message}`);
        } else {
            console.error('Unknown decryption error:', error);
            throw new Error('Decryption failed: Unknown error occurred');
        }
    } finally {
        // Clear sensitive data from memory
        if (ivArray) {
            ivArray.fill(0);
            ivArray = null;
        }
        if (dataArray) {
            dataArray.fill(0);
            dataArray = null;
        }
        if (secretKeyBytes) {
            secretKeyBytes.fill(0);
            secretKeyBytes = null;
        }
        if (decrypted) {
            // Clear the decrypted buffer
            new Uint8Array(decrypted).fill(0);
            decrypted = null;
        }
        // CryptoKey objects are automatically garbage collected
        keyMaterial = null;
        cryptoKey = null;
        // Note: result string is returned, so we don't clear it
    }
  }
  