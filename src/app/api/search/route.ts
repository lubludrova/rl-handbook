import { source } from '@/lib/source';
import { createFromSource } from 'fumadocs-core/search/server';

const search = createFromSource(source);

export async function GET(request: Request) {
  // TEMPORARY DIAGNOSTIC: log the raw request URL to trace locale handling.
  try {
    const fs = await import('node:fs');
    fs.appendFileSync('./search-diag.log', request.url + '\n');
  } catch {
    // ignore logging errors
  }
  return search.GET(request);
}
