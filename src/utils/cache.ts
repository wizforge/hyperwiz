import { CacheStorage, CachedResponse, CacheKeyGenerator } from '../types/index';

// Result type for cache operations
export interface CacheResult {
  hit: boolean;
  data?: CachedResponse;
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

// Validate cached response structure
export function isValidCachedResponse(cached: unknown): cached is CachedResponse {
  if (!cached || typeof cached !== 'object') {
    return false;
  }
  
  const response = cached as CachedResponse;
  
  // Check required fields
  if (typeof response.data === 'undefined' ||
      typeof response.status !== 'number' ||
      typeof response.statusText !== 'string' ||
      typeof response.timestamp !== 'number' ||
      typeof response.url !== 'string' ||
      typeof response.method !== 'string') {
    return false;
  }
  
  // Validate status code
  if (response.status < 100 || response.status > 599) {
    return false;
  }
  
  // Validate timestamp
  if (response.timestamp <= 0 || response.timestamp > Date.now() + 86400000) { // Max 1 day in future
    return false;
  }
  
  // Validate URL
  try {
    new URL(response.url);
  } catch {
    return false;
  }
  
  // Validate method
  const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
  if (!validMethods.includes(response.method.toUpperCase())) {
    return false;
  }
  
  return true;
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
      const m = method.toUpperCase();
      let key: string;
      
      if (includeQueryParams) {
        try {
          if (url.startsWith('http')) {
            const urlObj = new URL(url);
            const params = Array.from(urlObj.searchParams.entries())
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([k, v]) => `${k}=${v}`)
              .join('&');
            key = `${m}:${urlObj.pathname}${params ? `?${params}` : ''}`;
          } else {
            const [pathname, queryString] = url.split('?');
            if (queryString) {
              const params = new URLSearchParams(queryString);
              const sortedParams = Array.from(params.entries())
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([k, v]) => `${k}=${v}`)
                .join('&');
              key = `${m}:${pathname}?${sortedParams}`;
            } else {
              key = `${m}:${pathname}`;
            }
          }
        } catch {
          key = `${m}:${url}`;
        }
      } else {
        try {
          if (url.startsWith('http')) {
            const urlObj = new URL(url);
            key = `${m}:${urlObj.pathname}`;
          } else {
            key = `${m}:${url.split('?')[0] || url}`;
          }
        } catch {
          key = `${m}:${url.split('?')[0] || url}`;
        }
      }
      
      if (body && m !== 'GET') {
        try {
          key += `:${JSON.stringify(body)}`;
        } catch {
          key += `:${String(body)}`;
        }
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
      
      if (!isValidCachedResponse(cached)) {
        this.cache.delete(key);
        this.missCount++;
        return null;
      }
      
      // Simple LRU optimization
      if (this.cache.size > 1) {
        const keys = Array.from(this.cache.keys());
        const lastKey = keys[keys.length - 1];
        if (key !== lastKey) {
          this.cache.delete(key);
          this.cache.set(key, cached);
        }
      }
      
      this.hitCount++;
      return cached;
    } catch {
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
    // Check if IndexedDB is available
    if (typeof window === 'undefined' || !window.indexedDB) {
      throw new Error('IndexedDB is not available in this environment');
    }
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
            // Validate cached response structure with enhanced validation
            if (!isValidCachedResponse(cached)) {
              // Remove invalid cache entry
              this.delete(key).catch(() => {}); // Ignore deletion errors
              console.warn('Removed invalid IndexedDB cache entry:', key);
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