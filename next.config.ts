import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
  output: 'standalone',
  experimental: {
    serverActions: {
      allowedOrigins: [
        'brochure2-campaign-ai.vercel.app',
        'localhost:3000',
        '127.0.0.1:3000',
        '0.0.0.0:3000',
        '**.run.app',
        '*.asia-southeast1.run.app',
        ...(process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL'
          ? (() => {
              try {
                return [new URL(process.env.APP_URL).host];
              } catch {
                return [];
              }
            })()
          : []),
      ],
    },
  },
};

export default nextConfig;
