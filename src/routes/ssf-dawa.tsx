import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import quranDark from "@/assets/quran-dark.jpg";

export const Route = createFileRoute("/ssf-dawa")({
  head: () => ({
    meta: [
      { title: "SSF Darusuffa Da'wa | Darusuffa Academy" },
      {
        name: "description",
        content:
          "The SSF Da'wa unit at Darusuffa Academy promotes the peaceful message of Islam through knowledge, character and service under the guidance of the Sunni Students' Federation.",
      },
      { property: "og:title", content: "SSF Darusuffa Da'wa" },
      {
        property: "og:description",
        content:
          "Knowledge, character and service — the SSF Da'wa unit of Darusuffa Academy, Vadeesunnah Kolathur.",
      },
    ],
  }),
  component: SsfDawa,
});

function SsfDawa() {
  return (
    <PageShell
      eyebrow="Campus unit"
      title="SSF Darusuffa Da'wa"
      intro="Rooted in the values of truth, tolerance and wisdom."
    >
      <section className="mx-auto max-w-4xl px-5 py-20">
        <p className="text-lg leading-relaxed">
          Our institution proudly hosts an active <strong>SSF Da'wa Unit</strong>,
          functioning under the spiritual and intellectual guidance of the{" "}
          <strong>Sunni Students' Federation (SSF)</strong>. The unit is dedicated to
          promoting the peaceful message of Islam through knowledge, character and
          service.
        </p>
        <p className="mt-5 leading-relaxed text-muted-foreground">
          Through study circles, campus programmes, social service drives and community
          outreach, the unit trains students to carry the teachings of the Qur'an and
          Sunnah with wisdom and good conduct — engaging society with compassion rather
          than confrontation.
        </p>
      </section>

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
        <div className="absolute inset-0 bg-[oklch(0.18_0.014_60)]/88" />
        <p className="relative mx-auto max-w-4xl px-5 py-24 text-center font-display text-2xl text-ink-foreground sm:text-3xl">
          "Invite to the way of your Lord with wisdom and beautiful preaching."
        </p>
      </section>
    </PageShell>
  );
}
