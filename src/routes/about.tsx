import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import campus from "@/assets/campus.jpg";
import heroBooks from "@/assets/hero-books.jpg";
import quranDark from "@/assets/quran-dark.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Know Us | Darusuffa Academy, Vadeesunnah Kolathur" },
      {
        name: "description",
        content:
          "Darusuffa Academy is an Islamic integrated educational centre run by Irshadiyya Kolathur, blending High School, Higher Secondary and Degree studies with Qur'an, Hadith and Fiqh.",
      },
      { property: "og:title", content: "Know Us | Darusuffa Academy" },
      {
        property: "og:description",
        content:
          "Founded in 2018 at Vadeesunnah, Kolathur — academic excellence and spiritual growth under Irshadiyya Kolathur.",
      },
    ],
  }),
  component: About,
});

function About() {
  return (
    <PageShell
      eyebrow="About the institution"
      title="Know Us"
      intro="Muhyissunna Student's Association — Vadeesunnah, Kolathur"
    >
      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-[1.2fr_1fr]">
        <div className="space-y-5 text-base leading-relaxed">
          <h2 className="font-display text-2xl">Darusuffa Academy</h2>
          <p>
            is an Islamic integrated educational center run by <strong>Irshadiyya
            Kolathur</strong>, committed to academic excellence and spiritual growth. We
            offer a comprehensive curriculum for High School, Higher Secondary
            (Humanities) and Degree students, blending modern education with the timeless
            guidance of Islamic teachings.
          </p>
          <p>
            Through a balanced approach that combines subjects like languages, social
            sciences and humanities with Qur'anic studies, Hadith, Fiqh and moral
            instruction, we aim to shape individuals who are intellectually competent,
            ethically grounded and spiritually conscious.
          </p>
          <p>
            Our goal is to nurture future leaders who uphold Islamic values while
            contributing positively to society and the world at large.
          </p>
        </div>

        <div>
          <img
            src={campus}
            alt="Darusuffa Academy building at Vadeesunnah"
            loading="lazy"
            width={1200}
            height={900}
            className="rounded-3xl object-cover shadow-[var(--shadow-soft)]"
          />
          <Link
            to="/contact"
            className="mt-4 inline-block text-sm text-primary underline underline-offset-4"
          >
            Find us
          </Link>
        </div>
      </section>

      <section className="bg-muted px-5 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
          <p className="text-lg leading-relaxed">
            The institution located at Vadeesunnah in Kolathur was inaugurated by Hon.
            Indian Grand Mufti Sheikh Aboobacker Ahmad in the presence of Sheikh Abdul
            Azeez Khalid Al Athwiyya, E Sulaiman Musliyar, Ponmala Abdul Qadir Musliyar and
            Dr. K T Jaleel (Hon. Minister of Kerala) on 13<sup>th</sup> April 2018.
          </p>
          <img
            src={heroBooks}
            alt="Classical Islamic texts in the academy library"
            loading="lazy"
            width={1920}
            height={1088}
            className="rounded-3xl object-cover shadow-[var(--shadow-soft)]"
          />
        </div>
      </section>

      <section className="relative overflow-hidden" id="chairman">
        <img
          src={quranDark}
          alt=""
          aria-hidden
          loading="lazy"
          width={1920}
          height={1200}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[oklch(0.18_0.014_60)]/88" />
        <div className="relative mx-auto max-w-4xl px-5 py-24 text-center text-ink-foreground">
          <p className="font-display text-2xl leading-snug sm:text-3xl">
            Hearts are enlightened with faith, minds are shaped with knowledge, and lives
            are guided by the light of the Qur'an and Sunnah.
          </p>
          <div className="mt-14">
            <p className="eyebrow text-sand">Chairman's Address</p>
            <p className="mt-5 text-ink-foreground/85">
              In 2018, under the patronage of Kolathur Irshadiyya, a new chapter began with
              the founding of Darussuffa Academy at Vadi Sunnah. What began as a modest
              gathering of seekers has grown into an integrated centre where the classical
              Dars tradition and modern academics walk together. May Allah accept this
              effort and make our students a means of good for the ummah.
            </p>
            <p className="mt-6 font-display text-lg">
              Sayyid Murthala Shihab Saqafi Thiroorkkad
            </p>
            <p className="text-sm text-ink-foreground/70">Chairman</p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
