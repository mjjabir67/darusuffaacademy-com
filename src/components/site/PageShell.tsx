import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import bannerAsset from "@/assets/darusuffa-banner-flipped.png.asset.json";

export function PageShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section
          className="relative overflow-hidden px-5 py-20 sm:py-28"
          style={{
            backgroundImage: `url(${bannerAsset.url})`,
            backgroundPosition: "center right",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/40" />
          <div className="relative mx-auto max-w-6xl">
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
