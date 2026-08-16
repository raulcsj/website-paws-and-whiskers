import type { ReactNode } from "react";

export default function PullQuote({ children, cite }: { children: ReactNode; cite?: string }) {
  return (
    <blockquote className="not-prose my-10 border-l-2 border-accent pl-5 sm:pl-8">
      <p className="font-display text-xl font-bold leading-snug text-ink sm:text-2xl">{children}</p>
      {cite && <cite className="mt-3 block text-sm not-italic text-muted">{cite}</cite>}
    </blockquote>
  );
}
