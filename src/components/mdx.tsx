import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';

import { BellmanPlayground } from '@/components/bellman-playground/BellmanPlayground';
import { BilliardsPlayground } from '@/components/billiards/BilliardsPlayground';
import { ModelFlow } from '@/components/model-based/ModelFlow';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    BellmanPlayground,
    BilliardsPlayground,
    ModelFlow,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
