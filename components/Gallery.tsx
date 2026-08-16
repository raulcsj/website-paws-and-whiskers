import type { ReactNode } from "react";

export default function Gallery({ children, columns = 2 }: { children: ReactNode; columns?: 2 | 3 }) {
  const cols = columns === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2";
  return <div className={`not-prose my-8 grid gap-4 ${cols} [&_figure]:my-0`}>{children}</div>;
}
