import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import students from "@/assets/students.jpg";

export const Route = createFileRoute("/academic")({
  head: () => ({
    meta: [
      { title: "Academics | Darusuffa Academy, Kolathur" },
      {
        name: "description",
        content:
          "Traditional Dars, Mukhtasar studies alongside UG/PG education, Hifz training, public speaking and modern facilities at Darusuffa Academy, Kolathur.",
      },
      { property: "og:title", content: "Academics | Darusuffa Academy" },
      {
        property: "og:description",
        content:
          "Integrated Islamic and academic education, enrichment programmes and modern facilities at Vadeesunnah, Kolathur.",
      },
    ],
  }),
  component: Academic,
});

const blocks = [
  {
    title: "Integrated Islamic and Academic Education",
    items: [
      "Traditional Dars system rooted in classical scholarship",
      "Opportunity to pursue undergraduate / postgraduate education alongside Mukhtasar studies",
    ],
  },
  {
    title: "Special Enrichment Programs",
    items: [
      "Special training in Hifz (memorization of the Qur'an)",
      "Skill development in public speaking, literature and communication",
    ],
  },
  {
    title: "Modern Facilities",
    items: [
      "Well-equipped computer lab and library",
      "Dedicated Daura (completion) sessions for Hifz students",
    ],
  },
];

const programmes = [
  { to: "/language-door", label: "Language Door" },
  { to: "/art-literature", label: "Art and Literature" },
  { to: "/ssf-dawa", label: "SSF Da'wa" },
] as const;

function Academic() {
  return (
    <PageShell
      eyebrow="Curriculum"
      title="Academics"
      intro="A classical Dars tradition carried forward with modern academics, enrichment programmes and well-equipped facilities."
    >
      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-[1.1fr_1fr]">
        <div className="space-y-10">
          {blocks.map((block) => (
            <div key={block.title}>
              <h2 className="font-display text-2xl">{block.title}</h2>
              <ul className="mt-4 space-y-3">
                {block.items.map((item) => (
                  <li key={item} className="flex gap-3 text-muted-foreground">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <img
          src={students}
          alt="Students of the Muhyissunna integrated Dars"
          loading="lazy"
          width={1200}
          height={900}
          className="h-full rounded-3xl object-cover shadow-[var(--shadow-soft)]"
        />
      </section>

      <section className="surface-ink px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="eyebrow text-sand">Programmes</p>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {programmes.map((p) => (
              <Link
                key={p.to}
                to={p.to}
                className="rounded-2xl border border-white/15 bg-white/5 p-8 font-display text-xl transition-colors hover:bg-white/10"
              >
                {p.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
