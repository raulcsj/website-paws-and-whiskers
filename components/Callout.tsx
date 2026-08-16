import type { ReactNode } from "react";

type CalloutType = "note" | "tip" | "warning";

export default function Callout({
  type = "note",
  title,
  children,
}: {
  type?: CalloutType;
  title: string;
  children: ReactNode;
}) {
  const border = type === "note" ? "border-l-line" : "border-l-accent";
  const background = type === "tip" ? "bg-accent-soft" : "bg-surface-alt";
  return (
    <aside className={`not-prose my-8 rounded-card border-l-2 ${border} ${background} px-5 py-4 ring-1 ring-line`}>
      <p className="kicker">{title}</p>
      <div className="prose mt-3 max-w-none">{children}</div>
    </aside>
  );
}
