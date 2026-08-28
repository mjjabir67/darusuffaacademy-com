import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

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
        <section className="surface-ink px-5 py-16">
          <div className="mx-auto max-w-6xl">
            {eyebrow && <p className="eyebrow text-sand">{eyebrow}</p>}
            <h1 className="mt-3 font-display text-4xl sm:text-5xl">{title}</h1>
            {intro && (
              <p className="mt-4 max-w-2xl text-ink-foreground/80">{intro}</p>
            )}
          </div>
        </section>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
