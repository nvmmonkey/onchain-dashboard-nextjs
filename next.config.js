/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Webpack configuration for SSH2 and other node modules
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve node modules on the client-side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        buffer: false,
        util: false,
        path: false,
        os: false,
        // turbopack: true,
      };
    }

    return config;
  },
};

module.exports = nextConfig;
