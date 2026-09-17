import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { useStaffMembers, useCommitteeMembers } from "@/lib/cms";

export const Route = createFileRoute("/staff")({
  head: () => ({
    meta: [
      { title: "Faculties & Committee | Darusuffa Academy, Kolathur" },
      {
        name: "description",
        content:
          "Meet the faculties and committee members of Darusuffa Academy, led by Chairman Sayyid Murthala Shihab Saqafi Thiroorkkad at Vadeesunnah, Kolathur.",
      },
      { property: "og:title", content: "Meet our faculties & committee | Darusuffa Academy" },
      {
        property: "og:description",
        content:
          "Scholars, teachers, and committee members guiding the Muhyissunna Integrated Dars at Darusuffa Academy.",
      },
    ],
  }),
  component: Staff,
});

function StaffMemberAvatar({ name, photoUrl }: { name: string; photoUrl?: string | null }) {
  const [error, setError] = useState(false);

  if (photoUrl && !error) {
    return (
      <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-full border-2 border-primary/20 bg-muted shadow-sm">
        <img
          src={photoUrl}
          alt={name}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setError(true)}
        />
      </div>
    );
  }

  return (
    <div
      aria-hidden
      className="grid h-20 w-20 sm:h-24 sm:w-24 shrink-0 place-items-center rounded-full brand-gradient font-display text-2xl text-primary-foreground font-semibold shadow-sm"
    >
      {name ? name.charAt(0).toUpperCase() : "S"}
    </div>
  );
}

function CommitteeMemberAvatar({ name, photoUrl }: { name: string; photoUrl?: string | null }) {
  const [error, setError] = useState(false);

  if (photoUrl && !error) {
    return (
      <div className="relative h-18 w-18 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-2xl border border-border bg-muted shadow-xs">
        <img
          src={photoUrl}
          alt={name}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setError(true)}
        />
      </div>
    );
  }

  return (
    <div
      aria-hidden
      className="grid h-18 w-18 sm:h-20 sm:w-20 shrink-0 place-items-center rounded-2xl bg-secondary font-display text-xl text-secondary-foreground font-semibold border border-border"
    >
      {name ? name.charAt(0).toUpperCase() : "C"}
    </div>
  );
}

function Staff() {
  const staffMembers = useStaffMembers();
  const committeeMembers = useCommitteeMembers();

  return (
    <PageShell
      eyebrow="Our people"
      title="Meet our faculties"
      intro="Scholars and teachers who guide the academic and spiritual life of the academy."
    >
      {/* Faculties & Staff Section */}
      <section className="mx-auto max-w-6xl px-5 pt-12 pb-16">
        <div className="grid gap-6 sm:grid-cols-2">
          {staffMembers.map((person) => (
            <article
              key={person.id || person.name}
              className="card-soft flex items-center gap-5 p-6 transition-transform duration-200 hover:-translate-y-0.5"
            >
              <StaffMemberAvatar name={person.name} photoUrl={person.photo_url} />
              <div className="min-w-0 flex-1">
                <p className="eyebrow truncate">{person.role || "Faculty"}</p>
                <h2 className="mt-1 font-display text-xl leading-tight text-foreground">
                  {person.name}
                </h2>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Committee Members Section */}
      <section className="border-t border-border bg-muted/40 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mb-12 text-center md:text-left">
            <p className="eyebrow">Leadership & Advisory</p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl text-foreground">
              Committee Members
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground leading-relaxed">
              Dedicated members guiding the developmental, administrative, and community initiatives
              of Darusuffa Academy.
            </p>
          </div>

          {committeeMembers && committeeMembers.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {committeeMembers.map((member) => (
                <article
                  key={member.id || member.name}
                  className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md flex items-center gap-4"
                >
                  <CommitteeMemberAvatar name={member.name} photoUrl={member.photo_url} />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-lg font-medium leading-snug text-foreground">
                      {member.name}
                    </h3>
                    {member.role && (
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-primary">
                        {member.role}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/70 p-8 text-center text-muted-foreground">
              <p className="text-sm">Committee members will be announced soon.</p>
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
