'use client';

import Link from 'next/link';
import { memo, useState, use } from 'react';
import { HeroCanvas } from '@/components/HeroCanvas';
import { MapTransitionLink } from '@/components/MapTransitionLink';
import { getLangFromPath, type UILang } from '@/lib/ui';

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

type Lang = UILang;

const texts: Record<Lang, {
  heroTitle: string;
  heroSubtitle: string;
  cta: string;
  abstractTitle: string;
  abstractText: string;
  chapterContentsTitle: string;
  comingSoon: string;
  authorTitle: string;
  authorRole: string;
  acknowledgementsTitle: string;
  acknowledgementsText: string;
}> = {
  en: {
    heroTitle: 'RL Handbook',
    heroSubtitle: 'A comprehensive guide to Reinforcement Learning',
    cta: 'Lock in',
    abstractTitle: 'Abstract',
    abstractText: 'This handbook gives a comprehensive, up-to-date guide to reinforcement learning and sequential decision making. Starting from bandits and Markov decision processes, it progresses through value-based methods, policy gradients, actor-critic architectures, and model-based approaches. Advanced topics include imitation learning, offline RL, curiosity-driven exploration, and multi-agent systems. The material balances mathematical rigor with runnable code examples, and is designed to serve as an open, continuously updated resource for students, researchers, and engineers entering or working in the field.',
    chapterContentsTitle: 'Chapter Contents',
    comingSoon: 'Coming soon',
    authorTitle: 'Author',
    authorRole: 'RL research @ Tsinghua University | ML & AI',
    acknowledgementsTitle: 'Acknowledgements',
    acknowledgementsText: 'We thank all contributors who helped improve this handbook through feedback, corrections, and new material',
  },
  zh: {
    heroTitle: 'RL手册',
    heroSubtitle: '强化学习综合指南',
    cta: '开始阅读',
    abstractTitle: '摘要',
    abstractText: '本手册提供了一份关于强化学习和序列决策的全面、最新的指南。从赌博机和马尔可夫决策过程开始，逐步深入到基于值的方法、策略梯度、Actor-Critic 架构以及基于模型的方法。高级主题包括模仿学习、离线 RL、好奇心驱动的探索和多智能体系统。内容在数学严谨性和可运行的代码示例之间取得平衡，旨在为进入或从事该领域的学生、研究人员和工程师提供一个开放的、持续更新的资源。',
    chapterContentsTitle: '章节目录',
    comingSoon: '即将推出',
    authorTitle: '作者',
    authorRole: '清华大学 RL 研究 | ML & AI',
    acknowledgementsTitle: '致谢',
    acknowledgementsText: '我们感谢所有通过反馈、纠正和提供新素材来帮助改进本手册的贡献者：',
  },
};

