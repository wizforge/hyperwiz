import Link from 'next/link'
import { Package, Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-950 border-t border-gray-800 py-12 mt-12">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2 text-lg font-bold text-blue-400">
            <span className="text-xl">⚡</span>
            <span>hyperwiz</span>
          </div>
          
          <div className="flex gap-8 text-gray-400 text-sm">
            <Link href="/docs" className="hover:text-white transition-colors">Documentation</Link>
            <Link href="/docs/api" className="hover:text-white transition-colors">API</Link>
            <Link href="/docs/examples" className="hover:text-white transition-colors">Examples</Link>
            <Link href="/docs/security" className="hover:text-white transition-colors">Security</Link>
          </div>
          
          <div className="flex gap-4">
            <Link
              href="https://www.npmjs.com/package/hyperwiz"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">npm</span>
            </Link>

          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-gray-500 text-sm">
            &copy; 2025 Parth Tyagi. Apache-2.0 License.
          </div>
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <span>Made with</span>
            <Heart className="h-4 w-4 text-red-500" />
            <span>for developers</span>
          </div>
        </div>
      </div>
    </footer>
  )
} 