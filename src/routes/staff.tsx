import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Phone, Mail, MapPin } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  useStaffMembers,
  useCommitteeMembers,
  type StaffMember,
  type CommitteeMember,
} from "@/lib/cms";

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

function StaffMemberAvatar({
  name,
  photoUrl,
  size = "default",
}: {
  name: string;
  photoUrl?: string | null;
  size?: "default" | "large";
}) {
  const [error, setError] = useState(false);
  const sizeClasses =
    size === "large" ? "h-28 w-28 sm:h-32 sm:w-32 text-4xl" : "h-20 w-20 sm:h-24 sm:w-24 text-2xl";

  if (photoUrl && !error) {
    return (
      <div
        className={`relative ${sizeClasses} shrink-0 overflow-hidden rounded-full border-2 border-primary/20 bg-muted shadow-sm`}
      >
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
      className={`grid ${sizeClasses} shrink-0 place-items-center rounded-full brand-gradient font-display text-primary-foreground font-semibold shadow-sm`}
    >
      {name ? name.charAt(0).toUpperCase() : "S"}
    </div>
  );
}

function CommitteeMemberAvatar({
  name,
  photoUrl,
  size = "default",
}: {
  name: string;
  photoUrl?: string | null;
  size?: "default" | "large";
}) {
  const [error, setError] = useState(false);
  const sizeClasses =
    size === "large"
      ? "h-28 w-28 sm:h-32 sm:w-32 rounded-3xl text-4xl"
      : "h-18 w-18 sm:h-20 sm:w-20 rounded-2xl text-xl";

  if (photoUrl && !error) {
    return (
      <div
        className={`relative ${sizeClasses} shrink-0 overflow-hidden border border-border bg-muted shadow-xs`}
      >
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
      className={`grid ${sizeClasses} shrink-0 place-items-center bg-secondary font-display text-secondary-foreground font-semibold border border-border`}
    >
      {name ? name.charAt(0).toUpperCase() : "C"}
    </div>
  );
}

function Staff() {
  const staffMembers = useStaffMembers();
  const committeeMembers = useCommitteeMembers();
  const [selectedPerson, setSelectedPerson] = useState<{
    member: StaffMember | CommitteeMember;
    type: "staff" | "committee";
  } | null>(null);

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
              <button
                type="button"
                onClick={() => setSelectedPerson({ member: person, type: "staff" })}
                className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full shrink-0"
                aria-label={`View details for ${person.name}`}
              >
                <StaffMemberAvatar name={person.name} photoUrl={person.photo_url} />
              </button>
              <div className="min-w-0 flex-1">
                <p className="eyebrow truncate">{person.role || "Faculty"}</p>
                <h2 className="mt-1 font-display text-xl leading-tight text-foreground">
                  <button
                    type="button"
                    onClick={() => setSelectedPerson({ member: person, type: "staff" })}
                    className="text-left font-display text-xl leading-tight text-foreground hover:text-primary transition-colors cursor-pointer focus:outline-none focus-visible:underline"
                  >
                    {person.name}
                  </button>
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
                  <button
                    type="button"
                    onClick={() => setSelectedPerson({ member, type: "committee" })}
                    className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl shrink-0"
                    aria-label={`View details for ${member.name}`}
                  >
                    <CommitteeMemberAvatar name={member.name} photoUrl={member.photo_url} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-lg font-medium leading-snug text-foreground">
                      <button
                        type="button"
                        onClick={() => setSelectedPerson({ member, type: "committee" })}
                        className="text-left font-display text-lg font-medium leading-snug text-foreground hover:text-primary transition-colors cursor-pointer focus:outline-none focus-visible:underline"
                      >
                        {member.name}
                      </button>
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

      {/* Member Details Popup / Modal */}
      <Dialog
        open={Boolean(selectedPerson)}
        onOpenChange={(open) => {
          if (!open) setSelectedPerson(null);
        }}
      >
        <DialogContent
          id="member-detail-modal"
          className="max-w-md w-[calc(100vw-2rem)] p-6 sm:p-7 rounded-3xl border border-border bg-card shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          {selectedPerson && (
            <div className="flex flex-col items-center text-center">
              {/* Photo / Avatar */}
              <div className="mb-4">
                {selectedPerson.type === "staff" ? (
                  <StaffMemberAvatar
                    name={selectedPerson.member.name}
                    photoUrl={selectedPerson.member.photo_url}
                    size="large"
                  />
                ) : (
                  <CommitteeMemberAvatar
                    name={selectedPerson.member.name}
                    photoUrl={selectedPerson.member.photo_url}
                    size="large"
                  />
                )}
              </div>

              {/* Title & Role */}
              <DialogHeader className="w-full text-center space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-primary">
                  {selectedPerson.type === "staff" ? "Faculty & Staff" : "Committee Member"}
                </p>
                <DialogTitle className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {selectedPerson.member.name}
                </DialogTitle>
                {selectedPerson.member.role && (
                  <p className="text-sm font-medium text-muted-foreground">
                    {selectedPerson.member.role}
                  </p>
                )}
              </DialogHeader>

              {/* Contact Information Details */}
              <div className="mt-6 w-full divide-y divide-border/60 rounded-2xl border border-border bg-muted/30 text-left overflow-hidden">
                {/* Phone */}
                <div className="p-4 space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-primary" />
                    Phone:
                  </span>
                  {selectedPerson.member.phone?.trim() ? (
                    <a
                      href={`tel:${selectedPerson.member.phone.replace(/[^0-9+]/g, "")}`}
                      className="inline-flex items-center gap-2 text-sm sm:text-base font-semibold text-foreground hover:text-primary transition-colors py-0.5 focus:outline-none focus-visible:underline"
                    >
                      {selectedPerson.member.phone.trim()}
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Not provided</p>
                  )}
                </div>

                {/* Email */}
                <div className="p-4 space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-primary" />
                    Email:
                  </span>
                  {selectedPerson.member.email?.trim() ? (
                    <a
                      href={`mailto:${selectedPerson.member.email.trim()}`}
                      className="inline-flex items-center gap-2 text-sm sm:text-base font-semibold text-foreground hover:text-primary transition-colors py-0.5 break-all focus:outline-none focus-visible:underline"
                    >
                      {selectedPerson.member.email.trim()}
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Not provided</p>
                  )}
                </div>

                {/* Address */}
                <div className="p-4 space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    Address:
                  </span>
                  {selectedPerson.member.address?.trim() ? (
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                      {selectedPerson.member.address.trim()}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Not provided</p>
                  )}
                </div>
              </div>

              {/* Close button */}
              <div className="mt-6 w-full">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-xl py-2.5 font-medium"
                  onClick={() => setSelectedPerson(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
