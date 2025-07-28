import { BookOpen, Code, Zap, Shield, ArrowRight } from 'lucide-react'
import CodeSnippet from '../../../components/CodeSnippet'

const examples = [
  {
    title: 'Complete Setup Example',
    description: 'Get started with HyperWiz in your project with secure token management.',
    icon: Zap,
    color: 'blue',
    typescriptCode: `import { 
  createClient, 
  createAuthMiddleware, 
  setGlobalSecretKey, 
  setTokens, 
  TokenAge 
} from 'hyperwiz';

// 1. Setup
const client = createClient('https://api.example.com', {
  loginUrl: '/login',
  refreshTokenUrl: '/auth/refresh'
});

setGlobalSecretKey('your-super-secret-key-at-least-32-chars-long');
const withAuth = createAuthMiddleware(client, 'your-secret-key');

// 2. Login and store tokens
async function login(email: string, password: string) {
  const response = await client.post('/auth/login', { email, password });
  
  if (response.success) {
    await setTokens(
      response.data.accessToken,
      'your-secret-key',
      response.data.refreshToken,
      TokenAge.hours(1),
      TokenAge.days(7)
    );
    return response.data;
  }
  
  throw new Error(response.error);
}

// 3. Make authenticated requests with proper types
interface UserProfile {
  id: string;
  name: string;
  email: string;
}

async function getUserProfile() {
  return await withAuth((headers) => client.get<UserProfile>('/user/profile', headers));
}

// 4. Usage
async function main() {
  try {
    await login('user@example.com', 'password123');
    const profile = await getUserProfile();
    
    if (profile.success) {
      console.log('Profile:', profile.data);
    } else {
      console.error('Failed:', profile.error);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}`,
    javascriptCode: `import { 
  createClient, 
  createAuthMiddleware, 
  setGlobalSecretKey, 
  setTokens, 
  TokenAge 
} from 'hyperwiz';

// 1. Setup
const client = createClient('https://api.example.com', {
  loginUrl: '/login',
  refreshTokenUrl: '/auth/refresh'
});

setGlobalSecretKey('your-super-secret-key-at-least-32-chars-long');
const withAuth = createAuthMiddleware(client, 'your-secret-key');

// 2. Login and store tokens
async function login(email, password) {
  const response = await client.post('/auth/login', { email, password });
  
  if (response.success) {
    await setTokens(
      response.data.accessToken,
      'your-secret-key',
      response.data.refreshToken,
      TokenAge.hours(1),
      TokenAge.days(7)
    );
    return response.data;
  }
  
  throw new Error(response.error);
}

// 3. Make authenticated requests
async function getUserProfile() {
  return await withAuth((headers) => client.get('/user/profile', headers));
}

// 4. Usage
async function main() {
  try {
    await login('user@example.com', 'password123');
    const profile = await getUserProfile();
    
    if (profile.success) {
      console.log('Profile:', profile.data);
    } else {
      console.error('Failed:', profile.error);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}`
  },
  {
    title: 'Individual Token Management',
    description: 'Store access and refresh tokens separately with custom expiration times.',
    icon: Shield,
    color: 'green',
    typescriptCode: `import { setAccessToken, setRefreshToken, TokenAge } from 'hyperwiz';

const secretKey = 'your-super-secret-key-at-least-32-chars-long';

// Set access token to expire in 1 hour
await setAccessToken('access-token', secretKey, TokenAge.hours(1));

// Set refresh token to expire in 7 days
await setRefreshToken('refresh-token', secretKey, TokenAge.days(7));

// Or use other time units
await setAccessToken('access-token', secretKey, TokenAge.minutes(30));  // 30 minutes
await setRefreshToken('refresh-token', secretKey, TokenAge.weeks(2));   // 2 weeks

// Convenience methods
await setAccessToken('access-token', secretKey, TokenAge.day());        // 1 day
await setRefreshToken('refresh-token', secretKey, TokenAge.week());     // 1 week`,
    javascriptCode: `import { setAccessToken, setRefreshToken, TokenAge } from 'hyperwiz';

const secretKey = 'your-super-secret-key-at-least-32-chars-long';

// Set access token to expire in 1 hour
await setAccessToken('access-token', secretKey, TokenAge.hours(1));

// Set refresh token to expire in 7 days
await setRefreshToken('refresh-token', secretKey, TokenAge.days(7));

// Or use other time units
await setAccessToken('access-token', secretKey, TokenAge.minutes(30));  // 30 minutes
await setRefreshToken('refresh-token', secretKey, TokenAge.weeks(2));   // 2 weeks

// Convenience methods
await setAccessToken('access-token', secretKey, TokenAge.day());        // 1 day
await setRefreshToken('refresh-token', secretKey, TokenAge.week());     // 1 week`
  },
  {
    title: 'HTTP Client Methods',
    description: 'Learn how to make different types of HTTP requests with HyperWiz.',
    icon: Code,
    color: 'purple',
    typescriptCode: `// GET request
const users = await client.get('/users');

// POST request with data
const newUser = await client.post('/users', {
  name: 'Alice',
  email: 'alice@example.com'
});

// PUT request to update
const updatedUser = await client.put('/users/123', {
  name: 'Alice Updated'
});

// PATCH request
const patchedUser = await client.patch('/users/123', {
  name: 'Alice Updated'
});

// DELETE request
const deleted = await client.delete('/users/123');

// All methods return ApiResponse<T> format
if (users.success) {
  console.log('Users:', users.data);
} else {
  console.error('Error:', users.error);
}`,
    javascriptCode: `// GET request
const users = await client.get('/users');

// POST request with data
const newUser = await client.post('/users', {
  name: 'Alice',
  email: 'alice@example.com'
});

// PUT request to update
const updatedUser = await client.put('/users/123', {
  name: 'Alice Updated'
});

// PATCH request
const patchedUser = await client.patch('/users/123', {
  name: 'Alice Updated'
});

// DELETE request
const deleted = await client.delete('/users/123');

// All methods return ApiResponse format
if (users.success) {
  console.log('Users:', users.data);
} else {
  console.error('Error:', users.error);
}`
  },
  {
    title: 'Error Handling',
    description: 'Handle errors gracefully with structured responses and authentication failures.',
    icon: Shield,
    color: 'orange',
    typescriptCode: `// Define types for better type safety
interface UserProfile {
  id: string;
  name: string;
  email: string;
}

// Handle HTTP errors (403, 404, etc.)
const result = await withAuth((headers) => client.get<UserProfile>('/user/profile', headers));

if (result.success) {
  console.log('User data:', result.data); // TypeScript knows this is UserProfile
} else {
  console.error('Request failed:', result.error); // TypeScript knows this is string
  // Handle HTTP errors
}

// Handle authentication failures
try {
  const result = await withAuth((headers) => client.get<UserProfile>('/user/profile', headers));
} catch (error) {
  // Handle authentication failures (session expired, etc.)
  console.error('Auth failed:', error.message);
  // Redirect to login or show error message
}

// Handle token management errors
try {
  await setTokens('token', 'secret-key', 'refresh-token');
} catch (error) {
  console.error('Token storage failed:', error.message);
}`,
    javascriptCode: `// Handle HTTP errors (403, 404, etc.)
const result = await withAuth((headers) => client.get('/user/profile', headers));

if (result.success) {
  console.log('User data:', result.data);
} else {
  console.error('Request failed:', result.error);
  // Handle HTTP errors
}

// Handle authentication failures
try {
  const result = await withAuth((headers) => client.get('/user/profile', headers));
} catch (error) {
  // Handle authentication failures (session expired, etc.)
  console.error('Auth failed:', error.message);
  // Redirect to login or show error message
}

// Handle token management errors
try {
  await setTokens('token', 'secret-key', 'refresh-token');
} catch (error) {
  console.error('Token storage failed:', error.message);
}`
  }
]

