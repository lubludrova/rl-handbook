import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <h1
        className="font-heading font-bold"
        style={{
          fontSize: 'clamp(4rem, 10vw, 8rem)',
          letterSpacing: '-0.03em',
          color: 'var(--color-fd-foreground)',
          lineHeight: 1,
        }}
      >
        404
      </h1>
      <p
        className="font-body mt-4"
        style={{
          fontSize: '1.15rem',
          lineHeight: 1.6,
          color: 'var(--color-fd-muted-foreground)',
        }}
      >
        This page does not exist.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <Link
          href="/docs"
          className="cta-btn inline-block font-heading font-semibold text-sm uppercase rounded-none px-8 py-3"
          style={{
            letterSpacing: '0.08em',
            background: 'var(--color-fd-primary)',
            color: 'var(--color-fd-primary-foreground)',
          }}
        >
          Browse Docs
        </Link>
        <Link
          href="/"
          className="icon-link inline-block font-heading font-semibold text-sm uppercase px-8 py-3"
          style={{
            letterSpacing: '0.08em',
            color: 'var(--color-fd-muted-foreground)',
            border: '1px solid var(--color-fd-border)',
          }}
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
