import Link from "next/link";
import type { Metadata } from "next";
import { SITE_TITLE, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: `Privacy Policy | ${SITE_TITLE}`,
  description: `${SITE_TITLE}'s privacy policy: what we collect, cookies, and third-party advertising.`,
};

export default function PrivacyPage() {
  return (
    <article>
      <Link href="/" className="text-sm text-muted hover:text-accent">← Back to home</Link>
      <div className="mt-4 mb-8 pb-5 border-b border-line">
        <p className="kicker">Privacy</p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold mt-2">Privacy Policy</h1>
      </div>
      <div className="prose max-w-none">
        <p>Effective date: {new Date().toISOString().slice(0, 10)}</p>
        <h2>Information We Collect</h2>
        <p>{SITE_TITLE} is a static blog and does not collect registration or account data. Our hosting provider and third-party services may record standard server logs (IP address, browser type, pages visited) for security and analytics.</p>
        <h2>Cookies and Third-Party Advertising</h2>
        <p>This site may display ads served by Google AdSense. As a third-party vendor, Google uses cookies or web beacons to serve ads based on your visits to this and other websites. You can opt out of personalized advertising at <a href="https://adssettings.google.com">Google Ads Settings</a> or <a href="https://www.aboutads.info">AboutAds</a>.</p>
        <h2>Your Choices</h2>
        <p>You can manage or delete cookies through your browser settings. Disabling cookies does not affect your ability to read this site's content.</p>
        <h2>Contact</h2>
        <p>For privacy questions, contact us via the <Link href="/contact">contact page</Link>. Site address: <a href={SITE_URL}>{SITE_URL}</a></p>
      </div>
    </article>
  );
}
