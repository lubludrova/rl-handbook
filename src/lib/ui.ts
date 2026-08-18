import { i18n } from '@/lib/i18n';

/**
 * Languages supported by the UI. Keep in sync with `i18n.languages` in
 * `src/lib/i18n.ts` — when a new language (e.g. Russian) is added, add it here
 * and the `satisfies` check below forces every key to be translated for it.
 */
export type UILang = 'en' | 'zh';

/**
 * Resolve the active UI language from a pathname. The default language has no
 * URL prefix (`hideLocale: 'default-locale'`); every other language is
 * prefixed (`/zh/...`). Unknown/absent prefixes fall back to the default.
 */
export function getLangFromPath(pathname: string): UILang {
  const first = pathname.split('/').filter(Boolean)[0] as UILang;
  if (first && first !== i18n.defaultLanguage && (['zh', 'ru'] as string[]).includes(first)) {
    return first;
  }
  return i18n.defaultLanguage as UILang;
}

export interface Messages {
  /** "or explore the Map of RL →" on the home page */
  'map.orExplore': string;
  /** "entering the map…" while morphing into the map */
  'map.entering': string;
  /** aria-label for the map link */
  'map.aria': string;
  /** nav link label for the Map / 图谱 page */
  'nav.map': string;
}

const messages: Record<UILang, Messages> = {
  en: {
    'map.orExplore': 'or explore the Map of RL →',
    'map.entering': 'entering the map…',
    'map.aria': 'Explore the Map of RL',
    'nav.map': 'Map',
  },
  zh: {
    'map.orExplore': '或探索 RL 图谱 →',
    'map.entering': '正在进入图谱…',
    'map.aria': '探索 RL 图谱',
    'nav.map': '图谱',
  },
};

/**
 * Translate a UI string for the given language. Falls back to the default
 * language (and then the key itself) so a missing translation never breaks
 * the UI.
 */
export function t<const K extends keyof Messages>(
  lang: UILang,
  key: K,
): string {
  return (
    messages[lang]?.[key] ??
    messages[i18n.defaultLanguage as UILang][key] ??
    key
  );
}
