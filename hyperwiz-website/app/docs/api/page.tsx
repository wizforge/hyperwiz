import { Code, Settings, Key, RefreshCw, Clock } from 'lucide-react'
import CodeSnippet from '../../../components/CodeSnippet'

const apiMethods = [
  {
    name: 'createClient(baseUrl, config?)',
    description: 'Creates an HTTP client instance with optional configuration.',
    icon: Settings,
    color: 'blue',
    typescriptCode: `const client = createClient('https://api.example.com', {
  loginUrl: '/login',
  refreshTokenUrl: '/auth/refresh'
});`,
    javascriptCode: `const client = createClient('https://api.example.com', {
  loginUrl: '/login',
  refreshTokenUrl: '/auth/refresh'
});`
  },
  {
    name: 'setGlobalSecretKey(secretKey)',
    description: 'Sets the global secret key for token encryption/decryption (minimum 32 characters).',
    icon: Key,
    color: 'green',
    typescriptCode: `setGlobalSecretKey('your-super-secret-key-at-least-32-chars-long');`,
    javascriptCode: `setGlobalSecretKey('your-super-secret-key-at-least-32-chars-long');`
  },
  {
    name: 'setTokens(accessToken, secretKey, refreshToken?, accessAge?, refreshAge?)',
    description: 'Stores both access and refresh tokens with expiration times.',
    icon: Key,
    color: 'purple',
    typescriptCode: `await setTokens(
  'access-token',
  'secret-key',
  'refresh-token',
  TokenAge.hours(1),    // 1 hour
  TokenAge.days(7)      // 7 days
);`,
    javascriptCode: `await setTokens(
  'access-token',
  'secret-key',
  'refresh-token',
  TokenAge.hours(1),    // 1 hour
  TokenAge.days(7)      // 7 days
);`
  },
  {
    name: 'setAccessToken(token, secretKey, ageInSeconds?)',
    description: 'Stores only the access token with encryption and optional expiration.',
    icon: Key,
    color: 'orange',
    typescriptCode: `await setAccessToken('access-token', 'secret-key', TokenAge.hours(1));`,
    javascriptCode: `await setAccessToken('access-token', 'secret-key', TokenAge.hours(1));`
  },
  {
    name: 'setRefreshToken(token, secretKey, ageInSeconds?)',
    description: 'Stores only the refresh token with encryption and optional expiration.',
    icon: Key,
    color: 'cyan',
    typescriptCode: `await setRefreshToken('refresh-token', 'secret-key', TokenAge.days(7));`,
    javascriptCode: `await setRefreshToken('refresh-token', 'secret-key', TokenAge.days(7));`
  },
  {
    name: 'createAuthMiddleware(client, secretKey?)',
    description: 'Creates authentication middleware that handles token refresh automatically.',
    icon: RefreshCw,
    color: 'purple',
    typescriptCode: `// Define your data types
interface UserProfile {
  id: string;
  name: string;
  email: string;
}

const withAuth = createAuthMiddleware(client, 'your-secret-key');

// Type-safe request with proper error handling
const result = await withAuth((headers) => client.get<UserProfile>('/user/profile', headers));

if (result.success) {
  console.log('User data:', result.data); // TypeScript knows this is UserProfile
} else {
  console.error('Error:', result.error); // TypeScript knows this is string
}`,
    javascriptCode: `const withAuth = createAuthMiddleware(client, 'your-secret-key');

const result = await withAuth((headers) => client.get('/user/profile', headers));

if (result.success) {
  console.log('User data:', result.data);
} else {
  console.error('Error:', result.error);
}`
  },
  {
    name: 'TokenAge',
    description: 'Convenient time duration helpers for token expiration.',
    icon: Clock,
    color: 'orange',
    typescriptCode: `// Duration methods
TokenAge.seconds(30)    // 30 seconds
TokenAge.minutes(5)     // 5 minutes
TokenAge.hours(2)       // 2 hours
TokenAge.days(7)        // 7 days
TokenAge.weeks(2)       // 2 weeks
TokenAge.months(1)      // 1 month
TokenAge.years(1)       // 1 year`,
    javascriptCode: `// Duration methods
TokenAge.seconds(30)    // 30 seconds
TokenAge.minutes(5)     // 5 minutes
TokenAge.hours(2)       // 2 hours
TokenAge.days(7)        // 7 days
TokenAge.weeks(2)       // 2 weeks
TokenAge.months(1)      // 1 month
TokenAge.years(1)       // 1 year`
  }
]

export default function APIReference() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-gray-900/50 to-purple-950/20">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-purple-500/10 rounded-full">
              <Code className="h-8 w-8 text-purple-400" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
            API Reference
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Complete API documentation for <span className="font-bold text-blue-400">HyperWiz</span>. 
            Learn about all available methods, configuration options, and usage patterns.
          </p>
        </div>
      </section>

      {/* API Methods */}
      <section className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8 md:space-y-12">
            {apiMethods.map((method) => {
              const Icon = method.icon
              return (
                <div key={method.name} className="card group hover:scale-105 transition-all duration-300 p-6">
                  <div className="flex items-start gap-4 mb-6">
                    <div className={`p-3 bg-${method.color}-500/10 rounded-lg`}>
                      <Icon className={`h-5 w-5 md:h-6 md:w-6 text-${method.color}-400`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg md:text-xl font-semibold mb-2 font-mono text-blue-400">
                        {method.name}
                      </h3>
                      <p className="text-gray-300 text-sm md:text-base">
                        {method.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <CodeSnippet 
                      title="TypeScript"
                      language="typescript"
                      code={method.typescriptCode}
                    />
                    <CodeSnippet 
                      title="JavaScript"
                      language="javascript"
                      code={method.javascriptCode}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Configuration Options */}
      <section className="py-12 md:py-16 bg-gray-900/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 md:mb-8 text-center">Configuration Options</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-3 text-blue-400">Client Configuration</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><code className="text-green-400">loginUrl</code> - Login page URL for redirects</li>
                <li><code className="text-green-400">refreshTokenUrl</code> - Token refresh endpoint</li>
                <li><code className="text-green-400">cookieDomain</code> - Cookie domain (future use)</li>
                <li><code className="text-green-400">cookiePath</code> - Cookie path (future use)</li>
                <li><code className="text-green-400">cookieSecure</code> - Secure cookies (future use)</li>
                <li><code className="text-green-400">cookieSameSite</code> - SameSite policy (future use)</li>
              </ul>
            </div>
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-3 text-blue-400">Security Features</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><code className="text-green-400">secretKey</code> - Minimum 32 characters for AES-256</li>
                <li><code className="text-green-400">AES-256-GCM</code> - Strong encryption algorithm</li>
                <li><code className="text-green-400">PBKDF2</code> - Key derivation with 600k iterations</li>
                <li><code className="text-green-400">localStorage</code> - Encrypted token storage</li>
                <li><code className="text-green-400">Memory Protection</code> - Automatic sensitive data cleanup</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
} 