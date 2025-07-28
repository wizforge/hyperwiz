import Link from 'next/link'
import { BookOpen, Code, Shield, Zap, ArrowRight } from 'lucide-react'

const docSections = [
  {
    title: 'Installation',
    description: 'Get started with hyperwiz in your project',
    href: '/docs/installation',
    icon: Zap,
    color: 'blue'
  },
  {
    title: 'API Reference',
    description: 'Complete API documentation and examples',
    href: '/docs/api',
    icon: Code,
    color: 'purple'
  },
  {
    title: 'Examples',
    description: 'Real-world examples and use cases',
    href: '/docs/examples',
    icon: BookOpen,
    color: 'green'
  },
  {
    title: 'Security',
    description: 'Security features and best practices',
    href: '/docs/security',
    icon: Shield,
    color: 'orange'
  }
]

export default function DocsHome() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-gray-900/50 to-blue-950/20">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
            Documentation
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Learn how to use <span className="font-bold text-blue-400">hyperwiz</span> for secure, 
            modern API requests in TypeScript. Everything you need to build powerful applications.
          </p>
        </div>
      </section>

      {/* Documentation Sections */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {docSections.map((section) => {
              const Icon = section.icon
              return (
                <Link
                  key={section.title}
                  href={section.href}
                  className="card group hover:scale-105 transition-all duration-300 hover:shadow-xl"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 bg-${section.color}-500/10 rounded-lg group-hover:bg-${section.color}-500/20 transition-colors`}>
                      <Icon className={`h-6 w-6 text-${section.color}-400`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-400 transition-colors">
                        {section.title}
                      </h3>
                      <p className="text-gray-300 mb-4">
                        {section.description}
                      </p>
                      <div className="flex items-center text-blue-400 group-hover:text-blue-300 transition-colors">
                        <span className="text-sm font-medium">Learn more</span>
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-16 bg-gray-900/30">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-8 text-center">Quick Links</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link 
              href="/docs/examples"
              className="flex items-center gap-3 p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
            >
              <span className="text-lg">💡</span>
              <span className="font-medium">Examples</span>
            </Link>
            <a 
              href="https://www.npmjs.com/package/hyperwiz" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
            >
              <span className="text-lg">📚</span>
              <span className="font-medium">npm Package</span>
            </a>
            <a 
              href="https://wizforge.dev/hyperwiz" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
            >
              <span className="text-lg">🌐</span>
              <span className="font-medium">Homepage</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  )
} 