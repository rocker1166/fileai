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
  // Removing experimental ESM externals which may cause build issues
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
      // Using fallback extensions instead of extension alias for better compatibility
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
    }
    
    // Adding fallback for node.js core modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false
    };
    
    return config
  }
}

export default nextConfig
