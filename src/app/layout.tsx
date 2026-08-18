import { RootProvider } from 'fumadocs-ui/provider/next';
import 'katex/dist/katex.min.css';
import './global.css';
import type { Metadata } from 'next';

const siteUrl = 'https://rl-handbook.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'RL Handbook: Reinforcement Learning Guide',
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
    title: 'RL Handbook: Reinforcement Learning Guide',
    description: 'A comprehensive guide to Reinforcement Learning',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RL Handbook: Reinforcement Learning Guide',
    description: 'A comprehensive guide to Reinforcement Learning',
  },
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return children;
}
