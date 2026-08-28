import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { FACULTY } from "@/lib/site-data";

export const Route = createFileRoute("/staff")({
  head: () => ({
    meta: [
      { title: "Faculties | Darusuffa Academy, Kolathur" },
      {
        name: "description",
        content:
          "Meet the faculty of Darusuffa Academy, led by Chairman Sayyid Murthala Shihab Saqafi Thiroorkkad at Vadeesunnah, Kolathur.",
      },
      { property: "og:title", content: "Meet our faculties | Darusuffa Academy" },
      {
        property: "og:description",
        content:
          "Scholars and teachers guiding the Muhyissunna Integrated Dars at Darusuffa Academy.",
      },
    ],
  }),
  component: Staff,
});

function Staff() {
  return (
    <PageShell
      eyebrow="Our people"
      title="Meet our faculties"
      intro="Scholars and teachers who guide the academic and spiritual life of the academy."
    >
      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-20 sm:grid-cols-2">
        {FACULTY.map((person) => (
          <article key={person.name} className="card-soft flex items-center gap-5 p-7">
            <div
              aria-hidden
              className="grid h-16 w-16 shrink-0 place-items-center rounded-full brand-gradient font-display text-xl text-primary-foreground"
            >
              {person.name.charAt(0)}
            </div>
            <div>
              <p className="eyebrow">{person.role}</p>
              <h2 className="mt-1 font-display text-xl">{person.name}</h2>
            </div>
          </article>
        ))}
      </section>
    </PageShell>
  );
}
