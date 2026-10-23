/** A static, theme-aware reading aid: no client runtime or disclosure needed. */
export function ModelFlow({ steps, caption }: { steps: string[]; caption: string }) {
  return <figure className="not-prose my-6 rounded-lg border border-fd-border bg-fd-card p-4">
    <ol className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
      {steps.map((step, index) => <li key={step} className="flex items-center gap-3 rounded-md border border-fd-border bg-fd-secondary/40 p-3 text-sm">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-fd-border font-mono text-xs text-fd-muted-foreground">{index + 1}</span>
        <span>{step}</span>
      </li>)}
    </ol>
    <figcaption className="mt-3 text-xs leading-relaxed text-fd-muted-foreground">{caption}</figcaption>
  </figure>;
}