const chaptersEn: {
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

const chaptersZh: typeof chaptersEn = [
  {
    title: '引言',
    slug: '00-introduction',
    pages: [
      { title: '引言', slug: 'introduction' },
      { title: '什么是强化学习？', slug: 'what-is-reinforcement-learning' },
      { title: 'RL 方法分类', slug: 'taxonomy' },
    ],
  },
  {
    title: '基于值的方法',
    slug: '01-value-based',
    pages: [
      { title: '多臂赌博机', slug: 'multi-armed-bandits' },
      { title: '马尔可夫决策过程 (MDP)', slug: 'mdp' },
      { title: '动态规划 (DP)', slug: 'dynamic-programming' },
      { title: '蒙特卡洛 (MC) 与时序差分 (TD)', slug: 'monte-carlo-and-temporal-difference' },
      { title: 'Sarsa 与 Q-Learning', slug: 'sarsa-and-q-learning' },
      { title: '深度 Q 网络 (DQN)', slug: 'dqn' },
      { title: 'DQN 改进', slug: 'dqn-improvements' },
    ],
  },
  {
    title: '同策略方法 (On-Policy)',
    slug: '02-on-policy-policy-based',
    pages: [
      { title: '策略梯度与 REINFORCE 算法', slug: 'policy-gradient-and-reinforce' },
      { title: '演员-评论家系列方法 (Actor-Critic、A2C 与 A3C)', slug: 'actor-critic-a2c-a3c' },
      { title: 'TRPO', slug: 'trpo' },
      { title: 'PPO', slug: 'ppo' },
    ],
  },
  {
    title: '异策略方法 (Off-Policy)',
    slug: '03-off-policy-policy-based',
    pages: [
      { title: 'Off-Policy 异策略改进框架', slug: 'off-policy-policy-improvement-framework' },
      { title: 'DDPG', slug: 'ddpg' },
      { title: 'TD3 与 SAC', slug: 'td3-and-sac' },
    ],
  },
  {
    title: '基于模型的方法',
    slug: '04-model-based',
    comingSoon: true,
    pages: [
      { title: 'Dyna 与学习模型', slug: 'dyna-and-learned-models' },
      { title: '模型预测控制 (MPC)', slug: 'model-predictive-control' },
      { title: 'AlphaZero 与 MuZero', slug: 'alphazero-and-muzero' },
    ],
  },
  {
    title: '高级主题',
    slug: '05-advanced-topics',
    comingSoon: true,
    pages: [
      { title: 'RLHF 与语言模型', slug: 'rl-sequence-generation-and-rlhf' },
      { title: '模仿学习 (IL)', slug: 'imitation-learning' },
      { title: '离线 RL', slug: 'offline-rl' },
      { title: '探索', slug: 'exploration' },
      { title: '目标条件 RL', slug: 'goal-conditioned-rl' },
      { title: '多智能体 RL', slug: 'multi-agent-rl' },
    ],
  },
];

export default function HomePage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const lang = getLangFromPath('/' + params.lang) as Lang;
  const t = texts[lang];
  const chapters = lang === 'zh' ? chaptersZh : chaptersEn;
  // Default language (en) has no prefix in the URL; every other language is
  // prefixed with its language code (`/zh`, `/ru`, …).
  const prefix = lang === 'en' ? '' : `/${lang}`;

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
            {t.heroTitle}
          </h1>

          <p
            className="font-body font-light mt-5 mx-auto max-w-[34rem]"
            style={{
              fontSize: '1.15rem',
              lineHeight: 1.6,
              color: 'var(--color-fd-muted-foreground)',
            }}
          >
            {t.heroSubtitle}
          </p>

          <div className="mt-8">
            <Link
              href={`${prefix}/docs/00-introduction/introduction`}
              prefetch={true}
              className="cta-btn inline-block font-heading font-semibold text-sm uppercase rounded-none px-8 py-3 min-h-[44px] leading-[44px]"
              aria-label="Open RL Handbook documentation"
              style={{
                letterSpacing: '0.08em',
                background: 'var(--color-fd-primary)',
                color: 'var(--color-fd-primary-foreground)',
              }}
            >
              {t.cta}
            </Link>
          </div>

          <div className="mt-5">
            <MapTransitionLink />
          </div>
        </div>
      </section>

      {/* ===== ABSTRACT ===== */}
      <section className="py-10 sm:py-24 px-4 sm:px-6">
        <div style={{ maxWidth: 700, margin: '0 auto' }}>

          <SectionTitle>{t.abstractTitle}</SectionTitle>
          <p
            className="font-body"
            style={{
              fontSize: '1.05rem',
              lineHeight: 1.8,
              color: 'var(--color-fd-foreground)',
              textWrap: 'pretty',
            }}
          >
            {t.abstractText}
          </p>
        </div>
      </section>

      {/* ===== CHAPTER CONTENTS ===== */}
      <section className="py-10 sm:py-24 px-4 sm:px-6">
        <div style={{ maxWidth: 700, margin: '0 auto' }}>

          <SectionTitle>{t.chapterContentsTitle}</SectionTitle>

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
                        {t.comingSoon}
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
                            href={`${prefix}/docs/${chapter.slug}/${page.slug}`}
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

      {/* ===== AUTHOR ===== */}
      <section className="py-10 sm:py-24 px-4 sm:px-6">
        <div style={{ maxWidth: 700, margin: '0 auto' }}>

          <SectionTitle>{t.authorTitle}</SectionTitle>

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
              {t.authorRole}
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

          <SectionTitle>{t.acknowledgementsTitle}</SectionTitle>
          <p
            className="font-body"
            style={{
              fontSize: '1.05rem',
              lineHeight: 1.8,
              color: 'var(--color-fd-foreground)',
              textWrap: 'pretty',
            }}
          >
            {t.acknowledgementsText}{' '}
            <a
              href="https://github.com/lubludrova/rl-handbook/graphs/contributors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 icon-link"
              style={{ color: 'var(--color-fd-foreground)' }}
            >
              contributors
            </a>
            .
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
