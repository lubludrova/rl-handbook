import { RootProvider } from 'fumadocs-ui/provider/next';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';

const ruTranslations = {
  'Ask AI(AI chat button)': 'Спросить ИИ',
  'Back to Home(404 page)': 'На главную',
  'Choose a language(language switcher)': 'Выбрать язык',
  'Choose a language(language switcher)(aria-label)': 'Выбрать язык',
  'Close Banner(banner)(aria-label)': 'Закрыть баннер',
  'Close Search(search dialog)(aria-label)': 'Закрыть поиск',
  'Close Sidebar(aria-label)': 'Закрыть боковую панель',
  'Close Sidebar(sidebar)(aria-label)': 'Закрыть боковую панель',
  'Collapse Sidebar(sidebar)(aria-label)': 'Свернуть боковую панель',
  'Copied Text(code block)(aria-label)': 'Скопировано',
  'Copy Anchor Link(heading anchor)(aria-label)': 'Скопировать ссылку на раздел',
  'Copy Link(accordion)(aria-label)': 'Скопировать ссылку',
  'Copy Markdown(page actions)': 'Копировать Markdown',
  'Copy Text(code block)(aria-label)': 'Копировать текст',
  'Dark(theme switcher)(aria-label)': 'Тёмная тема',
  'Default(type table)': 'По умолчанию',
  'Edit on GitHub(edit page)': 'Редактировать на GitHub',
  'Hide Sidebar(sidebar)': 'Скрыть боковую панель',
  'Last updated on(page footer)': 'Последнее обновление:',
  'Layout Tab(layout tab trigger)': 'Макет',
  'Light(theme switcher)(aria-label)': 'Светлая тема',
  'Next Page(pagination)': 'Следующая страница',
  'No Headings(table of contents)': 'На этой странице нет разделов',
  'No results found(search dialog)': 'Ничего не найдено',
  'On this page(table of contents)': 'На этой странице',
  'Open Search(search trigger)(aria-label)': 'Открыть поиск',
  'Open Sidebar(sidebar)(aria-label)': 'Открыть боковую панель',
  'Open in ChatGPT(page actions)': 'Открыть в ChatGPT',
  'Open in Claude(page actions)': 'Открыть в Claude',
  'Open in Cursor(page actions)': 'Открыть в Cursor',
  'Open in GitHub(page actions)': 'Открыть на GitHub',
  'Open in Scira AI(page actions)': 'Открыть в Scira AI',
  'Open(page actions)': 'Открыть',
  'Page Not Found(404 page)': 'Страница не найдена',
  'Parameters(type table)': 'Параметры',
  'Previous Page(pagination)': 'Предыдущая страница',
  'Prop(type table)': 'Свойство',
  'Read {url}, I want to ask questions about it.(page actions)':
    'Прочитай {url}. Я хочу задать вопросы об этой странице.',
  'Returns(type table)': 'Возвращаемое значение',
  'Search(search dialog)': 'Поиск',
  'Search(search trigger)': 'Поиск',
  'Show Sidebar(sidebar)': 'Показать боковую панель',
  'System(theme switcher)(aria-label)': 'Системная тема',
  'Table of Contents(inline table of contents)': 'Содержание',
  'The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.(404 page)':
    'Возможно, страница была удалена, переименована или временно недоступна.',
  'Toggle Menu(mobile menu)(aria-label)': 'Открыть или закрыть меню',
  'Toggle Theme(theme switcher)(aria-label)': 'Сменить тему',
  'Type(type table)': 'Тип',
  'View as Markdown(page actions)': 'Открыть как Markdown',
  displayName: 'Русский',
};

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

export default async function Layout({ children, params }: LayoutProps<'/[lang]'>) {
  const { lang } = await params;
  return (
    <html
      lang={lang}
      suppressHydrationWarning
    >
      <head />
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
          {lang === 'zh'
            ? '跳转到内容'
            : lang === 'ru'
              ? 'Перейти к содержанию'
              : 'Skip to content'}
        </a>
        {/* Pass i18n directly to RootProvider so that its internal
            I18nProvider wraps EVERYTHING (including the search dialog rendered
            by SearchProvider). This lets the search dialog read the active
            locale; otherwise searches fall back to English and Chinese results
            get filtered out. */}
        <RootProvider
          i18n={{
            locale: lang,
            locales: [
              { name: 'English', locale: 'en' },
              { name: '中文', locale: 'zh' },
              { name: 'Русский', locale: 'ru' },
            ],
            // Only localize the table-of-contents labels here; the search
            // dialog stays in its default (English) form per earlier decision.
            translations:
              lang === 'zh'
                ? {
                    'On this page(table of contents)': '本页目录',
                    'Table of Contents(inline table of contents)': '目录',
                    'No Headings(table of contents)': '本节暂无标题',
                  }
                : lang === 'ru'
                  ? ruTranslations
                  : {},
          }}
        >
          <div id="main-content" className="contents">
            {children}
          </div>
        </RootProvider>
        <JsonLd id="website-json-ld" data={websiteSchema} />
        <JsonLd id="book-json-ld" data={bookSchema} />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
