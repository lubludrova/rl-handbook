import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: pageSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [remarkMath],
    // rehype-katex must run BEFORE fumadocs' rehype-code (Shiki),
    // because remark-math produces <pre><code class="language-math"> nodes
    // that Shiki would otherwise capture as code blocks.
    rehypePlugins: (v) => [rehypeKatex, ...v],
    rehypeCodeOptions: {
      fallbackLanguage: 'text',
    } as never,
  },
});
