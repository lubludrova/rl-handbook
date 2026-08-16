'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

type ResolvedTheme = 'light' | 'dark';

export interface ThemeProviderProps {
  children: ReactNode;
  attribute?: string;
  defaultTheme?: string;
  enableSystem?: boolean;
  enableColorScheme?: boolean;
  storageKey?: string;
  themes?: string[];
  value?: Record<string, string>;
  forcedTheme?: string;
  disableTransitionOnChange?: boolean;
}

interface ThemeContextValue {
  theme: string;
  setTheme: (theme: string) => void;
  resolvedTheme: ResolvedTheme;
  themes: string[];
  systemTheme?: ResolvedTheme;
  forcedTheme?: string;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'theme';
const DEFAULT_THEME = 'system';
const THEMES = ['light', 'dark', 'system'];
const ENABLE_SYSTEM = true;

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function resolve(theme: string): ResolvedTheme {
  return theme === 'system' ? getSystemTheme() : (theme as ResolvedTheme);
}

function applyTheme(theme: string) {
  const root = document.documentElement;
  const resolved = resolve(theme);
  root.classList.remove('light', 'dark');
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
}

/**
 * Synchronously apply the stored theme as early as possible, at module load
 * time on the client. This replaces the previous inline `<script>` in the
 * layout (which triggered React 19's "script tag while rendering" warning)
 * and still prevents the light/dark flash before hydration.
 */
declare global {
  // eslint-disable-next-line no-var
  var __themeApplied: boolean | undefined;
}

if (typeof window !== 'undefined' && !globalThis.__themeApplied) {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME;
    applyTheme(stored);
  } catch {
    // ignore storage / DOM errors
  }
  globalThis.__themeApplied = true;
}

/**
 * A drop-in replacement for `next-themes` that does NOT render an inline
 * `<script>` element (which triggers the React 19
 * "Encountered a script tag while rendering React component" warning during
 * client navigations). The anti-flash script is instead injected once from the
 * root layout's `<head>` as a plain string.
 */
export function ThemeProvider({
  children,
  defaultTheme = DEFAULT_THEME,
  enableSystem = ENABLE_SYSTEM,
  storageKey = STORAGE_KEY,
  themes = THEMES,
  forcedTheme,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<string>(() => {
    if (typeof window === 'undefined') return defaultTheme;
    return window.localStorage.getItem(storageKey) || defaultTheme;
  });
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    if (typeof window === 'undefined') return 'light';
    return resolve(window.localStorage.getItem(storageKey) || defaultTheme);
  });

  // Apply on mount (keeps DOM in sync with storage, no-op if already applied).
  useEffect(() => {
    const stored = localStorage.getItem(storageKey) || defaultTheme;
    setThemeState(stored);
    const resolved = resolve(stored);
    setResolvedTheme(resolved);
    applyTheme(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React to system preference changes while in `system` mode.
  useEffect(() => {
    if (!enableSystem) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (theme === 'system') {
        const resolved = getSystemTheme();
        setResolvedTheme(resolved);
        applyTheme('system');
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme, enableSystem]);

  const setTheme = useCallback(
    (next: string) => {
      setThemeState(next);
      try {
        localStorage.setItem(storageKey, next);
      } catch {
        // ignore storage errors (e.g. private mode)
      }
      const resolved = resolve(next);
      setResolvedTheme(resolved);
      applyTheme(next);
    },
    [storageKey],
  );

  const value: ThemeContextValue = {
    theme: forcedTheme ?? theme,
    setTheme,
    resolvedTheme,
    themes,
    systemTheme: getSystemTheme(),
    forcedTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: DEFAULT_THEME,
      setTheme: () => {},
      resolvedTheme: 'light',
      themes: THEMES,
    };
  }
  return ctx;
}

export default ThemeProvider;
