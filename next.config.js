/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  // Webpack configuration for SSH2 and other node modules
  webpack: (config, { isServer, webpack }) => {
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
        ssh2: false,
      };
    }
    
    // Ignore .node binary modules
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /\.node$/,
        contextRegExp: /ssh2/,
      })
    );

    return config;
  },
  
  // Mark ssh2 as external package for server components
  serverExternalPackages: ['ssh2'],
};

module.exports = nextConfig;
