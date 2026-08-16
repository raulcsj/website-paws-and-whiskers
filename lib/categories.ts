import type { PostMeta } from "@/lib/posts";

export type Category = {
  slug: string;
  label: string;
  emoji: string;
  tagline: string;
  description: string;
  match: string[];
};

export const CATEGORIES: Category[] = [
  {
    slug: "dogs",
    label: "Dogs",
    emoji: "🐶",
    tagline: "Care, training & everyday life with dogs",
    description: "Puppy schedules, dog training, and the everyday habits that make life with a dog easier.",
    match: ["dog", "dogs"],
  },
  {
    slug: "cats",
    label: "Cats",
    emoji: "🐱",
    tagline: "Feline behavior & cozy homes",
    description: "Why cats do what they do, and how to build a home they'll love — from cozy corners to happy routines.",
    match: ["cat", "cats"],
  },
  {
    slug: "puppies",
    label: "Puppies",
    emoji: "🐾",
    tagline: "The first year, made manageable",
    description: "Crate training, potty schedules, enrichment, and surviving the puppy stage without losing your mind.",
    match: ["puppy", "puppies"],
  },
  {
    slug: "rescue",
    label: "Rescue",
    emoji: "🏡",
    tagline: "Adoption & the first months home",
    description: "Rescue dogs, adoption reality checks, decompression, and building trust with a shelter pet.",
    match: ["rescue"],
  },
  {
    slug: "training",
    label: "Training",
    emoji: "🎓",
    tagline: "Positive, practical training",
    description: "Step-by-step training and behavior guides built on patience, routine, and positive reinforcement.",
    match: ["training"],
  },
];

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function postsInCategory(posts: PostMeta[], slug: string): PostMeta[] {
  const category = getCategory(slug);
  if (!category) return [];
  return posts.filter((p) =>
    (p.tags || []).some((tag) => category.match.some((term) => tag.toLowerCase().includes(term)))
  );
}
