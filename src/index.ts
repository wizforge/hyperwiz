/*
  Copyright 2025 Parth Tyagi

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

export { 
  createClient, 
  createPublicClient
} from './utils/createClient';
export type { ClientConfig } from './utils/createClient';

export type { 
  RequestConfig, 
  RequestHandler, 
  ResponseHandler, 
  ErrorHandler, 
  Interceptors,
  RetryConfig,
  RetryConfigOption,
  CacheConfig,
  CacheConfigOption,
  CacheStorage,
  CachedResponse,
  CacheKeyGenerator,
  // Legacy types for backward compatibility
  RequestInterceptor, 
  ResponseInterceptor, 
  ErrorInterceptor 
} from './types/index';

// Export ApiResponse type for TypeScript users
export type ApiResponse<T> = 
  | { success: true; data: T }
  | { success: false; status?: number; error: string };