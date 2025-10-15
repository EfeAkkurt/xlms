import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Handle webpack issues with sodium-native and require-addon
  webpack: (config, { isServer }) => {
    // Ignore warnings about critical dependencies
    config.ignoreWarnings = [
      {
        module: /node_modules\/require-addon/,
      },
      {
        module: /node_modules\/sodium-native/,
      },
      {
        message: /Critical dependency.*require function/,
      },
    ];

    // Handle sodium-native for client-side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }

    return config;
  },

  // Experimental features for better compatibility
  experimental: {
    // Optimize packages
    optimizePackageImports: ['@stellar/freighter-api'],
  },

  // React strict mode
  reactStrictMode: true,

  // Disable source maps in production to reduce warnings
  productionBrowserSourceMaps: false,
};

export default nextConfig;