import { defineConfig, defineCollections } from 'fumadocs-mdx/config';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export const enDocs = defineCollections({
  type: 'doc',
  dir: 'content/docs',
  files: ['**/*.mdx', '!**/*.zh.mdx', '!**/*.ru.mdx'],
  schema: pageSchema,
  async: true,
  postprocess: {
    includeProcessedMarkdown: true,
  },
});

export const zhDocs = defineCollections({
  type: 'doc',
  dir: 'content/docs',
  files: ['**/*.zh.mdx'],
  schema: pageSchema,
  dynamic: true,
});

export const meta = defineCollections({
  type: 'meta',
  dir: 'content/docs',
  files: ['**/*.json'],
  schema: metaSchema,
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
