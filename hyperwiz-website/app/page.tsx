import Link from 'next/link'
import { ArrowRight, Zap, Shield, RefreshCw, Cookie, Code } from 'lucide-react'
import CodeSnippet from '../components/CodeSnippet'
import Logo from '../components/Logo'
import BackgroundElements from '../components/BackgroundElements'

export default function Home() {
  return (
    <div className="min-h-screen relative">
      <BackgroundElements />
      {/* Hero Section */}
      <section className="relative py-12 md:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-purple-950/20 to-cyan-950/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Logo with animation */}
            <div className="flex justify-center mb-6 md:mb-8">
              <div className="animate-scale-in">
                <Logo size="lg" className="animate-float" />
              </div>
            </div>
            
            <div className="mb-4 md:mb-6 flex justify-center gap-2 md:gap-3 animate-fade-in stagger-1">
              <span className="bg-blue-600 text-white px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-semibold animate-glow">v0.0.25</span>
              <span className="bg-green-500 text-gray-900 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-semibold">Stable</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-extrabold mb-4 md:mb-6 gradient-text leading-tight animate-slide-in-up stagger-2">
              Secure HTTP Client
              <br />
              with Built-in Auth
            </h1>
            
            <p className="text-lg md:text-xl text-gray-300 mb-6 md:mb-8 max-w-3xl mx-auto leading-relaxed px-4 animate-fade-in stagger-3">
              A secure, lightweight HTTP client library with built-in authentication, token management, 
              and encryption for modern web applications.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center mb-8 md:mb-12 px-4 animate-slide-in-up stagger-4">
              <Link href="/docs" className="btn btn-primary text-base md:text-lg px-6 md:px-8 py-3">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
              </Link>
              <Link href="/docs/api" className="btn btn-secondary text-base md:text-lg px-6 md:px-8 py-3">
                API Reference
              </Link>
            </div>
            
            {/* Quick Start Code */}
            <div className="max-w-6xl mx-auto px-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CodeSnippet 
                  title="TypeScript"
                  language="typescript"
                  code={`npm install hyperwiz

import { createClient, createAuthMiddleware, setGlobalSecretKey, setTokens, TokenAge } from 'hyperwiz';

// Create HTTP client
const client = createClient('https://api.example.com', {
  loginUrl: '/login',
  refreshTokenUrl: '/auth/refresh'
});

// Set secret key (minimum 32 characters for AES-256)
setGlobalSecretKey('your-super-secret-key-at-least-32-chars-long');

// Store tokens with expiration
await setTokens(
  'access-token',
  'your-secret-key',
  'refresh-token',
  TokenAge.hours(1),    // 1 hour
  TokenAge.days(7)      // 7 days
);

// Create auth middleware
const withAuth = createAuthMiddleware(client, 'your-secret-key');

// Make authenticated request with proper TypeScript types
interface UserProfile {
  id: string;
  name: string;
  email: string;
}

const result = await withAuth((headers) => client.get<UserProfile>('/user/profile', headers));

if (result.success) {
  console.log('User data:', result.data); // result.data is UserProfile
} else {
  console.error('Error:', result.error); // result.error is string
}`}
                />
                
                <CodeSnippet 
                  title="JavaScript"
                  language="javascript"
                  code={`npm install hyperwiz

import { createClient, createAuthMiddleware, setGlobalSecretKey, setTokens, TokenAge } from 'hyperwiz';

// Create HTTP client
const client = createClient('https://api.example.com', {
  loginUrl: '/login',
  refreshTokenUrl: '/auth/refresh'
});

// Set secret key (minimum 32 characters for AES-256)
setGlobalSecretKey('your-super-secret-key-at-least-32-chars-long');

// Store tokens with expiration
await setTokens(
  'access-token',
  'your-secret-key',
  'refresh-token',
  TokenAge.hours(1),    // 1 hour
  TokenAge.days(7)      // 7 days
);

// Create auth middleware
const withAuth = createAuthMiddleware(client, 'your-secret-key');

// Make authenticated request
const result = await withAuth((headers) => client.get('/user/profile', headers));

if (result.success) {
  console.log('User data:', result.data);
} else {
  console.error('Error:', result.error);
}`}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-20 bg-gray-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              Why choose <span className="gradient-text">HyperWiz</span>?
            </h2>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto px-4">
              Built for browser-based web applications with security, performance, and developer experience in mind.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="card group hover:scale-105 transition-transform duration-300 p-6 animate-scale-in stagger-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Zap className="h-5 w-5 md:h-6 md:w-6 text-blue-400" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold">Lightning Fast</h3>
              </div>
              <p className="text-gray-300 text-sm md:text-base">
                Optimized for performance with intelligent caching and minimal overhead for your API requests.
              </p>
            </div>
            
            <div className="card group hover:scale-105 transition-transform duration-300 p-6 animate-scale-in stagger-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Shield className="h-5 w-5 md:h-6 md:w-6 text-green-400" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold">Secure Token Management</h3>
              </div>
              <p className="text-gray-300 text-sm md:text-base">
                AES-256-GCM encrypted token storage with PBKDF2 key derivation and memory protection.
              </p>
            </div>
            
            <div className="card group hover:scale-105 transition-transform duration-300 p-6 animate-scale-in stagger-3">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <RefreshCw className="h-5 w-5 md:h-6 md:w-6 text-purple-400" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold">Auto Refresh</h3>
              </div>
              <p className="text-gray-300 text-sm md:text-base">
                Automatic token refresh with intelligent retry logic and seamless authentication flow.
              </p>
            </div>
            
            <div className="card group hover:scale-105 transition-transform duration-300 p-6 animate-scale-in stagger-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-cyan-500/10 rounded-lg">
                  <Cookie className="h-5 w-5 md:h-6 md:w-6 text-cyan-400" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold">Browser-Focused</h3>
              </div>
              <p className="text-gray-300 text-sm md:text-base">
                Optimized for browser environments with localStorage encryption and Web Crypto API.
              </p>
            </div>
            
            <div className="card group hover:scale-105 transition-transform duration-300 p-6 animate-scale-in stagger-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Code className="h-5 w-5 md:h-6 md:w-6 text-orange-400" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold">TypeScript First</h3>
              </div>
                              <p className="text-gray-300 text-sm md:text-base">
                Full TypeScript support with excellent IntelliSense and type safety throughout.
              </p>
            </div>
            
            <div className="card group hover:scale-105 transition-transform duration-300 p-6 animate-scale-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-pink-500/10 rounded-lg">
                  <Zap className="h-5 w-5 md:h-6 md:w-6 text-pink-400" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold">Error Handling</h3>
              </div>
              <p className="text-gray-300 text-sm md:text-base">
                Comprehensive error handling with structured responses and graceful authentication failures.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 animate-slide-in-up">
            Ready to get started?
          </h2>
          <p className="text-lg md:text-xl text-gray-300 mb-6 md:mb-8 animate-fade-in stagger-1">
            Join thousands of developers using HyperWiz for their API needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
            <Link href="/docs" className="btn btn-primary text-base md:text-lg px-6 md:px-8 py-3">
              Read the Documentation
              <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
            </Link>
            <Link href="/docs/examples" className="btn btn-outline text-base md:text-lg px-6 md:px-8 py-3">
              View Examples
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
