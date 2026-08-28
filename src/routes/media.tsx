import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import students from "@/assets/students.jpg";
import campus from "@/assets/campus.jpg";

export const Route = createFileRoute("/media")({
  head: () => ({
    meta: [
      { title: "Media Gallery | Darusuffa Academy" },
      {
        name: "description",
        content:
          "Photo gallery from Darusuffa Academy programmes — Engspire English camp and Amazio 24 arts fest at Vadeesunnah, Kolathur.",
      },
      { property: "og:title", content: "Media | Darusuffa Academy" },
      {
        property: "og:description",
        content: "Moments from campus programmes, camps and fests at Darusuffa Academy.",
      },
    ],
  }),
  component: Media,
});

const albums = [
  {
    slug: "engspire",
    title: "Engspire",
    caption: "Ten-day English proficiency camp",
    image: students,
  },
  {
    slug: "amazio-2026",
    title: "Amazio 24",
    caption: "Literary and arts fest of the academy",
    image: campus,
  },
];

function Media() {
  return (
    <PageShell
      eyebrow="Gallery"
      title="Media"
      intro="Moments from the programmes, camps and fests of Darusuffa Academy."
    >
      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-20 md:grid-cols-2">
        {albums.map((album) => (
          <Link
            key={album.slug}
            to="/news"
            hash={album.slug}
            className="group overflow-hidden rounded-3xl border border-border shadow-[var(--shadow-soft)]"
          >
            <img
              src={album.image}
              alt={`${album.title} — ${album.caption}`}
              loading="lazy"
              width={1200}
              height={900}
              className="h-72 w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="bg-card p-6">
              <h2 className="font-display text-xl">{album.title} →</h2>
              <p className="text-sm text-muted-foreground">{album.caption}</p>
            </div>
          </Link>
        ))}
      </section>
    </PageShell>
  );
}
