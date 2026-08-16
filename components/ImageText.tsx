import Image from "next/image";
import type { ReactNode } from "react";

const ASPECT_CLASSES = {
  "3/2": "aspect-[3/2]",
  "4/3": "aspect-[4/3]",
  "1/1": "aspect-square",
  "16/9": "aspect-video",
} as const;

export type ImageTextAspect = keyof typeof ASPECT_CLASSES;
export type ImageTextSide = "left" | "right";

export default function ImageText({
  src,
  alt,
  side = "left",
  aspect = "4/3",
  caption,
  credit,
  children,
}: {
  src: string;
  alt: string;
  side?: ImageTextSide;
  aspect?: ImageTextAspect;
  caption?: string;
  credit?: string;
  children: ReactNode;
}) {
  const image = (
    <figure className="overflow-hidden rounded-card bg-surface-alt shadow-card">
      <div className={`relative w-full ${ASPECT_CLASSES[aspect] ?? ASPECT_CLASSES["4/3"]}`}>
        <Image src={src} alt={alt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
      </div>
      {(caption || credit) && (
        <figcaption className="border-t border-line px-4 py-2.5 text-xs text-muted">
          {caption && <span>{caption}</span>}
          {caption && credit && (
            <span className="mx-1.5" aria-hidden>
              ·
            </span>
          )}
          {credit && <span>{credit}</span>}
        </figcaption>
      )}
    </figure>
  );

  return (
    <div className="not-prose my-8 grid items-center gap-6 md:grid-cols-2 md:gap-8">
      {side === "right" ? (
        <>
          <div className="prose max-w-none">{children}</div>
          {image}
        </>
      ) : (
        <>
          {image}
          <div className="prose max-w-none">{children}</div>
        </>
      )}
    </div>
  );
}
