import { CacheStorage, CachedResponse, CacheKeyGenerator } from '../types/index';

// Custom error for cache hits
export class CacheHitError extends Error {
  constructor(public cachedResponse: CachedResponse) {
    super('Cache hit');
    this.name = 'CacheHitError';
  }
}

// Check if request is cacheable
export function isCacheableRequest(method: string, cacheableMethods: string[]): boolean {
  const upperMethod = method.toUpperCase();
  return cacheableMethods.some(m => m.toUpperCase() === upperMethod);
}

// Check if response is cacheable
export function isCacheableResponse(status: number, cacheableStatusCodes: number[]): boolean {
  return cacheableStatusCodes.includes(status);
}

// Check if cached response is expired
export function isExpired(cached: CachedResponse, maxAge: number): boolean {
  // Add safety check for invalid timestamps
  if (!cached.timestamp || isNaN(cached.timestamp)) {
    return true; // Consider invalid timestamps as expired
  }
  return Date.now() - cached.timestamp > maxAge;
}

// Create cache key generator
export function createCacheKeyGenerator(includeQueryParams: boolean): CacheKeyGenerator {
  return {
    generate(method: string, url: string, body?: unknown): string {
      let key: string;
      
      if (includeQueryParams) {
        // Include query parameters in the key - normalize the URL first
        try {
          if (url.startsWith('http')) {
            const urlObj = new URL(url);
            // Sort query parameters for consistent keys
            const params = Array.from(urlObj.searchParams.entries())
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([k, v]) => `${k}=${v}`)
              .join('&');
            key = `${method.toUpperCase()}:${urlObj.pathname}${params ? `?${params}` : ''}`;
          } else {
            // For relative URLs, parse and normalize query params
            const [pathname, queryString] = url.split('?');
            if (queryString) {
              const params = new URLSearchParams(queryString);
              const sortedParams = Array.from(params.entries())
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([k, v]) => `${k}=${v}`)
                .join('&');
              key = `${method.toUpperCase()}:${pathname}?${sortedParams}`;
            } else {
              key = `${method.toUpperCase()}:${pathname}`;
            }
          }
        } catch (error) {
          // Fallback: use the original URL if parsing fails
          key = `${method.toUpperCase()}:${url}`;
        }
      } else {
        // Remove query parameters
        try {
          if (url.startsWith('http')) {
            const urlObj = new URL(url);
            key = `${method.toUpperCase()}:${urlObj.pathname}`;
          } else {
            // For relative URLs, remove query params manually
            const pathname = url.split('?')[0] || url;
            key = `${method.toUpperCase()}:${pathname}`;
          }
        } catch (error) {
          // Fallback: use the original URL without query params
          const pathname = url.split('?')[0] || url;
          key = `${method.toUpperCase()}:${pathname}`;
        }
      }
      
      // Include body hash for non-GET requests
      if (body && method.toUpperCase() !== 'GET') {
        try {
          const bodyHash = JSON.stringify(body);
          key += `:${bodyHash}`;
        } catch (error) {
          // Fallback: use string representation if JSON.stringify fails
          key += `:${String(body)}`;
        }
      }
      
      // Add debug logging for cache key generation
      if (process.env.NODE_ENV === 'development') {
        console.debug(`🔑 Generated cache key: ${key} for ${method} ${url}`);
      }
      
      return key;
    }
  };
}

// In-Memory Cache Storage with proper LRU implementation
export class MemoryCacheStorage implements CacheStorage {
  private cache = new Map<string, CachedResponse>();
  private maxSize: number;
  private hitCount = 0;
  private missCount = 0;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  async get(key: string): Promise<CachedResponse | null> {
    try {
      const cached = this.cache.get(key);
      if (!cached) {
        this.missCount++;
        return null;
      }
      
      // Validate cached response structure
      if (!cached.data || typeof cached.timestamp !== 'number') {
        this.cache.delete(key); // Remove invalid cache entry
        this.missCount++;
        return null;
      }
      
      // Optimize LRU: only move to end if cache has more than 1 item
      if (this.cache.size > 1) {
        const keys = Array.from(this.cache.keys());
        const lastKey = keys[keys.length - 1];
        if (key !== lastKey) {
          this.cache.delete(key);
          this.cache.set(key, cached);
        }
      }
      
      this.hitCount++;
      
      // Add debug logging
      if (process.env.NODE_ENV === 'development') {
        console.debug(`💾 Cache hit for key: ${key} (hit rate: ${this.getHitRate()}%)`);
      }
      
      return cached;
    } catch (error) {
      console.warn('Error reading from memory cache:', error);
      this.missCount++;
      return null;
    }
  }

  async set(key: string, value: CachedResponse): Promise<void> {
    // Remove if exists (to move to end)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    
    // Implement LRU eviction - remove oldest items if at capacity
    while (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      } else {
        break; // Safety break
      }
    }
    
    // Add the new item (this makes it the most recently used)
    this.cache.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async keys(): Promise<string[]> {
    return Array.from(this.cache.keys());
  }

  // Get cache hit rate for monitoring
  getHitRate(): number {
    const total = this.hitCount + this.missCount;
    return total > 0 ? Math.round((this.hitCount / total) * 100) : 0;
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: this.getHitRate()
    };
  }
}

// IndexedDB Cache Storage
export class IndexedDBCacheStorage implements CacheStorage {
  private dbName = 'hyperwiz-cache';
  private storeName = 'responses';
  private version = 1;

  constructor() {
    this.initDB();
  }

  private async initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };
    });
  }

  async get(key: string): Promise<CachedResponse | null> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(key);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          try {
            const result = request.result;
            if (!result) {
              resolve(null);
              return;
            }
            
            const cached = result.value;
            // Validate cached response structure
            if (!cached || !cached.data || typeof cached.timestamp !== 'number') {
              // Remove invalid cache entry
              this.delete(key).catch(() => {}); // Ignore deletion errors
              resolve(null);
              return;
            }
            
            resolve(cached);
          } catch (error) {
            console.warn('Error parsing cached response:', error);
            resolve(null);
          }
        };
      });
    } catch (error) {
      console.warn('IndexedDB not available, falling back to memory cache:', error);
      return null;
    }
  }

  async set(key: string, value: CachedResponse): Promise<void> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.put({ key, value });
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.warn('IndexedDB not available, falling back to memory cache:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(key);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.warn('IndexedDB not available:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.clear();
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.warn('IndexedDB not available:', error);
    }
  }

  async keys(): Promise<string[]> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.getAllKeys();
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const keys = request.result as string[];
          resolve(keys);
        };
      });
    } catch (error) {
      console.warn('IndexedDB not available:', error);
      return [];
    }
  }
}

// Create cache storage based on type
export function createCacheStorage(type: 'memory' | 'indexeddb', maxSize: number = 100): CacheStorage {
  switch (type) {
    case 'indexeddb':
      return new IndexedDBCacheStorage();
    case 'memory':
    default:
      return new MemoryCacheStorage(maxSize);
  }
} 