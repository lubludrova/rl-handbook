import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';

import { BellmanPlayground } from '@/components/bellman-playground/BellmanPlayground';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    BellmanPlayground,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
