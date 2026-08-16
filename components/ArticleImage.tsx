import Image from "next/image";

export type ArticleImageVariant = "full" | "left" | "right" | "wide" | "spotlight";
export type ArticleImageAspect = "3/2" | "4/3" | "1/1" | "16/9";

// full：常规全宽；wide：大场景出血（md 起略微加宽）；left/right：细节图浮动在正文旁；
// spotlight：大图压字图注，适合作为小节里的视觉焦点
const VARIANT_CLASSES: Record<ArticleImageVariant, string> = {
  full: "my-6",
  wide: "my-8 md:-mx-8 lg:-mx-14",
  left: "my-6 md:my-4 md:mr-8 md:float-left md:w-[46%]",
  right: "my-6 md:my-4 md:ml-8 md:float-right md:w-[46%]",
  spotlight: "my-8",
};

const ASPECT_CLASSES: Record<ArticleImageAspect, string> = {
  "3/2": "aspect-[3/2]",
  "4/3": "aspect-[4/3]",
  "1/1": "aspect-square",
  "16/9": "aspect-video",
};

export default function ArticleImage({
  src,
  alt,
  caption,
  credit,
  variant = "full",
  aspect = "3/2",
}: {
  src: string;
  alt: string;
  caption?: string;
  credit?: string;
  variant?: ArticleImageVariant;
  aspect?: ArticleImageAspect;
}) {
  const variantClass = VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.full;
  const aspectClass = ASPECT_CLASSES[aspect] ?? ASPECT_CLASSES["3/2"];
  const isSpotlight = variant === "spotlight";

  if (isSpotlight) {
    return (
      <figure className={`not-prose ${variantClass}`}>
        <div className={`relative w-full ${aspectClass} overflow-hidden rounded-card bg-canvas shadow-card`}>
          <Image src={src} alt={alt} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 896px" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" aria-hidden />
          {(caption || credit) && (
            <figcaption className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5">
              {caption && <p className="text-sm font-medium sm:text-base">{caption}</p>}
              {credit && <p className="mt-1 text-xs text-white/75">{credit}</p>}
            </figcaption>
          )}
        </div>
      </figure>
    );
  }

  return (
    <figure className={`not-prose ${variantClass}`}>
      <div className={`relative w-full ${aspectClass} overflow-hidden rounded-lg bg-canvas shadow-sm`}>
        <Image src={src} alt={alt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 700px" />
      </div>
      {(caption || credit) && (
        <figcaption className="mt-2 text-sm text-muted text-center">
          {caption}
          {caption && credit && (
            <span className="mx-1.5" aria-hidden>
              ·
            </span>
          )}
          {credit}
        </figcaption>
      )}
    </figure>
  );
}
