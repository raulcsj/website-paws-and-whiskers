import Link from "next/link";
import type { Metadata } from "next";
import { SITE_TITLE } from "@/lib/site";

export const metadata: Metadata = {
  title: `Contact | ${SITE_TITLE}`,
  description: `Get in touch with ${SITE_TITLE}: feedback, corrections, and partnership enquiries.`,
};

export default function ContactPage() {
  return (
    <article>
      <Link href="/" className="text-sm text-muted hover:text-accent">← Back to home</Link>
      <div className="mt-4 mb-8 pb-5 border-b border-line">
        <p className="kicker">Contact</p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold mt-2">Contact Us</h1>
      </div>
      <div className="prose max-w-none">
        <p>Questions, corrections, or partnership ideas? Email us at <a href="mailto:hello@pawsandwhiskers.pet">hello@pawsandwhiskers.pet</a>. We usually reply within a few days.</p>
        <p>Please don't use this address for urgent pet health problems — call your veterinarian or an emergency animal hospital instead.</p>
      </div>
    </article>
  );
}
