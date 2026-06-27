import { NextRequest, NextResponse } from 'next/server';

const BYPASS_COOKIE = 'rlh_preview';

export function proxy(req: NextRequest) {
  if (process.env.MAINTENANCE_MODE !== 'true') {
    return NextResponse.next();
  }

  const bypassSecret = process.env.MAINTENANCE_BYPASS;
  const url = req.nextUrl;

  if (bypassSecret) {
    const previewParam = url.searchParams.get('preview');
    if (previewParam === bypassSecret) {
      const cleanUrl = new URL(url);
      cleanUrl.searchParams.delete('preview');
      const res = NextResponse.redirect(cleanUrl);
      res.cookies.set(BYPASS_COOKIE, bypassSecret, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });
      return res;
    }

    if (req.cookies.get(BYPASS_COOKIE)?.value === bypassSecret) {
      return NextResponse.next();
    }
  }

  return new NextResponse(MAINTENANCE_HTML, {
    status: 503,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'retry-after': '3600',
      'x-robots-tag': 'noindex',
    },
  });
}

export const config = {
  matcher: ['/((?!_vercel).*)'],
};

const MAINTENANCE_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>RL Handbook — coming soon</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<style>
  html, body { margin: 0; padding: 0; height: 100%; }
  body {
    display: grid;
    place-items: center;
    background: #FFFFFF;
    color: #0A0A0A;
    font-family: ui-monospace, "SF Mono", Menlo, Monaco, Consolas, monospace;
  }
  .box { text-align: center; padding: 2rem; max-width: 32rem; }
  h1 {
    font-weight: 700;
    font-size: clamp(1.75rem, 4vw, 2.75rem);
    letter-spacing: -0.03em;
    margin: 0 0 0.75rem;
  }
  p { color: #555555; margin: 0; line-height: 1.6; }
</style>
</head>
<body>
  <main class="box">
    <h1>RL Handbook</h1>
    <p>Coming soon.</p>
  </main>
</body>
</html>`;
