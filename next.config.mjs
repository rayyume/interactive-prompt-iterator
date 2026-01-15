/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 优化开发模式的编译性能
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // 减少不必要的重新编译
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ['**/node_modules', '**/.git', '**/.next'],
      };
    }
    return config;
  },
};

export default nextConfig;
