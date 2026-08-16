import type { ReactNode } from "react";

export function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-alt px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-display text-sm font-bold text-ink">{value}</p>
    </div>
  );
}

export function FactCard({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="not-prose my-8 rounded-card bg-surface p-5 shadow-card ring-1 ring-line sm:p-6">
      {title && <p className="kicker">{title}</p>}
      <div className={`grid gap-3 sm:grid-cols-2 ${title ? "mt-4" : ""}`}>{children}</div>
    </section>
  );
}
