import { i18n } from '@/lib/i18n';

/**
 * Languages supported by the UI. Keep in sync with `i18n.languages` in
 * `src/lib/i18n.ts` — when a new language (e.g. Russian) is added, add it here
 * and the `satisfies` check below forces every key to be translated for it.
 */
export type UILang = 'en' | 'zh' | 'ru';

/**
 * Resolve the active UI language from a pathname. The default language has no
 * URL prefix (`hideLocale: 'default-locale'`); every other language is
 * prefixed (`/zh/...`, `/ru/...`). Unknown/absent prefixes fall back to the default.
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
  /** language and theme controls */
  'nav.chooseLanguage': string;
  'nav.toggleTheme': string;

  /** engaged-reader prompt */
  'reader.aria': string;
  'reader.dismiss': string;
  'reader.title': string;
  'reader.body': string;
  'reader.feedback': string;
  'reader.star': string;

  /** docs page: copy-as-markdown button label */
  'article.copyMarkdown': string;
  /** docs page: feedback button label */
  'article.feedback': string;
  /** docs page: feedback button label while opening */
  'article.feedbackOpening': string;
  /** docs page: feedback button aria-label */
  'article.feedbackAria': string;

  /** Map page: page heading */
  'map.title': string;
  /** Map page: subtitle under the heading */
  'map.subtitle': string;
  /** Map page: filter panel toggle (open state) */
  'map.hideFilters': string;
  /** Map page: filter panel toggle (closed state) */
  'map.findAlgorithm': string;
  /** Map page: "{count} matches" result counter */
  'map.matches': string;
  /** Map page: clear-filters button */
  'map.clear': string;
  /** Map page: zero-match suggestion */
  'map.noExactMatch': string;
  /** Map page: "Read the chapter →" node link */
  'map.readChapter': string;
  /** Map page: node without chapter */
  'map.chapterComingSoon': string;
  /** Map page: "Start the chapter →" family link */
  'map.startChapter': string;
  /** Map page: family without chapters */
  'map.chaptersComingSoon': string;
  /** Map page: family territory header "{count} nodes" */
  'map.territory': string;
  /** Map page: legend "size = rough use" */
  'map.legendSize': string;
  /** Map page: legend "foundation concept" */
  'map.legendFoundation': string;
  /** Map page: legend "chapter coming soon" */
  'map.legendComingSoon': string;
  /** Map page: zoom controls aria-labels */
  'map.zoomOut': string;
  'map.zoomReset': string;
  'map.zoomIn': string;
  /** Map page: svg aria-label */
  'map.svgAria': string;
  /** Map page: "Show {label} territory" territory aria */
  'map.showTerritory': string;
  /** Map page: node aria when chapter available */
  'map.chapterAvailable': string;
  /** Map page: node aria when chapter coming soon */
  'map.chapterSoon': string;
  /** Map page: close button aria-label */
  'map.close': string;

  /** Map page: finder group axis labels */
  'map.finder.paradigm': string;
  'map.finder.family': string;
  'map.finder.policyLocality': string;
  'map.finder.actionSpace': string;
  'map.finder.policyType': string;
  /** Map page: finder option labels */
  'map.opt.modelFree': string;
  'map.opt.modelBased': string;
  'map.opt.valueBased': string;
  'map.opt.policyBased': string;
  'map.opt.actorCritic': string;
  'map.opt.onPolicy': string;
  'map.opt.offPolicy': string;
  'map.opt.discreteActions': string;
  'map.opt.continuousActions': string;
  'map.opt.stochasticPolicy': string;
  'map.opt.deterministicPolicy': string;
}

