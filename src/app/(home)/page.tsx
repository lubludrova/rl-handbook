'use client';

import Link from 'next/link';
import { memo, useState } from 'react';
import { HeroCanvas } from '@/components/HeroCanvas';

const SectionTitle = memo(function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="font-heading font-semibold text-sm uppercase mb-6"
      style={{
        letterSpacing: '0.1em',
        color: 'var(--color-fd-muted-foreground)',
      }}
    >
      {children}
    </h2>
  );
});

const CopyButton = memo(function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <button
      onClick={handleCopy}
      className="copy-btn absolute top-3 right-3 px-3 py-1 text-xs font-heading rounded-sm cursor-pointer"
      style={{
        color: 'var(--color-fd-muted-foreground)',
        border: '1px solid var(--color-fd-border)',
      }}
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
});

const bibtex = `@book{rlhandbook2026,
  author = {Ruslan Ageev},
  title = {RL Handbook: A Comprehensive Guide to Reinforcement Learning},
  year = {2026},
  publisher = {Online},
  url = {https://rl-handbook.com}
}`;

const chapters: {
  title: string;
  slug: string;
  pages: { title: string; slug: string }[];
  comingSoon?: boolean;
}[] = [
  {
    title: 'Introduction',
    slug: '00-introduction',
    pages: [
      { title: 'Introduction', slug: 'introduction' },
      { title: 'What is Reinforcement Learning?', slug: 'what-is-reinforcement-learning' },
      { title: 'Taxonomy of RL Methods', slug: 'taxonomy' },
    ],
  },
  {
    title: 'Value-Based',
    slug: '01-value-based',
    pages: [
      { title: 'Multi-Armed Bandits', slug: 'multi-armed-bandits' },
      { title: 'Markov Decision Processes', slug: 'mdp' },
      { title: 'Dynamic Programming', slug: 'dynamic-programming' },
      { title: 'Monte Carlo and Temporal-Difference Prediction', slug: 'monte-carlo-and-temporal-difference' },
      { title: 'Sarsa and Q-Learning', slug: 'sarsa-and-q-learning' },
      { title: 'Deep Q-Networks', slug: 'dqn' },
      { title: 'DQN Improvements', slug: 'dqn-improvements' },
    ],
  },
  {
    title: 'On-Policy Policy-Based',
    slug: '02-on-policy-policy-based',
    pages: [
      { title: 'Policy Gradient and REINFORCE', slug: 'policy-gradient-and-reinforce' },
      { title: 'Actor-Critic, A2C and A3C', slug: 'actor-critic-a2c-a3c' },
      { title: 'TRPO', slug: 'trpo' },
      { title: 'PPO', slug: 'ppo' },
    ],
  },
  {
    title: 'Off-Policy Policy-Based',
    slug: '03-off-policy-policy-based',
    pages: [
      { title: 'Off-Policy Policy-Based Framework', slug: 'off-policy-policy-improvement-framework' },
      { title: 'DDPG', slug: 'ddpg' },
      { title: 'TD3 and SAC', slug: 'td3-and-sac' },
    ],
  },
  {
    title: 'Model-Based',
    slug: '04-model-based',
    comingSoon: true,
    pages: [
      { title: 'Dyna and Learned Models', slug: 'dyna-and-learned-models' },
      { title: 'Model Predictive Control', slug: 'model-predictive-control' },
      { title: 'AlphaZero and MuZero', slug: 'alphazero-and-muzero' },
    ],
  },
  {
    title: 'Advanced Topics',
    slug: '05-advanced-topics',
    comingSoon: true,
    pages: [
      { title: 'RLHF and Language Models', slug: 'rl-sequence-generation-and-rlhf' },
      { title: 'Imitation Learning', slug: 'imitation-learning' },
      { title: 'Offline RL', slug: 'offline-rl' },
      { title: 'Exploration', slug: 'exploration' },
      { title: 'Goal-Conditioned RL', slug: 'goal-conditioned-rl' },
      { title: 'Multi-Agent RL', slug: 'multi-agent-rl' },
    ],
  },
];

