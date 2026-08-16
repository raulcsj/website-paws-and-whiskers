import { Children, cloneElement, isValidElement } from "react";
import type { ReactNode } from "react";

export function Step({ index = 0, children }: { index?: number; children: ReactNode }) {
  return (
    <li className="relative pl-10">
      <span className="absolute left-0 top-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft font-display text-sm font-bold text-accent">
        {index + 1}
      </span>
      <div className="prose max-w-none">{children}</div>
    </li>
  );
}

export function Steps({ title, children }: { title?: string; children: ReactNode }) {
  const items = Children.map(children, (child, index) => {
    if (isValidElement(child) && (child as any).type === Step) {
      return cloneElement(child as any, { index });
    }
    return child;
  });
  return (
    <section className="not-prose my-8 rounded-card bg-surface p-5 shadow-card ring-1 ring-line sm:p-6">
      {title && <p className="kicker">{title}</p>}
      <ol className={`space-y-4 ${title ? "mt-4" : ""}`}>{items}</ol>
    </section>
  );
}
