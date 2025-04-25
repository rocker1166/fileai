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
  transpilePackages: ['@radix-ui/react-alert-dialog'],
  experimental: {
    esmExternals: true
  },
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
      extensionAlias: {
        '.js': ['.js', '.ts', '.tsx']
      }
    }
    return config
  }
}

export default nextConfig
