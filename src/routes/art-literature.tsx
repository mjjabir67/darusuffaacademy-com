import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { useArtLiteratureSettings } from "@/lib/cms";
import { Sparkles, Palette, ExternalLink } from "lucide-react";
import { formatExternalUrl } from "@/components/site/AmazioHomeSection";
import { RevealOnScroll, StaggerContainer } from "@/components/site/AnimationUtils";

export const Route = createFileRoute("/art-literature")({
  head: () => ({
    meta: [
      { title: "Art and Literature | Darusuffa Academy" },
      {
        name: "description",
        content:
          "Art and literature at Darusuffa Academy — Amazio arts fest, campus magazines, calligraphy, oratory and creative writing.",
      },
      { property: "og:title", content: "Art and Literature | Darusuffa Academy" },
      {
        property: "og:description",
        content:
          "Magazines, calligraphy, oratory and the Amazio arts fest at Vadeesunnah, Kolathur.",
      },
    ],
  }),
  component: ArtLiterature,
});

function ArtLiterature() {
  const content = useArtLiteratureSettings();

  const cards = content.cards || [];

  return (
    <PageShell
      eyebrow={content.eyebrow || "Academic wing"}
      title={content.title || "Art and Literature"}
      intro={
        content.intro ||
        "Creativity as an extension of scholarship — writing, speech and art nurtured alongside the Dars."
      }
    >
      {/* Featured Image if uploaded */}
      {content.imageUrl && (
        <RevealOnScroll animation="scale-up">
          <section className="mx-auto max-w-6xl px-5 pt-8">
            <div className="overflow-hidden rounded-3xl border border-border shadow-[var(--shadow-soft)] group">
              <img
                src={content.imageUrl}
                alt={content.title || "Art and Literature"}
                loading="lazy"
                className="h-72 w-full object-cover sm:h-96 md:h-[420px] transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          </section>
        </RevealOnScroll>
      )}

      {/* Main body content / description */}
      {content.bodyContent && (
        <RevealOnScroll animation="fade-up">
          <section className="mx-auto max-w-4xl px-5 pt-12 text-center">
            <p className="text-lg leading-relaxed text-muted-foreground sm:text-xl">
              {content.bodyContent}
            </p>
          </section>
        </RevealOnScroll>
      )}

      {/* Dynamic Strand Cards */}
      <RevealOnScroll animation="fade-up">
        <section className="mx-auto max-w-6xl px-5 py-16">
          {cards.length > 0 ? (
            <StaggerContainer staggerIntervalMs={80} className="grid gap-6 sm:grid-cols-2">
              {cards.map((s, idx) => (
                <article
                  key={s.id || idx}
                  className="card-soft flex flex-col justify-between p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary/40 group"
                >
                  <div>
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                      <Palette size={20} />
                    </div>
                    <h2 className="font-display text-2xl text-foreground font-bold">{s.title}</h2>
                    <p className="mt-3 leading-relaxed text-muted-foreground">{s.body}</p>
                  </div>
                </article>
              ))}
            </StaggerContainer>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center">
              <Sparkles className="mx-auto h-8 w-8 text-muted-foreground/60" />
              <p className="mt-3 text-sm text-muted-foreground">
                No art and literature items published yet.
              </p>
            </div>
          )}
        </section>
      </RevealOnScroll>

      {/* Moments from Amazio Banner */}
      <RevealOnScroll animation="fade-up">
        <section className="surface-ink px-5 py-16">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5">
            <div>
              <p className="font-display text-2xl text-ink-foreground font-bold">
                {content.amazio?.title || "Amazio Arts Fest"}
              </p>
              <p className="mt-1 text-sm text-ink-foreground/70">
                {content.amazio?.description ||
                  "Explore our annual celebration of arts, literature, knowledge and creativity."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {content.amazio?.url && (
                <a
                  href={formatExternalUrl(content.amazio.url)}
                  target={content.amazio.openInNewTab !== false ? "_blank" : "_self"}
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-display text-sm font-semibold text-primary-foreground shadow-md transition-all hover:opacity-90 hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  <span>{content.amazio.buttonText || "Visit Amazio"}</span>
                  <ExternalLink size={14} />
                </a>
              )}
              <Link
                to="/media"
                className="rounded-full bg-secondary px-6 py-3 font-display text-sm text-secondary-foreground transition-all hover:opacity-90 hover:-translate-y-0.5 active:scale-[0.98]"
              >
                Open the gallery
              </Link>
            </div>
          </div>
        </section>
      </RevealOnScroll>
    </PageShell>
  );
}
