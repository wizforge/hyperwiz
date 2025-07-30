// retry-logging.test.ts
// Integration test for retry and logging features of hyperwiz
// Run with: ts-node test/retry-logging.test.ts or add to your test runner

import { createClient } from 'hyperwiz';

async function main() {
  // Use a non-existent endpoint to force retries and logging
  const api = createClient('https://httpbin.org', {
    retry: {
      maxRetries: 2,           // Try 2 times after the first failure
      retryDelay: 500,         // 0.5s initial delay
      maxDelay: 2000,          // 2s max delay
      backoffMultiplier: 2,    // Exponential backoff
      retryOnStatus: [404, 500, 502, 503, 504], // Retry on 404 and server errors
      retryOnNetworkError: true
    },
    logging: true
  });

  console.log('--- Starting retry/logging test ---');
  try {
    // This endpoint does not exist, should trigger retries
    const response = await api.get('/status/404');
    if (response.success) {
      console.log('Unexpected success:', response.data);
    } else {
      console.log('Final error after retries:', response.error, 'Status:', response.status);
    }
  } catch (err) {
    console.error('Test threw an error:', err);
  }
  console.log('--- Test complete ---');
}

main();
