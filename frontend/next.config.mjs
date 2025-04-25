/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => {
      config.resolve = {
        ...config.resolve,
        alias: {
          ...config.resolve.alias,
          '@': '.',
          '@/lib': './lib',
          '@/components': './components',
          '@/app': './app',
          '@/hooks': './hooks',
          '@/styles': './styles',
          '@/types': './types',
          '@/public': './public'
        }
      }
      return config
    }
  }
  
  export default nextConfig