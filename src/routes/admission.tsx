import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { CONTACT } from "@/lib/site-data";
import students from "@/assets/students.jpg";

export const Route = createFileRoute("/admission")({
  head: () => ({
    meta: [
      { title: "Admission | Darusuffa Academy, Kolathur" },
      {
        name: "description",
        content:
          "Admission to Darusuffa Academy: integrated Dars with High School, Higher Secondary and Degree studies at Vadeesunnah, Kolathur. Contact the office to apply.",
      },
      { property: "og:title", content: "Admission | Darusuffa Academy" },
      {
        property: "og:description",
        content:
          "Join a curriculum that combines modern education with Islamic values in a serene campus at Vadeesunnah, Kolathur.",
      },
    ],
  }),
  component: Admission,
});

function Admission() {
  return (
    <PageShell
      eyebrow="Know more about"
      title="Admission"
      intro="We welcome students who aspire to gain both academic excellence and moral grounding through a unique curriculum that combines modern education with Islamic values."
    >
      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-2">
        <div className="space-y-5">
          <p className="leading-relaxed">
            Our campus, located in a serene and spiritually enriching environment, offers
            the perfect setting for holistic development. Interested candidates are
            encouraged to contact the office or visit our campus for detailed admission
            procedures and guidance. Join us in shaping a future rooted in knowledge,
            character and faith.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={`tel:${CONTACT.phones[0].replace(/\s/g, "")}`}
              className="rounded-full bg-primary px-6 py-3 font-display text-sm text-primary-foreground"
            >
              Call the office
            </a>
            <a
              href={`https://wa.me/${CONTACT.whatsapp.replace(/\D/g, "")}`}
              className="rounded-full border border-border px-6 py-3 font-display text-sm"
            >
              Apply on WhatsApp
            </a>
          </div>
        </div>
        <img
          src={students}
          alt="Students of Darusuffa Academy studying"
          loading="lazy"
          width={1200}
          height={900}
          className="rounded-3xl object-cover shadow-[var(--shadow-soft)]"
        />
      </section>

      <section className="bg-muted px-5 py-20">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2">
          <article className="card-soft p-8">
            <h2 className="font-display text-2xl">Integrated Education with Purpose</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Our institution nurtures students who are not only academically competent but
              also morally upright and spiritually guided. A well-structured curriculum
              integrates modern subjects with Islamic studies — Qur'an, Hadith, Fiqh,
              Islamic History and Ethics — creating a generation that excels in both
              worlds.
            </p>
          </article>
          <article className="card-soft p-8">
            <h2 className="font-display text-2xl">Learning Environment</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              The campus is peacefully situated in a serene and spiritually uplifting
              environment, ideal for focused learning, personal reflection and community
              life. Dedicated faculty, modern classrooms and co-curricular activities
              ensure the holistic development of every student.
            </p>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="font-display text-2xl">How to apply</h2>
        <ol className="mt-6 grid gap-5 md:grid-cols-3">
          {[
            "Contact the office by phone or WhatsApp to check the current intake.",
            "Visit the campus at Vadeesunnah, Kolathur with previous academic records.",
            "Attend the interaction with the faculty and complete the admission formalities.",
          ].map((step, i) => (
            <li key={step} className="card-soft p-7">
              <span className="font-display text-3xl text-secondary">0{i + 1}</span>
              <p className="mt-3 text-sm text-muted-foreground">{step}</p>
            </li>
          ))}
        </ol>
      </section>
    </PageShell>
  );
}
