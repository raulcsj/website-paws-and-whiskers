import { getAllPosts } from "@/lib/posts";
import { CATEGORIES } from "@/lib/categories";
import { SITE_URL } from "@/lib/site";
import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_URL.replace(/\/+$/, "");
  const staticPages = ["/about", "/contact", "/privacy"].map((p) => ({
    url: `${base}${p}`,
  }));
  const categories = CATEGORIES.map((c) => ({
    url: `${base}/category/${c.slug}`,
  }));
  const posts = getAllPosts().map((p) => ({
    url: `${base}/${p.slug}`,
    lastModified: p.date,
  }));
  return [{ url: base, lastModified: new Date().toISOString() }, ...staticPages, ...categories, ...posts];
}
