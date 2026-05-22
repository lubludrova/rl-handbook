import { RootProvider } from 'fumadocs-ui/provider/next';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import 'katex/dist/katex.min.css';
import './global.css';
import { IBM_Plex_Mono, Inter, JetBrains_Mono } from 'next/font/google';
import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';

const siteUrl = 'https://rl-handbook.com';
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'RL Handbook',
  url: siteUrl,
  description: 'A comprehensive guide to Reinforcement Learning',
  author: {
    '@type': 'Person',
    name: 'Ruslan Ageev',
  },
} satisfies Record<string, unknown>;

const bookSchema = {
  '@context': 'https://schema.org',
  '@type': 'Book',
  name: 'RL Handbook: A Comprehensive Guide to Reinforcement Learning',
  author: {
    '@type': 'Person',
    name: 'Ruslan Ageev',
  },
  url: siteUrl,
  datePublished: '2026',
  publisher: {
    '@type': 'Organization',
    name: 'Online',
  },
  inLanguage: 'en',
} satisfies Record<string, unknown>;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'RL Handbook',
    template: '%s | RL Handbook',
  },
  description: 'A comprehensive guide to Reinforcement Learning',
  applicationName: 'RL Handbook',
  authors: [{ name: 'Ruslan Ageev', url: siteUrl }],
  keywords: [
    'RL Handbook',
    'reinforcement learning',
    'deep reinforcement learning',
    'policy gradients',
    'actor-critic',
    'model-based reinforcement learning',
    'RLHF',
    'Markov decision processes',
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: 'RL Handbook',
    title: 'RL Handbook',
    description: 'A comprehensive guide to Reinforcement Learning',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RL Handbook',
    description: 'A comprehensive guide to Reinforcement Learning',
  },
};

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-heading',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500'],
  variable: '--font-code',
  display: 'swap',
});

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${ibmPlexMono.variable} ${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="flex flex-col min-h-screen">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:px-4 focus:py-2 focus:font-heading focus:text-sm focus:outline-2 focus:outline-offset-2"
          style={{
            background: 'var(--color-fd-background)',
            color: 'var(--color-fd-foreground)',
            outlineColor: 'var(--color-fd-foreground)',
            border: '1px solid var(--color-fd-border)',
          }}
        >
          Skip to content
        </a>
        <div id="main-content" className="contents">
          <RootProvider>{children}</RootProvider>
        </div>
        <JsonLd id="website-json-ld" data={websiteSchema} />
        <JsonLd id="book-json-ld" data={bookSchema} />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
