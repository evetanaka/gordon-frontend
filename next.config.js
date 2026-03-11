/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'pino-pretty': false,
      encoding: false,
    }
    config.externals.push('pino-pretty', '@react-native-async-storage/async-storage')
    return config
  },
}

module.exports = nextConfig
