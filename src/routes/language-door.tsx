import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import students from "@/assets/students.jpg";

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

const languages = [
  {
    name: "Arabic",
    note: "Classical grammar, composition and conversation rooted in the Dars tradition.",
  },
  { name: "English", note: "Daily spoken sessions, camps like Engspire and written expression." },
  {
    name: "Urdu",
    note: "Reading and literature circles connecting students to scholarly heritage.",
  },
  { name: "Malayalam", note: "Oratory, essay and creative writing for the wider community." },
];

function LanguageDoor() {
  return (
    <PageShell
      eyebrow="Academic wing"
      title="Language Door"
      intro="A dedicated wing that opens the doors of language — so that knowledge learned is knowledge shared."
    >
      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-[1fr_1fr]">
        <div className="grid gap-5">
          {languages.map((lang) => (
            <article key={lang.name} className="card-soft p-6">
              <h2 className="font-display text-xl">{lang.name}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{lang.note}</p>
            </article>
          ))}
        </div>
        <img
          src={students}
          alt="Students at a Language Door session"
          loading="lazy"
          width={1200}
          height={900}
          className="h-full rounded-3xl object-cover shadow-[var(--shadow-soft)]"
        />
      </section>
    </PageShell>
  );
}
