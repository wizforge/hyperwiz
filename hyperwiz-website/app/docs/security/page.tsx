import { Shield, Lock, Cookie, AlertTriangle, CheckCircle, ArrowRight, Key } from 'lucide-react'
import CodeSnippet from '../../../components/CodeSnippet'

const securityFeatures = [
  {
    title: 'AES-256-GCM Encryption',
    description: 'Strong encryption for all stored tokens using AES-256-GCM with PBKDF2 key derivation.',
    icon: Lock,
    color: 'blue',
    details: [
      'AES-256-GCM encryption algorithm',
      'PBKDF2 key derivation (600k iterations)',
      'Random IV generation for each token',
      'Memory protection with automatic cleanup'
    ]
  },
  {
    title: 'Secret Key Management',
    description: 'Developer-provided secret keys with minimum 32-character requirement.',
    icon: Key,
    color: 'green',
    details: [
      'Minimum 32 characters for AES-256',
      'No hardcoded keys in the library',
      'Environment variable integration',
      'Global secret key configuration'
    ]
  },
  {
    title: 'Browser-Focused Security',
    description: 'Optimized for browser environments with localStorage encryption and Web Crypto API.',
    icon: Cookie,
    color: 'purple',
    details: [
      'Encrypted localStorage storage',
      'Web Crypto API integration',
      'Same-origin policy protection',
      'Automatic token expiration'
    ]
  }
]

const securityBestPractices = [
  {
    title: 'Use strong secret keys',
    description: 'Generate cryptographically secure random keys (minimum 32 characters).',
    icon: CheckCircle,
    color: 'green'
  },
  {
    title: 'Store keys securely',
    description: 'Use environment variables or secure key management systems.',
    icon: CheckCircle,
    color: 'blue'
  },
  {
    title: 'Handle authentication failures',
    description: 'Implement proper error handling for session expiration and token issues.',
    icon: CheckCircle,
    color: 'purple'
  },
  {
    title: 'Use HTTPS in production',
    description: 'Always use HTTPS to protect token transmission and storage.',
    icon: CheckCircle,
    color: 'orange'
  }
]

export default function Security() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-gray-900/50 to-orange-950/20">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-orange-500/10 rounded-full">
              <Shield className="h-8 w-8 text-orange-400" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
            Security
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            <span className="font-bold text-blue-400">HyperWiz</span> uses strong encryption and security best practices. 
            Learn about our security features and best practices for protecting your browser-based applications.
          </p>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6 md:space-y-8">
            {securityFeatures.map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.title} className="card group hover:scale-105 transition-all duration-300 p-6">
                  <div className="flex items-start gap-4 mb-6">
                    <div className={`p-3 bg-${feature.color}-500/10 rounded-lg`}>
                      <Icon className={`h-5 w-5 md:h-6 md:w-6 text-${feature.color}-400`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg md:text-xl font-semibold mb-2 text-blue-400">
                        {feature.title}
                      </h3>
                      <p className="text-gray-300 mb-4 text-sm md:text-base">
                        {feature.description}
                      </p>
                      <ul className="space-y-2">
                        {feature.details.map((detail, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm text-gray-300">
                            <CheckCircle className="h-4 w-4 text-green-400" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
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
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 md:mb-8 text-center">Security Best Practices</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {securityBestPractices.map((practice) => {
              const Icon = practice.icon
              return (
                <div key={practice.title} className="card group hover:scale-105 transition-all duration-300 p-6">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 bg-${practice.color}-500/10 rounded-lg`}>
                      <Icon className={`h-5 w-5 text-${practice.color}-400`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2 text-blue-400">
                        {practice.title}
                      </h3>
                      <p className="text-gray-300 text-sm">
                        {practice.description}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Configuration Example */}
      <section className="py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 md:mb-8 text-center">Secure Configuration Example</h2>
                      <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                <span className="text-sm text-gray-400">Production-ready configuration with encryption</span>
              </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <CodeSnippet 
                title="TypeScript"
                language="typescript"
                code={`import { createClient, setGlobalSecretKey, setTokens, TokenAge } from 'hyperwiz';

// Get secret key from environment variable
const secretKey = process.env.HYPERWIZ_SECRET_KEY || 
  'your-fallback-secret-key-at-least-32-chars-long';

// Set global secret key
setGlobalSecretKey(secretKey);

// Production-ready client configuration
const client = createClient('https://api.example.com', {
  loginUrl: '/login',
  refreshTokenUrl: '/auth/refresh'
});

// Store tokens with encryption and expiration
await setTokens(
  'access-token', 
  secretKey, 
  'refresh-token', 
  TokenAge.hours(1),    // 1 hour for access tokens
  TokenAge.days(7)      // 7 days for refresh tokens
);`}
              />
              
              <CodeSnippet 
                title="JavaScript"
                language="javascript"
                code={`import { createClient, setGlobalSecretKey, setTokens, TokenAge } from 'hyperwiz';

// Get secret key from environment variable
const secretKey = process.env.HYPERWIZ_SECRET_KEY || 
  'your-fallback-secret-key-at-least-32-chars-long';

// Set global secret key
setGlobalSecretKey(secretKey);

// Production-ready client configuration
const client = createClient('https://api.example.com', {
  loginUrl: '/login',
  refreshTokenUrl: '/auth/refresh'
});

// Store tokens with encryption and expiration
await setTokens(
  'access-token', 
  secretKey, 
  'refresh-token', 
  TokenAge.hours(1),    // 1 hour for access tokens
  TokenAge.days(7)      // 7 days for refresh tokens
);`}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Secret Key Generation */}
      <section className="py-12 md:py-16 bg-gray-900/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 md:mb-8 text-center">Generating Secure Secret Keys</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-3 text-blue-400">Node.js</h3>
              <CodeSnippet 
                title="Node.js Key Generation"
                language="javascript"
                code={`// Generate a secure secret key
const crypto = require('crypto');
const secretKey = crypto.randomBytes(32).toString('hex');
console.log(secretKey);`}
              />
            </div>
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-3 text-blue-400">Browser</h3>
              <CodeSnippet 
                title="Browser Key Generation"
                language="javascript"
                code={`// Generate a secure secret key
const secretKey = Array.from(
  crypto.getRandomValues(new Uint8Array(32))
).map(b => b.toString(16).padStart(2, '0')).join('');
console.log(secretKey);`}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Next Steps */}
      <section className="py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold mb-4 md:mb-6">Ready to implement?</h2>
          <p className="text-gray-300 mb-6 md:mb-8 max-w-2xl mx-auto">
            Now that you understand the security features, start building secure applications with HyperWiz.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
            <a 
              href="/docs/examples" 
              className="btn btn-primary text-base md:text-lg px-6 md:px-8 py-3"
            >
              View Examples
              <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
            </a>
            <a 
              href="/docs/api" 
              className="btn btn-outline text-base md:text-lg px-6 md:px-8 py-3"
            >
              API Reference
            </a>
          </div>
        </div>
      </section>
    </div>
  )
} 