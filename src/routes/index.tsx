import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Settings, Images, GraduationCap, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import {
  useHomeSettings,
  useSiteSettings,
  usePublishedPosts,
  usePublishedGallery,
  filterEventMedia,
  formatDate,
  type Post,
} from "@/lib/cms";
import { MediaViewerModal } from "@/components/site/MediaViewerModal";
import heroBooks from "@/assets/hero-books.jpg";
import quranDark from "@/assets/quran-dark.jpg";
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
  const home = useHomeSettings();
  const site = useSiteSettings();
  const { data: posts } = usePublishedPosts();
  const { data: galleryImages } = usePublishedGallery();
  const [selectedEvent, setSelectedEvent] = useState<Post | null>(null);

  const featured = (posts ?? []).slice(0, 3);
  const activeMedia = selectedEvent ? filterEventMedia(selectedEvent, galleryImages ?? []) : [];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader variant="overlay" />

      <main>
        {/* Hero */}
        <section className="relative min-h-[78vh] overflow-hidden">
          <img
            src={home.heroImage || heroBooks}
            alt="Shelves of classical Islamic texts in the academy library"
            width={1920}
            height={1088}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: "var(--gradient-veil)" }} />
          <div className="relative mx-auto flex w-full min-h-[78vh] max-w-6xl flex-col items-start justify-center px-5 pb-16 pt-32 text-left">
            <h1 className="max-w-3xl font-display text-5xl font-bold leading-[0.95] text-ink-foreground sm:text-7xl">
              {home.heroTitle}
            </h1>
            <p className="mt-4 font-display text-sm uppercase tracking-[0.35em] text-ink-foreground/80">
              {home.heroSubtitle}
            </p>
            {home.heroDescription && (
              <p className="mt-4 max-w-xl text-ink-foreground/80">{home.heroDescription}</p>
            )}
            <div className="mt-9 flex w-full flex-wrap gap-3">
              <a
                href={home.primaryCtaLink}
                className="rounded-full bg-primary px-6 py-3 font-display text-sm text-primary-foreground transition-transform hover:-translate-y-0.5"
              >
                {home.primaryCtaLabel}
              </a>
              <a
                href={home.secondaryCtaLink}
                className="rounded-full border border-white/40 px-6 py-3 font-display text-sm text-ink-foreground transition-colors hover:bg-white/10"
              >
                {home.secondaryCtaLabel}
              </a>
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
              <div className="relative h-full min-h-[260px] sm:min-h-[340px]">
                <img
                  src={home.ourStoryImage || home.welcomeImage || studentsHallAsset.url}
                  alt="Students of Darusuffa Academy studying together in the campus hall"
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/40 via-white/10 to-transparent" />
              </div>
              <div className="flex flex-col justify-center gap-5 p-8">
                <h2 className="font-display text-2xl">{home.welcomeTitle}</h2>
                <p className="whitespace-pre-line text-lg leading-relaxed">{home.welcomeText}</p>
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
              {featured.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col justify-between rounded-2xl bg-white/10 p-7 backdrop-blur-sm"
                >
                  <div>
                    {item.kind === "upcoming" && (
                      <span className="rounded-md bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">
                        Upcoming
                      </span>
                    )}
                    <p className="mt-4 text-sm text-ink-foreground/70">
                      {item.event_time || formatDate(item.event_date ?? item.created_at)}
                    </p>
                    <h3 className="mt-2 font-display text-2xl">{item.title}</h3>
                    <p className="mt-3 text-sm text-ink-foreground/80">{item.summary}</p>
                  </div>
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Link
                      to="/news"
                      hash={item.slug}
                      className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground transition hover:opacity-90"
                    >
                      Continue reading
                    </Link>
                    <button
                      id={`home-event-media-btn-${item.slug}`}
                      type="button"
                      onClick={() => setSelectedEvent(item)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-ink-foreground transition hover:bg-white/20"
                    >
                      <Images size={15} />
                      <span>Media</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <p className="mt-24 text-center font-display text-3xl sm:text-4xl">
              "{site.footerText}"
            </p>
          </div>
        </section>
      </main>

      {/* Student Portal Option - Placed immediately above footer */}
      <section
        id="student-portal-banner"
        aria-label="Student Portal"
        className="border-t border-border/40 bg-gradient-to-b from-background via-secondary/20 to-background py-10 sm:py-14"
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-ink p-6 text-white shadow-2xl sm:p-8 md:p-10">
            {/* Ambient aesthetic glow */}
            <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-12 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

            <div className="relative z-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div className="max-w-xl space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                  <GraduationCap size={14} />
                  <span>Darusuffa Students</span>
                </div>
                <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Student Portal
                </h2>
                <p className="text-sm text-white/70 sm:text-base">
                  Login to submit and manage your works. Share your speeches, poems, articles,
                  essays, and drawings with the academy.
                </p>
              </div>

              <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                <Link
                  to="/student-login"
                  id="home-student-portal-login-btn"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl active:translate-y-0"
                >
                  <GraduationCap size={18} />
                  <span>Student Login</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />

      <MediaViewerModal
        isOpen={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent?.title ?? "Event"}
        subtitle={selectedEvent?.event_date ? formatDate(selectedEvent.event_date) : undefined}
        media={activeMedia}
      />

      <Link
        to="/admin-login"
        aria-label="Admin Login"
        className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-2 font-enquiry text-xs text-foreground/70 shadow-md backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-background hover:text-foreground hover:shadow-lg sm:bottom-6 sm:right-6 sm:px-4 sm:text-sm"
      >
        <Settings size={14} />
        <span>Admin Login</span>
      </Link>
    </div>
  );
}
