import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllPosts } from "@/lib/posts";
import { CATEGORIES, getCategory, postsInCategory } from "@/lib/categories";
import { PostCard } from "@/components/PostCard";
import { SITE_TITLE } from "@/lib/site";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const cat = getCategory(category);
  if (!cat) return {};
  return {
    title: `${cat.label} | ${SITE_TITLE}`,
    description: cat.description,
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const cat = getCategory(category);
  if (!cat) notFound();
  const posts = postsInCategory(getAllPosts(), category);
  return (
    <div>
      <header className="border-b border-line pb-6 mb-8">
        <p className="kicker">Category</p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold mt-2">
          <span aria-hidden className="mr-2">{cat.emoji}</span>
          {cat.label}
        </h1>
        <p className="text-muted mt-2 max-w-xl">{cat.tagline}</p>
        <p className="text-sm text-muted mt-2">
          {posts.length} {posts.length === 1 ? "article" : "articles"}
        </p>
      </header>
      {posts.length === 0 ? (
        <div className="rounded-card bg-surface p-10 text-center shadow-card ring-1 ring-line">
          <p className="text-muted">No articles in this category yet — check back soon.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {posts.map((p) => (
            <PostCard key={p.slug} post={p} />
          ))}
        </div>
      )}
    </div>
  );
}
