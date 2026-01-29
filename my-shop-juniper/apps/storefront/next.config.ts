import {NextConfig} from 'next';

const nextConfig: NextConfig = {
    cacheComponents: true,
    images: {
        // This is necessary to display images from your local Vendure instance
        dangerouslyAllowLocalIP: true, // <-- needed for NextJS image optimization to not be buggy during local dev work
        remotePatterns: [
            {
              protocol: 'http',
              hostname: 'vendure-server',
              port: '3000',
              pathname: '/assets/**',
            },
            {
              protocol: 'http',
              hostname: 'localhost',
              port: '3000',
              pathname: '/assets/**',
            },
        ],
    },
    experimental: {
        rootParams: true
    }
};

export default nextConfig;