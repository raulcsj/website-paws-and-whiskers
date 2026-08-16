import Link from "next/link";
import type { Metadata } from "next";
import { SITE_TITLE, SITE_DESC } from "@/lib/site";

export const metadata: Metadata = {
  title: `About | ${SITE_TITLE}`,
  description: `What ${SITE_TITLE} is about: ${SITE_DESC}`,
};

export default function AboutPage() {
  return (
    <article>
      <Link href="/" className="text-sm text-muted hover:text-accent">← Back to home</Link>
      <div className="mt-4 mb-8 pb-5 border-b border-line">
        <p className="kicker">About</p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold mt-2">About {SITE_TITLE}</h1>
      </div>
      <div className="prose max-w-none">
        <p>{SITE_TITLE} is an independent pet-care blog for cat and dog owners who want practical, honest advice — not trends.</p>
        <p>We write about everyday life with pets: adoption and rescue, puppy and kitten routines, training, enrichment, health basics, and the small problems that come up at home. Every article is written from hands-on experience and checked against current veterinary and behavior guidance.</p>
        <p>{SITE_DESC}</p>
        <p>We publish new articles a few times a month. If you spot something out of date, or you have a topic you'd like covered, use the contact page — we read every message.</p>
      </div>
    </article>
  );
}
