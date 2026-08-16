import Link from "next/link";
import Image from "next/image";
import type { PostMeta } from "@/lib/posts";

const LOCALE: string = "en";
const IS_ZH = LOCALE === "zh";

export function MetaRow({ post, light }: { post: PostMeta; light?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
      {post.tags?.[0] && (
        <span
          className={`rounded-full px-2.5 py-0.5 font-medium ${
            light ? "bg-white/15 text-white backdrop-blur" : "bg-accent-soft text-accent"
          }`}
        >
          {post.tags[0]}
        </span>
      )}
      <time dateTime={post.date} className={light ? "text-white/75" : "text-muted"}>
        {post.date}
      </time>
    </div>
  );
}

function ReadMore() {
  return (
    <span className="mt-auto pt-2 text-sm font-semibold text-accent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
      {IS_ZH ? "阅读全文 →" : "Read more →"}
    </span>
  );
}

export function PostCard({ post }: { post: PostMeta }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-card bg-surface shadow-card ring-1 ring-line transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
      {post.cover && (
        <Link
          href={`/${post.slug}`}
          className="relative block aspect-[16/10] overflow-hidden bg-canvas"
        >
          <Image
            src={post.cover}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, 50vw"
          />
        </Link>
      )}
      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <MetaRow post={post} />
        <h2 className="font-display text-lg sm:text-xl font-bold leading-snug">
          <Link href={`/${post.slug}`} className="text-ink group-hover:text-accent transition-colors">
            {post.title}
          </Link>
        </h2>
        <p className="text-sm text-muted leading-relaxed line-clamp-2">{post.description}</p>
        <ReadMore />
      </div>
    </article>
  );
}

export function PostCardStacked({ post }: { post: PostMeta }) {
  return (
    <article className="group flex gap-5 sm:gap-7 rounded-card bg-surface p-4 sm:p-5 shadow-card ring-1 ring-line transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover">
      {post.cover && (
        <Link
          href={`/${post.slug}`}
          className="relative shrink-0 w-28 h-28 sm:w-48 sm:h-40 overflow-hidden rounded-xl bg-canvas"
        >
          <Image
            src={post.cover}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="192px"
          />
        </Link>
      )}
      <div className="flex min-w-0 flex-col gap-2">
        <MetaRow post={post} />
        <h2 className="font-display text-lg sm:text-2xl font-bold leading-snug">
          <Link href={`/${post.slug}`} className="text-ink group-hover:text-accent transition-colors">
            {post.title}
          </Link>
        </h2>
        <p className="text-sm text-muted leading-relaxed line-clamp-2">{post.description}</p>
        <ReadMore />
      </div>
    </article>
  );
}
