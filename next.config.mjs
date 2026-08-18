import { createMDX } from 'fumadocs-mdx/next';
import withBundleAnalyzer from '@next/bundle-analyzer';
import path from 'node:path';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  // `shiki` is used by fumadocs-mdx's dynamic (runtime-compiled) collections
  // for code highlighting. Keep it external so it is loaded natively at
  // runtime instead of being bundled into the server build.
  serverExternalPackages: ['shiki'],
  // Replace `next-themes` (which injects an inline <script> that triggers the
  // React 19 "Encountered a script tag" warning on client navigations) with a
  // drop-in implementation that avoids rendering scripts inside components.
  webpack: (webpackConfig) => {
    webpackConfig.resolve.alias = {
      ...webpackConfig.resolve.alias,
      'next-themes': path.resolve(process.cwd(), 'src/lib/theme.tsx'),
    };
    return webpackConfig;
  },
  turbopack: {
    resolveAlias: {
      'next-themes': './src/lib/theme.tsx',
    },
  },
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/docs/:path*.mdx',
        destination: '/llms.mdx/docs/:path*',
      },
      {
        // Locale-prefixed markdown URLs (e.g. /zh/docs/dqn.mdx). The i18n
        // middleware internally rewrites /docs/... to /en/docs/..., so the
        // unprefixed pattern above never matches on the branch with i18n —
        // handle prefixed paths explicitly and pass the locale through the
        // path (Next.js rewrites do not support query parameter injection).
        source: '/:lang/docs/:path*.mdx',
        destination: '/llms.mdx/docs/:lang/:path*',
      },
    ];
  },
};

const analyzed = withBundleAnalyzer({ enabled: process.env.ANALYZE === 'true' })(
  withMDX(config)
);

export default analyzed;
