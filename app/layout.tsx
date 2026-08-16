import "../styles/globals.css";
import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SITE_TITLE, SITE_DESC, SITE_URL } from "@/lib/site";
import CategoryNav from "@/components/CategoryNav";

const LOCALE: string = "en";
const OG_LOCALE = LOCALE === "zh" ? "zh_CN" : "en_US";
const LAYOUT_HEADER: string = "tagline"; // simple | tagline
const CONTAINER_CLASS = "max-w-3xl"; // max-w-2xl | max-w-3xl | max-w-5xl
const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@400;600;700;800&display=swap";
const NAV = OG_LOCALE === "zh_CN"
  ? [
      { href: "/about", label: "关于" },
      { href: "/contact", label: "联系" },
    ]
  : [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
    ];
const FOOTER_NAV = [
  ...NAV,
  { href: "/privacy", label: OG_LOCALE === "zh_CN" ? "隐私政策" : "Privacy" },
];

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESC,
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_TITLE,
    title: SITE_TITLE,
    description: SITE_DESC,
    locale: OG_LOCALE,
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_TITLE,
  description: SITE_DESC,
  url: SITE_URL,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-style="cute">
      <body className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-40 border-b border-line bg-surface shadow-sm">
          <div className={`${CONTAINER_CLASS} mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4`}>
            <div className="min-w-0">
              <a href="/" className="group inline-flex items-baseline gap-2 font-display text-xl sm:text-2xl font-bold tracking-tight text-ink hover:text-accent hover:no-underline">
                <span className="truncate">{SITE_TITLE}</span>
                <span aria-hidden className="inline-block w-2 h-2 -translate-y-0.5 rounded-full bg-accent transition-transform duration-300 group-hover:scale-125" />
              </a>
              {LAYOUT_HEADER === "tagline" && (
                <p className="text-muted text-xs mt-0.5 truncate max-w-[70vw]">{SITE_DESC}</p>
              )}
            </div>
            <nav className="flex items-center gap-5 sm:gap-7 text-sm font-medium">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} className="nav-link text-muted hover:text-ink hover:no-underline transition-colors">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <CategoryNav />
        </header>
        <main className={`flex-1 w-full ${CONTAINER_CLASS} mx-auto px-4 sm:px-6 py-10 sm:py-14`}>{children}</main>
        <footer className="border-t border-line bg-surface-alt">
          <div className={`${CONTAINER_CLASS} mx-auto px-4 sm:px-6 py-10 sm:py-14 grid gap-8 sm:grid-cols-[1.4fr_1fr]`}>
            <div>
              <p className="font-display text-lg font-bold">{SITE_TITLE}</p>
              <p className="text-muted text-sm mt-2 leading-relaxed max-w-md">{SITE_DESC}</p>
            </div>
            <div className="sm:text-right">
              <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm justify-start sm:justify-end">
                <Link href="/" className="text-muted hover:text-accent hover:no-underline">
                  {OG_LOCALE === "zh_CN" ? "首页" : "Home"}
                </Link>
                {FOOTER_NAV.map((item) => (
                  <Link key={item.href} href={item.href} className="text-muted hover:text-accent hover:no-underline">
                    {item.label}
                  </Link>
                ))}
              </nav>
              <p className="text-muted text-xs mt-5">© {new Date().getFullYear()} {SITE_TITLE}</p>
            </div>
          </div>
        </footer>
        {GOOGLE_FONTS_URL && <link rel="stylesheet" href={GOOGLE_FONTS_URL} />}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </body>
    </html>
  );
}