const messages: Record<UILang, Messages> = {
  en: {
    'map.orExplore': 'or explore the Map of RL →',
    'map.entering': 'entering the map…',
    'map.aria': 'Explore the Map of RL',
    'nav.map': 'Map',
    'nav.chooseLanguage': 'Choose a language',
    'nav.toggleTheme': 'Toggle theme',

    'reader.aria': 'Enjoying the RL Handbook?',
    'reader.dismiss': 'Dismiss',
    'reader.title': 'Enjoying the handbook?',
    'reader.body': 'Your feedback helps make it better.',
    'reader.feedback': 'Send feedback',
    'reader.star': 'Star on GitHub',

    'map.title': 'The Map of RL',
    'map.subtitle':
      'A curated lineage of handbook methods. Click a node for the chapter, or click a territory to isolate a family.',
    'map.hideFilters': 'Hide filters',
    'map.findAlgorithm': 'Find my algorithm',
    'map.matches': '{count} matches',
    'map.clear': 'Clear',
    'map.noExactMatch':
      'No exact match. Remove "{opt}" to see {count} results.',
    'map.readChapter': 'Read the chapter →',
    'map.chapterComingSoon': 'Chapter coming soon',
    'map.startChapter': 'Start the chapter →',
    'map.chaptersComingSoon': 'Chapters coming soon',
    'map.territory': 'Territory · {count} nodes',
    'map.legendSize': 'size = rough use',
    'map.legendFoundation': '○ foundation concept',
    'map.legendComingSoon': '◌ chapter coming soon',
    'map.zoomOut': 'Zoom out',
    'map.zoomReset': 'Reset view',
    'map.zoomIn': 'Zoom in',
    'map.svgAria': 'Interactive map of reinforcement learning algorithms',
    'map.showTerritory': 'Show {label} territory',
    'map.chapterAvailable': 'Chapter available',
    'map.chapterSoon': 'Chapter coming soon',
    'map.close': 'Close',

    'article.copyMarkdown': 'Copy Markdown',
    'article.feedback': 'Feedback',
    'article.feedbackOpening': 'Opening…',
    'article.feedbackAria': 'Send feedback about this page',


    'map.finder.paradigm': 'Paradigm',
    'map.finder.family': 'Family',
    'map.finder.policyLocality': 'Policy locality',
    'map.finder.actionSpace': 'Action space',
    'map.finder.policyType': 'Policy type',
    'map.opt.modelFree': 'model-free',
    'map.opt.modelBased': 'model-based',
    'map.opt.valueBased': 'value-based',
    'map.opt.policyBased': 'policy-based',
    'map.opt.actorCritic': 'actor-critic',
    'map.opt.onPolicy': 'on-policy',
    'map.opt.offPolicy': 'off-policy',
    'map.opt.discreteActions': 'discrete actions',
    'map.opt.continuousActions': 'continuous actions',
    'map.opt.stochasticPolicy': 'stochastic policy',
    'map.opt.deterministicPolicy': 'deterministic policy',
  },
  zh: {
    'map.orExplore': '或探索 RL 图谱 →',
    'map.entering': '正在进入图谱…',
    'map.aria': '探索 RL 图谱',
    'nav.map': '图谱',
    'nav.chooseLanguage': '选择语言',
    'nav.toggleTheme': '切换主题',

    'reader.aria': '喜欢 RL Handbook 吗？',
    'reader.dismiss': '关闭',
    'reader.title': '喜欢这本手册吗？',
    'reader.body': '你的反馈能帮助我们做得更好。',
    'reader.feedback': '发送反馈',
    'reader.star': '在 GitHub 上加星',

    'map.title': 'RL 图谱',
    'map.subtitle':
      '本手册方法谱系精选图。点击节点阅读对应章节，或点击领域以隔离某个族群。',
    'map.hideFilters': '收起筛选',
    'map.findAlgorithm': '查找我的算法',
    'map.matches': '{count} 个匹配',
    'map.clear': '清除',
    'map.noExactMatch': '没有完全匹配。移除「{opt}」可查看 {count} 条结果。',
    'map.readChapter': '阅读本章 →',
    'map.chapterComingSoon': '章节即将推出',
    'map.startChapter': '开始本章 →',
    'map.chaptersComingSoon': '章节即将推出',
    'map.territory': '领域 · {count} 个节点',

    'article.copyMarkdown': '复制 Markdown',
    'article.feedback': '反馈',
    'article.feedbackOpening': '正在打开…',
    'article.feedbackAria': '反馈本页内容',

    'map.legendSize': '大小 ≈ 使用规模',
    'map.legendFoundation': '○ 基础概念',
    'map.legendComingSoon': '◌ 章节即将推出',
    'map.zoomOut': '缩小',
    'map.zoomReset': '重置视图',
    'map.zoomIn': '放大',
    'map.svgAria': '强化学习算法交互图谱',
    'map.showTerritory': '显示 {label} 领域',
    'map.chapterAvailable': '章节可读',
    'map.chapterSoon': '章节即将推出',
    'map.close': '关闭',

    'map.finder.paradigm': '范式',
    'map.finder.family': '族群',
    'map.finder.policyLocality': '策略交互方式',
    'map.finder.actionSpace': '动作空间',
    'map.finder.policyType': '策略类型',
    'map.opt.modelFree': '无模型',
    'map.opt.modelBased': '基于模型',
    'map.opt.valueBased': '基于值',
    'map.opt.policyBased': '基于策略',
    'map.opt.actorCritic': '演员-评论家',
    'map.opt.onPolicy': '同策略',
    'map.opt.offPolicy': '异策略',
    'map.opt.discreteActions': '离散动作',
    'map.opt.continuousActions': '连续动作',
    'map.opt.stochasticPolicy': '随机策略',
    'map.opt.deterministicPolicy': '确定性策略',
  },
  ru: {
    'map.orExplore': 'или откройте карту RL →',
    'map.entering': 'открываем карту…',
    'map.aria': 'Открыть карту RL',
    'nav.map': 'Карта',
    'nav.chooseLanguage': 'Выбрать язык',
    'nav.toggleTheme': 'Сменить тему',

    'reader.aria': 'Нравится RL Handbook?',
    'reader.dismiss': 'Закрыть',
    'reader.title': 'Нравится хэндбук?',
    'reader.body': 'Ваш отзыв поможет сделать его лучше.',
    'reader.feedback': 'Оставить отзыв',
    'reader.star': 'Поставить звезду на GitHub',

    'map.title': 'Карта RL',
    'map.subtitle':
      'Карта методов из хэндбука и их связей. Нажмите на узел, чтобы открыть главу, или на область, чтобы выделить семейство методов.',
    'map.hideFilters': 'Скрыть фильтры',
    'map.findAlgorithm': 'Подобрать алгоритм',
    'map.matches': '{count} совпадений',
    'map.clear': 'Сбросить',
    'map.noExactMatch':
      'Точного совпадения нет. Уберите «{opt}», чтобы увидеть {count} результатов.',
    'map.readChapter': 'Читать главу →',
    'map.chapterComingSoon': 'Глава скоро появится',
    'map.startChapter': 'Начать главу →',
    'map.chaptersComingSoon': 'Главы скоро появятся',
    'map.territory': 'Область · {count} узлов',
    'map.legendSize': 'размер ≈ распространённость',
    'map.legendFoundation': '○ базовое понятие',
    'map.legendComingSoon': '◌ глава скоро появится',
    'map.zoomOut': 'Уменьшить масштаб',
    'map.zoomReset': 'Сбросить вид',
    'map.zoomIn': 'Увеличить масштаб',
    'map.svgAria': 'Интерактивная карта алгоритмов обучения с подкреплением',
    'map.showTerritory': 'Показать область «{label}»',
    'map.chapterAvailable': 'Глава доступна',
    'map.chapterSoon': 'Глава скоро появится',
    'map.close': 'Закрыть',

    'article.copyMarkdown': 'Копировать Markdown',
    'article.feedback': 'Обратная связь',
    'article.feedbackOpening': 'Открываем…',
    'article.feedbackAria': 'Отправить отзыв об этой странице',

    'map.finder.paradigm': 'Парадигма',
    'map.finder.family': 'Семейство',
    'map.finder.policyLocality': 'Режим сбора данных',
    'map.finder.actionSpace': 'Пространство действий',
    'map.finder.policyType': 'Тип политики',
    'map.opt.modelFree': 'model-free',
    'map.opt.modelBased': 'model-based',
    'map.opt.valueBased': 'value-based',
    'map.opt.policyBased': 'policy-based',
    'map.opt.actorCritic': 'actor-critic',
    'map.opt.onPolicy': 'on-policy',
    'map.opt.offPolicy': 'off-policy',
    'map.opt.discreteActions': 'дискретные действия',
    'map.opt.continuousActions': 'непрерывные действия',
    'map.opt.stochasticPolicy': 'стохастическая политика',
    'map.opt.deterministicPolicy': 'детерминированная политика',
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