export default function Examples() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-gray-900/50 to-green-950/20">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-green-500/10 rounded-full">
              <BookOpen className="h-8 w-8 text-green-400" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
            Examples
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Real-world examples and use cases for <span className="font-bold text-blue-400">HyperWiz</span>. 
            Learn how to implement common patterns and best practices with secure token management.
          </p>
        </div>
      </section>

      {/* Examples */}
      <section className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8 md:space-y-12">
            {examples.map((example) => {
              const Icon = example.icon
              return (
                <div key={example.title} className="card group hover:scale-105 transition-all duration-300 p-6">
                  <div className="flex items-start gap-4 mb-6">
                    <div className={`p-3 bg-${example.color}-500/10 rounded-lg`}>
                      <Icon className={`h-5 w-5 md:h-6 md:w-6 text-${example.color}-400`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg md:text-xl font-semibold mb-2 text-blue-400">
                        {example.title}
                      </h3>
                      <p className="text-gray-300 text-sm md:text-base">
                        {example.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <CodeSnippet 
                      title="TypeScript"
                      language="typescript"
                      code={example.typescriptCode}
                    />
                    <CodeSnippet 
                      title="JavaScript"
                      language="javascript"
                      code={example.javascriptCode}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Best Practices */}
      <section className="py-12 md:py-16 bg-gray-900/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 md:mb-8 text-center">Best Practices</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-3 text-blue-400">Security</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Use secret keys with minimum 32 characters</li>
                <li>• Store secret keys in environment variables</li>
                <li>• Use HTTPS in production</li>
                <li>• Handle authentication failures gracefully</li>
              </ul>
            </div>
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-3 text-blue-400">Best Practices</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Set appropriate token expiration times</li>
                <li>• Use structured error handling</li>
                <li>• Implement proper logout functionality</li>
                <li>• Test authentication flows thoroughly</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Next Steps */}
      <section className="py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold mb-4 md:mb-6">Ready to build?</h2>
          <p className="text-gray-300 mb-6 md:mb-8 max-w-2xl mx-auto">
            Now that you've seen the examples, start building your application with HyperWiz.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
            <a 
              href="/docs/api" 
              className="btn btn-primary text-base md:text-lg px-6 md:px-8 py-3"
            >
              View API Reference
              <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
            </a>
            <a 
              href="/docs/security" 
              className="btn btn-outline text-base md:text-lg px-6 md:px-8 py-3"
            >
              Learn About Security
            </a>
          </div>
        </div>
      </section>
    </div>
  )
} 