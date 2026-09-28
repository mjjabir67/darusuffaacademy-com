import { Sparkles, ExternalLink, ArrowRight, Palette } from "lucide-react";
import { useAmazioSettings, type AmazioSettings } from "@/lib/cms";

interface AmazioHomeSectionProps {
  settings?: AmazioSettings;
  isPreview?: boolean;
}

export function formatExternalUrl(url?: string): string {
  if (!url || !url.trim()) return "#";
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("//")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function AmazioHomeSection({
  settings: customSettings,
  isPreview = false,
}: AmazioHomeSectionProps) {
  const liveSettings = useAmazioSettings();
  const settings = customSettings || liveSettings;

  if (!settings.enabled && !isPreview) {
    return null;
  }

  const eyebrow = settings.eyebrow?.trim() || "AMAZIO ARTS & KNOWLEDGE FEST";
  const title = settings.title?.trim() || "Amazio Arts & Knowledge Fest";
  const description =
    settings.description?.trim() || "Explore Amazio — Arts, Literature, Knowledge & Creativity";
  const buttonText = settings.buttonText?.trim() || "Visit Amazio";
  const rawUrl = settings.url?.trim() || "https://amazio.darusuffa.org";
  const formattedUrl = formatExternalUrl(rawUrl);
  const openInNewTab = settings.openInNewTab !== false;

  return (
    <section
      id="amazio-arts-fest-section"
      aria-label="Amazio Arts & Knowledge Fest"
      className="relative overflow-hidden border-t border-border/40 bg-gradient-to-b from-background via-primary/5 to-background py-14 sm:py-20"
    >
      {/* Subtle ambient lighting */}
      <div className="pointer-events-none absolute -left-20 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-secondary/15 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-5">
        <div className="overflow-hidden rounded-3xl border border-primary/25 bg-card/90 p-6 shadow-xl backdrop-blur-md sm:p-10 md:p-12">
          <div
            className={`grid items-center gap-8 ${
              settings.imageUrl ? "lg:grid-cols-12" : "text-center max-w-3xl mx-auto"
            }`}
          >
            {/* Content Left / Center */}
            <div className={settings.imageUrl ? "lg:col-span-7 space-y-5" : "space-y-5"}>
              <div
                className={`inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary ${
                  !settings.imageUrl ? "mx-auto" : ""
                }`}
              >
                <Sparkles size={14} />
                <span>{eyebrow}</span>
              </div>

              <h2 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                {title}
              </h2>

              <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
                {description}
              </p>

              <div
                className={`pt-2 flex flex-wrap items-center gap-4 ${
                  !settings.imageUrl ? "justify-center" : ""
                }`}
              >
                <a
                  href={formattedUrl}
                  target={openInNewTab ? "_blank" : "_self"}
                  rel="noopener noreferrer"
                  id="home-visit-amazio-btn"
                  className="group inline-flex items-center gap-2.5 rounded-full bg-primary px-8 py-4 font-display text-sm sm:text-base font-semibold text-primary-foreground shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/95 hover:shadow-xl active:translate-y-0 active:scale-[0.98]"
                >
                  <Palette size={18} className="transition-transform group-hover:rotate-12" />
                  <span>{buttonText}</span>
                  {openInNewTab ? (
                    <ExternalLink
                      size={16}
                      className="opacity-80 transition-transform group-hover:translate-x-0.5"
                    />
                  ) : (
                    <ArrowRight
                      size={16}
                      className="opacity-80 transition-transform group-hover:translate-x-0.5"
                    />
                  )}
                </a>

                {isPreview && (
                  <span className="rounded-full bg-muted px-3 py-1 font-mono text-xs text-muted-foreground">
                    Link: {rawUrl || "(Not set)"}
                  </span>
                )}
              </div>
            </div>

            {/* Optional Promotional Image / Banner */}
            {settings.imageUrl && (
              <div className="lg:col-span-5">
                <div className="group relative overflow-hidden rounded-2xl border border-border bg-muted/40 shadow-md">
                  <img
                    src={settings.imageUrl}
                    alt={title}
                    loading="lazy"
                    className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
