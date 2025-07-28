import { Package, Download, CheckCircle } from 'lucide-react'

const packageManagers = [
  {
    name: 'npm',
    command: 'npm install hyperwiz',
    icon: '📦',
    description: 'Node Package Manager'
  },
  {
    name: 'yarn',
    command: 'yarn add hyperwiz',
    icon: '🧶',
    description: 'Fast, reliable, and secure dependency management'
  },
  {
    name: 'pnpm',
    command: 'pnpm add hyperwiz',
    icon: '⚡',
    description: 'Fast, disk space efficient package manager'
  }
]

export default function Installation() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-gray-900/50 to-blue-950/20">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-blue-500/10 rounded-full">
              <Package className="h-8 w-8 text-blue-400" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
            Installation
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Get started with <span className="font-bold text-blue-400">HyperWiz</span> in your project. 
            Choose your preferred package manager and start building secure, browser-based applications.
          </p>
        </div>
      </section>

      {/* Installation Methods */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="space-y-8">
            {packageManagers.map((pm) => (
              <div key={pm.name} className="card group hover:scale-105 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{pm.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{pm.name}</h3>
                      <span className="text-sm text-gray-400">({pm.description})</span>
                    </div>
                    <div className="bg-gray-900 rounded-lg p-4 mb-4">
                      <code className="text-green-400 font-mono">{pm.command}</code>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span>Ready to use after installation</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Next Steps */}
      <section className="py-16 bg-gray-900/30">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold mb-6">What's Next?</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Now that you've installed HyperWiz, learn how to use it in your project.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <a 
              href="/docs/api" 
              className="card group hover:scale-105 transition-all duration-300 text-left"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Download className="h-5 w-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold">API Reference</h3>
              </div>
              <p className="text-gray-300 text-sm">
                Learn about all available methods and configuration options.
              </p>
            </a>
            <a 
              href="/docs/examples" 
              className="card group hover:scale-105 transition-all duration-300 text-left"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold">Examples</h3>
              </div>
              <p className="text-gray-300 text-sm">
                See real-world examples and common use cases.
              </p>
            </a>
          </div>
        </div>
      </section>
    </div>
  )
} 