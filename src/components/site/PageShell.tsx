import { useState, useEffect, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import bannerAsset from "@/assets/darusuffa-banner-flipped.png.asset.json";
import { usePageBanner } from "@/lib/cms";

export function PageShell({
  eyebrow,
  title,
  intro,
  bannerKey,
  bannerImage,
  children,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  bannerKey?: string;
  bannerImage?: string | null;
  children: ReactNode;
}) {
  // Infer page key from router path if not explicitly provided (e.g. /about -> about)
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  });

  const resolvedKey = bannerKey || pathname.replace(/^\//, "").split("/")[0] || "about";

  const bannerFromSettings = usePageBanner(resolvedKey);
  const activeBannerUrl = bannerImage !== undefined ? bannerImage : bannerFromSettings;

  const [imageError, setImageError] = useState(false);

  // Reset error state if the banner URL updates
  useEffect(() => {
    setImageError(false);
  }, [activeBannerUrl]);

  const hasCustomBanner = Boolean(activeBannerUrl) && !imageError;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section
          id={`page-hero-banner-${resolvedKey}`}
          className="relative overflow-hidden px-5 py-20 sm:py-28"
        >
          {/* Custom Banner Background */}
          {hasCustomBanner ? (
            <div className="absolute inset-0 z-0">
              <img
                src={activeBannerUrl!}
                alt=""
                aria-hidden="true"
                className="h-full w-full object-cover object-center pointer-events-none select-none transition-opacity duration-300"
                onError={() => setImageError(true)}
              />
              {/* Subtle readability overlay: keeps text legible across themes without obscuring the photo */}
              <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/75 to-ink/40 dark:from-ink/95 dark:via-ink/80 dark:to-ink/50" />
            </div>
          ) : (
            /* System Default Fallback Background */
            <div
              className="absolute inset-0 z-0"
              style={{
                backgroundImage: `url(${bannerAsset.url})`,
                backgroundPosition: "center right",
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/40" />
            </div>
          )}

          {/* Banner Content */}
          <div className="relative z-10 mx-auto max-w-6xl">
            {eyebrow && <p className="eyebrow text-sand">{eyebrow}</p>}
            <h1 className="mt-3 max-w-2xl font-display text-4xl text-ink-foreground sm:text-5xl">
              {title}
            </h1>
            {intro && <p className="mt-4 max-w-2xl text-ink-foreground/80">{intro}</p>}
          </div>
        </section>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
