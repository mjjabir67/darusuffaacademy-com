import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { NEWS } from "@/lib/site-data";
import heroBooks from "@/assets/hero-books.jpg";
import quranDark from "@/assets/quran-dark.jpg";
import campus from "@/assets/campus.jpg";
import studentsHallAsset from "@/assets/darusuffa-students-hall.jpg.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Darusuffa Academy | Muhyissunna Integrated Dars, Kolathur" },
      {
        name: "description",
        content:
          "Darusuffa Academy, Vadeesunnah Kolathur — an Islamic integrated educational centre under Irshadiyya Kolathur blending modern academics with Qur'an, Hadith and Fiqh.",
      },
      { property: "og:title", content: "Darusuffa Academy | Educate. Elevate. Empower." },
      {
        property: "og:description",
        content:
          "An Islamic integrated educational centre at Vadeesunnah, Kolathur offering High School, Higher Secondary and Degree studies alongside traditional Dars.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader variant="overlay" />

      <main>
        {/* Hero */}
        <section className="relative min-h-[78vh] overflow-hidden">
          <img
            src={heroBooks}
            alt="Shelves of classical Islamic texts in the academy library"
            width={1920}
            height={1088}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ background: "var(--gradient-veil)" }}
          />
          <div className="relative mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-center px-5 pb-16 pt-32">
            <h1 className="font-display text-5xl font-bold leading-[0.95] text-ink-foreground sm:text-7xl">
              DARUSUFFA
              <br />
              ACADEMY
            </h1>
            <p className="mt-4 font-display text-sm uppercase tracking-[0.35em] text-ink-foreground/80">
              Muhyisunna Integrated Dars
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                to="/admission"
                className="rounded-full bg-primary px-6 py-3 font-display text-sm text-primary-foreground transition-transform hover:-translate-y-0.5"
              >
                Apply for admission
              </Link>
              <Link
                to="/about"
                className="rounded-full border border-white/40 px-6 py-3 font-display text-sm text-ink-foreground transition-colors hover:bg-white/10"
              >
                Know us
              </Link>
            </div>
          </div>
        </section>

        {/* Story + news over dark quran backdrop */}
        <section className="relative overflow-hidden">
          <img
            src={quranDark}
            alt=""
            aria-hidden
            loading="lazy"
            width={1920}
            height={1200}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[oklch(0.18_0.014_60)]/85" />

          <div className="relative mx-auto max-w-6xl px-5 py-24 text-ink-foreground">
            <div className="grid items-stretch gap-0 overflow-hidden rounded-3xl bg-white/10 backdrop-blur-sm md:grid-cols-2">
              <div className="relative h-full">
                <img
                  src={studentsHallAsset.url}
                  alt="Students of Darusuffa Academy studying together in the campus hall"
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/40 via-white/10 to-transparent" />
              </div>
              <div className="flex flex-col justify-center gap-5 p-8">
                <p className="text-lg leading-relaxed">
                  In 2018, under the patronage of Kolathur Irshadiyya, a new chapter began
                  with the founding of Darussuffa Academy at Vadi Sunnah.
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    to="/about"
                    className="text-sm underline underline-offset-4 opacity-80 hover:opacity-100"
                  >
                    Read more
                  </Link>
                  <Link
                    to="/about"
                    hash="chairman"
                    className="rounded-md bg-secondary px-4 py-2 font-display text-sm text-secondary-foreground"
                  >
                    Chairman's Address
                  </Link>
                </div>
              </div>
            </div>

            <h2 className="rule-heading mx-auto mt-24 max-w-4xl justify-center font-display text-xl">
              News &amp; Events
            </h2>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {NEWS.map((item) => (
                <article
                  key={item.slug}
                  className="flex flex-col justify-between rounded-2xl bg-white/10 p-7 backdrop-blur-sm"
                >
                  <div>
                    {item.tag === "Upcoming" && (
                      <span className="rounded-md bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">
                        Upcoming
                      </span>
                    )}
                    <p className="mt-4 text-sm text-ink-foreground/70">{item.date}</p>
                    <h3 className="mt-2 font-display text-2xl">{item.title}</h3>
                    <p className="mt-3 text-sm text-ink-foreground/80">{item.summary}</p>
                  </div>
                  <Link
                    to="/news"
                    hash={item.slug}
                    className="mt-6 self-start rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
                  >
                    Continue reading
                  </Link>
                </article>
              ))}
            </div>

            <p className="mt-24 text-center font-display text-3xl sm:text-4xl">
              "Educate. Elevate. Empower."
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
