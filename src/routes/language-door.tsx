import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import students from "@/assets/students.jpg";
import { useLanguageDoorSettings } from "@/lib/cms";
import { Globe, Languages } from "lucide-react";

export const Route = createFileRoute("/language-door")({
  head: () => ({
    meta: [
      { title: "Language Door | Darusuffa Academy" },
      {
        name: "description",
        content:
          "Language Door at Darusuffa Academy builds fluency in Arabic, English, Urdu and Malayalam through daily practice, camps and public speaking sessions.",
      },
      { property: "og:title", content: "Language Door | Darusuffa Academy" },
      {
        property: "og:description",
        content:
          "The language wing of Darusuffa Academy — Arabic, English, Urdu and Malayalam fluency programmes.",
      },
    ],
  }),
  component: LanguageDoor,
});

function LanguageDoor() {
  const content = useLanguageDoorSettings();
  const languages = content.languages || [];

  return (
    <PageShell
      eyebrow={content.eyebrow || "Academic wing"}
      title={content.title || "Language Door"}
      intro={
        content.intro ||
        "A dedicated wing that opens the doors of language — so that knowledge learned is knowledge shared."
      }
    >
      {/* Optional Body Content */}
      {content.bodyContent && (
        <section className="mx-auto max-w-4xl px-5 pt-8 text-center">
          <p className="text-lg leading-relaxed text-muted-foreground sm:text-xl">
            {content.bodyContent}
          </p>
        </section>
      )}

      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-[1fr_1fr]">
        <div className="grid gap-5">
          {languages.length > 0 ? (
            languages.map((lang, idx) => (
              <article key={lang.id || idx} className="card-soft p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Languages size={18} />
                  </div>
                  <h2 className="font-display text-xl text-foreground">{lang.name}</h2>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{lang.note}</p>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center">
              <Globe className="mx-auto h-8 w-8 text-muted-foreground/60" />
              <p className="mt-2 text-sm text-muted-foreground">No language wings published yet.</p>
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-3xl border border-border shadow-[var(--shadow-soft)]">
          <img
            src={content.imageUrl || students}
            alt={content.title || "Students at a Language Door session"}
            loading="lazy"
            width={1200}
            height={900}
            className="h-full min-h-[300px] w-full object-cover"
          />
        </div>
      </section>
    </PageShell>
  );
}
