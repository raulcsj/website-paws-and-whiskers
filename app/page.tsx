import Link from "next/link";
import Image from "next/image";
import { getAllPosts } from "@/lib/posts";
import type { PostMeta } from "@/lib/posts";
import { MetaRow, PostCard, PostCardStacked } from "@/components/PostCard";

// stacked（单列横卡）/ grid（双列竖卡）/ magazine（首篇大图 hero + 其余网格）
const HOME_LAYOUT: string = "grid";
const LOCALE: string = "en";
const IS_ZH = LOCALE === "zh";

// magazine 的首篇大图 hero
function FeaturedHero({ post }: { post: PostMeta }) {
  return (
    <Link
      href={`/${post.slug}`}
      className="group relative block overflow-hidden rounded-card aspect-[16/10] sm:aspect-[21/9] bg-canvas shadow-card"
    >
      {post.cover && (
        <Image
          src={post.cover}
          alt={post.title}
          fill
          priority
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 1024px) 100vw, 896px"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
        <MetaRow post={post} light />
        <h2 className="mt-3 font-display text-2xl sm:text-4xl font-bold text-white leading-tight max-w-3xl">
          {post.title}
        </h2>
        <p className="mt-3 text-sm sm:text-base text-white/85 max-w-2xl line-clamp-2 hidden sm:block">
          {post.description}
        </p>
      </div>
    </Link>
  );
}

function SectionHeading() {
  return (
    <div className="mb-5 sm:mb-8">
      <p className="kicker">{IS_ZH ? "最新" : "Latest"}</p>
      <h2 className="font-display text-2xl sm:text-3xl font-bold mt-1">
        {IS_ZH ? "最新文章" : "Latest Articles"}
      </h2>
    </div>
  );
}

export default function Home() {
  const posts = getAllPosts();
  if (posts.length === 0) {
    return (
      <div className="rounded-card bg-surface p-10 sm:p-16 text-center shadow-card ring-1 ring-line">
        <p className="text-muted">
          {IS_ZH ? "还没有文章，请在 content/ 目录下添加 .mdx 文件。" : "No posts yet. Add .mdx files under content/."}
        </p>
      </div>
    );
  }
  const [featured, ...rest] = posts;
  return (
    <div className="space-y-10 sm:space-y-14">
      {HOME_LAYOUT === "magazine" && featured && (
        <section>
          <FeaturedHero post={featured} />
        </section>
      )}
      {(HOME_LAYOUT === "magazine" || HOME_LAYOUT === "grid") && (
        <section>
          <SectionHeading />
          <div className="grid gap-6 sm:grid-cols-2">
            {(HOME_LAYOUT === "magazine" ? rest : posts).map((p) => (
              <PostCard key={p.slug} post={p} />
            ))}
          </div>
        </section>
      )}
      {HOME_LAYOUT === "stacked" && (
        <section>
          <SectionHeading />
          <div className="space-y-5">
            {posts.map((p) => (
              <PostCardStacked key={p.slug} post={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
