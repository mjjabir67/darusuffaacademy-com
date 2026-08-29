import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";

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

const strands = [
  {
    title: "Amazio Arts Fest",
    body: "The flagship literary fest of the institution — a vibrant celebration of knowledge, creativity and cultural expression across the campus.",
  },
  {
    title: "Magazines",
    body: "Student-run periodicals carrying essays, poetry, research notes and reflections in Arabic, English and Malayalam.",
  },
  {
    title: "Calligraphy & Design",
    body: "Workshops in Arabic calligraphy and visual design, connecting classical aesthetics with modern tools.",
  },
  {
    title: "Oratory & Debate",
    body: "Regular stages for public speaking, debate and recitation that build confidence and clarity.",
  },
];

function ArtLiterature() {
  return (
    <PageShell
      eyebrow="Academic wing"
      title="Art and Literature"
      intro="Creativity as an extension of scholarship — writing, speech and art nurtured alongside the Dars."
    >
      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-20 sm:grid-cols-2">
        {strands.map((s) => (
          <article key={s.title} className="card-soft p-8">
            <h2 className="font-display text-2xl">{s.title}</h2>
            <p className="mt-3 text-muted-foreground">{s.body}</p>
          </article>
        ))}
      </section>

      <section className="surface-ink px-5 py-16">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5">
          <p className="font-display text-2xl">See moments from Amazio 24</p>
          <Link
            to="/media"
            className="rounded-full bg-secondary px-6 py-3 font-display text-sm text-secondary-foreground"
          >
            Open the gallery
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
