import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { useArtLiteratureSettings } from "@/lib/cms";
import { Sparkles, Palette } from "lucide-react";

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
        <section className="mx-auto max-w-6xl px-5 pt-8">
          <div className="overflow-hidden rounded-3xl border border-border shadow-[var(--shadow-soft)]">
            <img
              src={content.imageUrl}
              alt={content.title || "Art and Literature"}
              loading="lazy"
              className="h-72 w-full object-cover sm:h-96 md:h-[420px]"
            />
          </div>
        </section>
      )}

      {/* Main body content / description */}
      {content.bodyContent && (
        <section className="mx-auto max-w-4xl px-5 pt-12 text-center">
          <p className="text-lg leading-relaxed text-muted-foreground sm:text-xl">
            {content.bodyContent}
          </p>
        </section>
      )}

      {/* Dynamic Strand Cards */}
      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-16 sm:grid-cols-2">
        {cards.length > 0 ? (
          cards.map((s, idx) => (
            <article key={s.id || idx} className="card-soft flex flex-col justify-between p-8">
              <div>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Palette size={20} />
                </div>
                <h2 className="font-display text-2xl text-foreground">{s.title}</h2>
                <p className="mt-3 leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            </article>
          ))
        ) : (
          <div className="col-span-2 rounded-2xl border border-dashed border-border p-12 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-muted-foreground/60" />
            <p className="mt-3 text-sm text-muted-foreground">
              No art and literature items published yet.
            </p>
          </div>
        )}
      </section>

      {/* Moments from Amazio Banner */}
      <section className="surface-ink px-5 py-16">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5">
          <div>
            <p className="font-display text-2xl text-ink-foreground">See moments from Amazio 24</p>
            <p className="mt-1 text-sm text-ink-foreground/70">
              Explore our campus visual gallery and festival highlights
            </p>
          </div>
          <Link
            to="/media"
            className="rounded-full bg-secondary px-6 py-3 font-display text-sm text-secondary-foreground transition-opacity hover:opacity-90"
          >
            Open the gallery
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
