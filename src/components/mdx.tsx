import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';

import { BellmanPlayground } from '@/components/bellman-playground/BellmanPlayground';
import { BilliardsPlayground } from '@/components/billiards/BilliardsPlayground';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    BellmanPlayground,
    BilliardsPlayground,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
