import Image from "next/image";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import type { ReactNode } from "react";
import { getAllPosts, getAllSlugs, getPostBySlug, type PostMeta } from "@/lib/posts";
import ArticleImage from "@/components/ArticleImage";
import ImageText from "@/components/ImageText";
import Gallery from "@/components/Gallery";
import Callout from "@/components/Callout";
import PullQuote from "@/components/PullQuote";
import { Steps, Step } from "@/components/Steps";
import { FactCard, Fact } from "@/components/FactCard";
import { SITE_TITLE, SITE_URL } from "@/lib/site";
import type { Metadata } from "next";

const LOCALE: string = "en";
const POST_LAYOUT: string = "cover";
const IS_ZH = LOCALE === "zh";

type Heading = { id: string; text: string; level: 2 | 3 };

function stripMarkdownInline(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .trim();
}

function slugifyHeading(text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[`*_~]/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "section";
}

function extractHeadings(mdx: string): Heading[] {
  const text = mdx.replace(/```[\s\S]*?```/g, "").replace(/~~~[\s\S]*?~~~/g, "");
  const headings: Heading[] = [];
  const re = /^(#{2,3})[ \t]+(.+)$/gm;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const level = match[1].length === 2 ? 2 : 3;
    const label = stripMarkdownInline(match[2]);
    headings.push({ id: slugifyHeading(label), text: label, level });
  }
  return headings.slice(0, 12);
}

function textOf(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number" || typeof node === "bigint") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (typeof node === "object" && "props" in (node as any)) {
    return textOf((node as any).props?.children);
  }
  return "";
}

function getRelatedPosts(all: PostMeta[], meta: PostMeta, slug: string): PostMeta[] {
  const others = all.filter((p) => p.slug !== slug);
  const byTag = others.filter((p) => p.tags?.some((t) => meta.tags?.includes(t)));
  const rest = others.filter((p) => !byTag.includes(p));
  return [...byTag, ...rest].slice(0, 3);
}

const H2 = ({ children }: { children?: ReactNode }) => (
  <h2 id={slugifyHeading(textOf(children))}>{children}</h2>
);

const H3 = ({ children }: { children?: ReactNode }) => (
  <h3 id={slugifyHeading(textOf(children))}>{children}</h3>
);

const MDX_COMPONENTS = {
  ArticleImage,
  ImageText,
  Gallery,
  Callout,
  PullQuote,
  Steps,
  Step,
  FactCard,
  Fact,
  h2: H2,
  h3: H3,
};

function TagChips({ tags, light = false, className = "" }: { tags?: string[]; light?: boolean; className?: string }) {
  if (!tags?.length) return null;
  return (
    <div className={`flex flex-wrap gap-2 text-xs ${className}`}>
      {tags.map((tag) => (
        <span
          key={tag}
          className={
            light
              ? "rounded-full bg-white/15 px-2.5 py-0.5 font-medium text-white backdrop-blur"
              : "rounded-full bg-accent-soft px-2.5 py-0.5 font-medium text-accent"
          }
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

function MetaLine({ date, readingMinutes, light = false }: { date: string; readingMinutes: number; light?: boolean }) {
  return (
    <p className={light ? "text-sm text-white/80" : "text-sm text-muted"}>
      <time dateTime={date}>{date}</time>
      <span className="mx-2" aria-hidden>·</span>
      {IS_ZH ? `约 ${readingMinutes} 分钟阅读` : `${readingMinutes} min read`}
    </p>
  );
}

function Byline() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft font-display text-sm font-bold text-accent">
        {SITE_TITLE.charAt(0)}
      </span>
      <div className="min-w-0 text-sm">
        <p className="truncate font-medium text-ink">{SITE_TITLE}</p>
        <p className="text-muted">{IS_ZH ? "发布者" : "Publisher"}</p>
      </div>
    </div>
  );
}

function TableOfContents({ headings, className = "" }: { headings: Heading[]; className?: string }) {
  if (headings.length < 2) return null;
  return (
    <nav
      className={`rounded-card bg-surface p-5 shadow-card ring-1 ring-line ${className}`}
      aria-label={IS_ZH ? "本页目录" : "Table of contents"}
    >
      <p className="kicker">{IS_ZH ? "本页目录" : "On this page"}</p>
      <ol className="mt-4 space-y-2.5 text-sm">
        {headings.map((h) => (
          <li key={h.id} className={h.level === 3 ? "pl-4" : ""}>
            <a href={`#${h.id}`} className="text-muted transition-colors hover:text-accent">
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function ArticleBody({ content }: { content: string }) {
  return (
    <div className="prose max-w-none mt-8 sm:mt-10">
      <MDXRemote source={content} components={MDX_COMPONENTS} />
    </div>
  );
}

function RelatedPosts({ posts }: { posts: PostMeta[] }) {
  if (posts.length === 0) return null;
  return (
    <section className="mt-14">
      <div className="mb-5">
        <p className="kicker">{IS_ZH ? "延伸阅读" : "Related"}</p>
        <h2 className="mt-1 font-display text-xl font-bold sm:text-2xl">
          {IS_ZH ? "相关文章" : "Related Articles"}
        </h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {posts.map((p) => (
          <Link
            key={p.slug}
            href={`/${p.slug}`}
            className="group flex flex-col overflow-hidden rounded-card bg-surface shadow-card ring-1 ring-line transition-shadow hover:shadow-card-hover"
          >
            {p.cover && (
              <span className="relative block aspect-[16/10] overflow-hidden bg-canvas">
                <Image
                  src={p.cover}
                  alt={p.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
              </span>
            )}
            <span className="flex flex-1 flex-col gap-2 p-4">
              <time className="text-xs text-muted" dateTime={p.date}>{p.date}</time>
              <span className="font-display font-bold leading-snug text-ink transition-colors group-hover:text-accent">
                {p.title}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function PrevNext({ newer, older }: { newer: PostMeta | null; older: PostMeta | null }) {
  if (!newer && !older) return null;
  return (
    <nav className="mt-12 grid gap-4 sm:grid-cols-2" aria-label={IS_ZH ? "文章导航" : "Post navigation"}>
      {older ? (
        <Link
          href={`/${older.slug}`}
          className="group rounded-card bg-surface p-5 shadow-card ring-1 ring-line transition-shadow hover:shadow-card-hover"
        >
          <span className="text-xs text-muted">{IS_ZH ? "← 更早一篇" : "← Older"}</span>
          <span className="mt-1.5 block font-display font-bold leading-snug text-ink transition-colors group-hover:text-accent">
            {older.title}
          </span>
        </Link>
      ) : (
        <span />
      )}
      {newer ? (
        <Link
          href={`/${newer.slug}`}
          className="group rounded-card bg-surface p-5 text-right shadow-card ring-1 ring-line transition-shadow hover:shadow-card-hover"
        >
          <span className="text-xs text-muted">{IS_ZH ? "更新一篇 →" : "Newer →"}</span>
          <span className="mt-1.5 block font-display font-bold leading-snug text-ink transition-colors group-hover:text-accent">
            {newer.title}
          </span>
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { meta } = getPostBySlug(slug);
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: `/${slug}` },
    openGraph: {
      type: "article",
      title: meta.title,
      description: meta.description,
      publishedTime: meta.date,
      images: meta.cover ? [{ url: meta.cover }] : undefined,
    },
  };
}

export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { meta, content } = getPostBySlug(slug);
  const base = SITE_URL.replace(/\/+$/, "");
  const readingMinutes = Math.max(1, Math.round(content.length / 500));
  const all = getAllPosts();
  const index = all.findIndex((p) => p.slug === slug);
  const newer = index > 0 ? all[index - 1] : null;
  const older = index >= 0 && index < all.length - 1 ? all[index + 1] : null;
  const headings = extractHeadings(content);
  const related = getRelatedPosts(all, meta, slug);
  const blogPostingJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: meta.title,
    description: meta.description,
    datePublished: meta.date,
    url: `${base}/${slug}`,
    image: meta.cover ? `${base}${meta.cover}` : undefined,
    author: { "@type": "Person", name: SITE_TITLE },
    publisher: { "@type": "Organization", name: SITE_TITLE },
  };

  return (
    <article>
      {POST_LAYOUT !== "split" && (
        <Link href="/" className="text-sm text-muted hover:text-accent">
          ← {IS_ZH ? "返回首页" : "Back to home"}
        </Link>
      )}

      {POST_LAYOUT === "split" ? (
        <div className="mt-6 grid gap-8 lg:grid-cols-[240px_1fr] lg:gap-10">
          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <TableOfContents headings={headings} />
            <div className="rounded-card bg-surface p-5 shadow-card ring-1 ring-line">
              <Byline />
            </div>
            <Link href="/" className="inline-block text-sm text-muted hover:text-accent">
              ← {IS_ZH ? "返回首页" : "Back to home"}
            </Link>
          </aside>
          <div className="min-w-0">
            <TagChips tags={meta.tags} />
            <h1 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-4xl">{meta.title}</h1>
            <p className="mt-3 text-lg leading-relaxed text-muted">{meta.description}</p>
            <div className="mt-5 border-b border-line pb-6">
              <MetaLine date={meta.date} readingMinutes={readingMinutes} />
            </div>
            {meta.cover && (
              <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-card bg-surface-alt shadow-card">
                <Image
                  src={meta.cover}
                  alt={meta.title}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 800px"
                />
              </div>
            )}
            <ArticleBody content={content} />
          </div>
        </div>
      ) : POST_LAYOUT === "cover" ? (
        <>
          <header className="mt-6 text-center">
            <TagChips tags={meta.tags} className="justify-center" />
            <h1 className="mx-auto mt-4 max-w-3xl font-display text-3xl font-bold leading-tight sm:text-5xl">
              {meta.title}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-muted">{meta.description}</p>
            <div className="mt-5 flex justify-center">
              <MetaLine date={meta.date} readingMinutes={readingMinutes} />
            </div>
          </header>
          {meta.cover && (
            <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-card bg-surface-alt shadow-card">
              <Image
                src={meta.cover}
                alt={meta.title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 896px"
              />
            </div>
          )}
          <TableOfContents headings={headings} className="mt-8" />
          <ArticleBody content={content} />
        </>
      ) : POST_LAYOUT === "minimal" ? (
        <>
          <header className="mt-8">
            <TagChips tags={meta.tags} />
            <h1 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-4xl">{meta.title}</h1>
            <p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted">{meta.description}</p>
            <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-4 border-b border-line pb-5">
              <MetaLine date={meta.date} readingMinutes={readingMinutes} />
              <Byline />
            </div>
          </header>
          {meta.cover && (
            <div className="relative mt-8 aspect-[3/2] max-w-2xl overflow-hidden rounded-card bg-surface-alt shadow-card">
              <Image
                src={meta.cover}
                alt={meta.title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 640px"
              />
            </div>
          )}
          <TableOfContents headings={headings} className="mt-8" />
          <ArticleBody content={content} />
        </>
      ) : (
        <>
          <div className="relative mt-4 aspect-[16/9] overflow-hidden rounded-card bg-surface-alt shadow-card sm:aspect-[21/9]">
            {meta.cover && (
              <Image
                src={meta.cover}
                alt={meta.title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 896px"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" aria-hidden />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
              <TagChips tags={meta.tags} light />
              <h1 className="mt-3 max-w-3xl font-display text-3xl font-bold leading-tight text-white sm:text-5xl">
                {meta.title}
              </h1>
              <MetaLine date={meta.date} readingMinutes={readingMinutes} light />
            </div>
          </div>
          <TableOfContents headings={headings} className="mt-8" />
          <ArticleBody content={content} />
        </>
      )}

      <RelatedPosts posts={related} />
      <PrevNext newer={newer} older={older} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingJsonLd) }} />
    </article>
  );
}