export default function HomePage() {
  return (
    <main className="landing-page">
      {/* ===== HERO ===== */}
      <section
        className="relative overflow-hidden grain-overlay flex items-center justify-center"
        style={{ minHeight: '65vh' }}
      >
        <HeroCanvas />

        <div className="relative z-10 w-full max-w-[720px] min-w-0 text-center px-4 sm:px-6">
          <h1
            className="font-heading font-bold leading-none text-[2.5rem] sm:text-[4.5rem]"
            style={{
              letterSpacing: 0,
              color: 'var(--color-fd-foreground)',
            }}
          >
            RL Handbook
          </h1>

          <p
            className="font-body font-light mt-5 mx-auto max-w-[34rem]"
            style={{
              fontSize: '1.15rem',
              lineHeight: 1.6,
              color: 'var(--color-fd-muted-foreground)',
            }}
          >
            A comprehensive guide to Reinforcement Learning
          </p>

          <div className="mt-8">
            <Link
              href="/docs/00-introduction/introduction"
              prefetch={true}
              className="cta-btn inline-block font-heading font-semibold text-sm uppercase rounded-none px-8 py-3 min-h-[44px] leading-[44px]"
              aria-label="Open RL Handbook documentation"
              style={{
                letterSpacing: '0.08em',
                background: 'var(--color-fd-primary)',
                color: 'var(--color-fd-primary-foreground)',
              }}
            >
              Lock in
            </Link>
          </div>

          <div className="mt-5">
            <Link
              href="/map"
              prefetch={false}
              className="icon-link font-heading text-xs uppercase underline underline-offset-4"
              style={{
                letterSpacing: '0.1em',
                color: 'var(--color-fd-muted-foreground)',
              }}
            >
              or explore the Map of RL →
            </Link>
          </div>
        </div>
      </section>

      {/* ===== ABSTRACT ===== */}
      <section className="py-10 sm:py-24 px-4 sm:px-6">
        <div style={{ maxWidth: 700, margin: '0 auto' }}>

          <SectionTitle>Abstract</SectionTitle>
          <p
            className="font-body"
            style={{
              fontSize: '1.05rem',
              lineHeight: 1.8,
              color: 'var(--color-fd-foreground)',
              textWrap: 'pretty',
            }}
          >
            This handbook gives a comprehensive, up-to-date guide to
            reinforcement learning and sequential decision making. Starting from
            bandits and Markov decision processes, it progresses through
            value-based methods, policy gradients, actor-critic architectures,
            and model-based approaches. Advanced topics include imitation
            learning, offline RL, curiosity-driven exploration, and multi-agent
            systems. The material balances mathematical rigor with runnable code
            examples, and is designed to serve as an open, continuously updated
            resource for students, researchers, and engineers entering or working
            in the field
          </p>
        </div>
      </section>

      {/* ===== CHAPTER CONTENTS ===== */}
      <section className="py-10 sm:py-24 px-4 sm:px-6">
        <div style={{ maxWidth: 700, margin: '0 auto' }}>

          <SectionTitle>Chapter Contents</SectionTitle>

          <ol className="mt-10 space-y-10" style={{ listStyle: 'none', padding: 0 }}>
            {chapters.map((chapter, chapterIdx) => {
              const chapterNum = String(chapterIdx + 1).padStart(2, '0');
              return (
                <li key={chapter.slug}>
                  <div className="flex items-baseline gap-4 flex-wrap">
                    <span
                      className="font-heading font-semibold text-sm"
                      style={{
                        color: 'var(--color-fd-muted-foreground)',
                        letterSpacing: '0.05em',
                        minWidth: '2.5rem',
                      }}
                    >
                      {chapterNum}
                    </span>
                    <h3
                      className="font-heading font-semibold"
                      style={{
                        fontSize: '1.05rem',
                        letterSpacing: '-0.01em',
                        color: chapter.comingSoon
                          ? 'var(--color-fd-muted-foreground)'
                          : 'var(--color-fd-foreground)',
                      }}
                    >
                      {chapter.title}
                    </h3>
                    {chapter.comingSoon && (
                      <span
                        className="font-heading text-[0.65rem] uppercase px-2 py-0.5 rounded-sm"
                        style={{
                          letterSpacing: '0.12em',
                          color: 'var(--color-fd-muted-foreground)',
                          border: '1px solid var(--color-fd-border)',
                        }}
                      >
                        Coming soon
                      </span>
                    )}
                  </div>

                  {!chapter.comingSoon && (
                    <ol
                      className="mt-4 space-y-2.5"
                      style={{
                        listStyle: 'none',
                        padding: 0,
                        marginLeft: '2.5rem',
                        paddingLeft: '1rem',
                        borderLeft: '1px solid var(--color-fd-border)',
                      }}
                    >
                      {chapter.pages.map((page, pageIdx) => (
                        <li key={page.slug} className="flex items-baseline gap-3">
                          <span
                            className="font-heading text-xs shrink-0"
                            style={{
                              color: 'var(--color-fd-muted-foreground)',
                              letterSpacing: '0.05em',
                              minWidth: '2rem',
                            }}
                          >
                            {chapterNum}.{pageIdx + 1}
                          </span>
                          <Link
                            href={`/docs/${chapter.slug}/${page.slug}`}
                            prefetch={false}
                            className="font-body icon-link underline-offset-2 hover:underline"
                            style={{
                              fontSize: '0.95rem',
                              lineHeight: 1.5,
                              color: 'var(--color-fd-foreground)',
                            }}
                          >
                            {page.title}
                          </Link>
                        </li>
                      ))}
                    </ol>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ===== CITATION (hidden) =====
      <section className="py-10 sm:py-24 px-4 sm:px-6">
        <div style={{ maxWidth: 700, margin: '0 auto' }}>

          <SectionTitle>Citation</SectionTitle>

          <div
            className="relative rounded-sm p-6"
            style={{
              fontSize: '0.875rem',
              background: 'var(--color-fd-popover)',
              border: '1px solid var(--color-fd-border)',
              borderLeft: '3px solid var(--color-fd-border)',
            }}
          >
            <CopyButton text={bibtex} />
            <pre
              className="font-code leading-relaxed whitespace-pre-wrap"
              style={{ color: 'var(--color-fd-foreground)' }}
            >
              {bibtex}
            </pre>
          </div>
        </div>
      </section>
      */}

      {/* ===== AUTHOR ===== */}
      <section className="py-10 sm:py-24 px-4 sm:px-6">
        <div style={{ maxWidth: 700, margin: '0 auto' }}>

          <SectionTitle>Author</SectionTitle>

          <div>
            <p
              className="font-semibold"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                color: 'var(--color-fd-foreground)',
              }}
            >
              Ruslan Ageev
            </p>
            <p
              className="font-body text-sm mt-1"
              style={{ color: 'var(--color-fd-muted-foreground)' }}
            >
              RL research @ Tsinghua University | ML &amp; AI
            </p>
            <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mt-3">
              {[
                { label: 'GitHub', href: 'https://github.com/lubludrova' },
                { label: 'LinkedIn', href: 'https://www.linkedin.com/in/ruslan-ageev-09b1a6387' },
                { label: 'Email', href: 'mailto:rus.ageev2003@gmail.com' },
                { label: 'Telegram', href: 'https://t.me/Lubludrova' },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="icon-link font-heading text-xs uppercase"
                  style={{
                    letterSpacing: '0.1em',
                    color: 'var(--color-fd-muted-foreground)',
                  }}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== ACKNOWLEDGEMENTS ===== */}
      <section className="py-10 sm:py-24 px-4 sm:px-6">
        <div style={{ maxWidth: 700, margin: '0 auto' }}>

          <SectionTitle>Acknowledgements</SectionTitle>
          <p
            className="font-body"
            style={{
              fontSize: '1.05rem',
              lineHeight: 1.8,
              color: 'var(--color-fd-foreground)',
              textWrap: 'pretty',
            }}
          >
            We thank all{' '}
            <a
              href="https://github.com/lubludrova/rl-handbook/graphs/contributors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 icon-link"
              style={{ color: 'var(--color-fd-foreground)' }}
            >
              contributors
            </a>{' '}
            who helped improve this handbook through feedback, corrections, and
            new material
          </p>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer
        className="py-8 px-4 sm:px-6"
        style={{ borderTop: '1px solid var(--color-fd-border)' }}
      >
        <div
          className="flex flex-wrap items-center justify-center gap-10 sm:gap-12 text-sm font-body"
          style={{ color: 'var(--color-fd-muted-foreground)' }}
        >
          <span>&copy; 2026 Ruslan Ageev</span>
          <a href="https://github.com/lubludrova/rl-handbook" target="_blank" rel="noopener noreferrer" className="icon-link" style={{ lineHeight: 0 }} aria-label="GitHub">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </a>
          <a href="https://arxiv.org" target="_blank" rel="noopener noreferrer" className="icon-link" style={{ lineHeight: 0 }} aria-label="arXiv">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 3h18v18H3V3zm2 2v14h14V5H5zm3 3h8v2H8V8zm0 4h8v2H8v-2zm0 4h5v2H8v-2z" />
            </svg>
          </a>
        </div>
      </footer>
    </main>
  );
}
