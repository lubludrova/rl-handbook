import { source } from '@/lib/source';
import { createFromSource } from 'fumadocs-core/search/server';

const search = createFromSource(source);

export async function GET(request: Request) {
  return search.GET(request);
}
