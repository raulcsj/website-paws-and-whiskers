"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATEGORIES } from "@/lib/categories";

export default function CategoryNav() {
  const pathname = usePathname();
  return (
    <nav className="border-t border-line bg-canvas/70" aria-label="Categories">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-2.5 flex flex-wrap items-center gap-2">
        {CATEGORIES.map((c) => {
          const active = pathname === `/category/${c.slug}`;
          return (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors hover:no-underline ${
                active ? "bg-accent text-white" : "bg-accent-soft text-accent hover:bg-accent hover:text-white"
              }`}
            >
              <span aria-hidden className="mr-1">{c.emoji}</span>
              {c.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
