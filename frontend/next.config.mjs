/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    // Improved error handling
    forceSwcTransforms: true,
  },
  reactStrictMode: true,
  transpilePackages: [
    '@radix-ui/react-alert-dialog',
    '@radix-ui/react-dropdown-menu',
    '@radix-ui/react-tooltip',
    'recharts',
    'react-day-picker',
    'cmdk',
    'vaul'
  ],
  webpack: (config) => {
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve.alias,
        '@': '.',
        '@/lib': './lib',
        '@/components': './components',
        '@/app': './app'
      },
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      fallback: {
        // Add fallbacks for node core modules
        fs: false,
        path: false,
        crypto: false
      }
    }
    return config
  }
}

export default nextConfig
