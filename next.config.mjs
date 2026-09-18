/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { dev }) => {
    // Disable disk pack cache in development to eliminate Windows errno: -4058 cache corruption
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
