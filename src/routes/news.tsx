import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { NEWS } from "@/lib/site-data";

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "News & Events | Darusuffa Academy" },
      {
        name: "description",
        content:
          "Latest news and events from Darusuffa Academy — Engspire English camp, Amazio arts fest and the Noorvia spiritual journey.",
      },
      { property: "og:title", content: "News & Events | Darusuffa Academy" },
      {
        property: "og:description",
        content:
          "Updates from campus life at Darusuffa Academy, Vadeesunnah, Kolathur.",
      },
    ],
  }),
  component: News,
});

function News() {
  return (
    <PageShell
      eyebrow="Updates"
      title="Latest news & updates"
      intro="Camps, fests and programmes from the campus at Vadeesunnah."
    >
      <section className="mx-auto max-w-4xl space-y-8 px-5 py-20">
        {NEWS.map((item) => (
          <article key={item.slug} id={item.slug} className="card-soft scroll-mt-24 p-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-md bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">
                {item.tag}
              </span>
              <span className="text-sm text-muted-foreground">{item.date}</span>
            </div>
            <h2 className="mt-4 font-display text-3xl">{item.title}</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">{item.body}</p>
          </article>
        ))}
      </section>
    </PageShell>
  );
}
