import { createFileRoute } from "@tanstack/react-router";
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { useContactSettings } from "@/lib/cms";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us | Darusuffa Academy, Vadeesunnah Kolathur" },
      {
        name: "description",
        content:
          "Reach Darusuffa Academy at Vadeesunnah, Kolathur PO, 679338 Malappuram, Kerala. Phone, WhatsApp, email and campus location.",
      },
      { property: "og:title", content: "Contact Darusuffa Academy" },
      {
        property: "og:description",
        content:
          "Address, phone, WhatsApp, email and location map for Darusuffa Academy, Vadeesunnah, Kolathur.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Contact,
});

function Contact() {
  const contact = useContactSettings();

  const socials = [
    { Icon: Instagram, href: contact.instagram, label: "Instagram" },
    { Icon: Facebook, href: contact.facebook, label: "Facebook" },
    { Icon: Youtube, href: contact.youtube, label: "YouTube" },
  ].filter((s) => s.href);

  return (
    <PageShell
      eyebrow="Muhyissunna Integrated Dars"
      title="Contact Us"
      intro="Vadeesunnah, Kolathur — we are happy to hear from students, parents and well-wishers."
    >
      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-2">
        <div className="space-y-8">
          <div className="flex gap-4">
            <MapPin className="mt-1 shrink-0 text-secondary" size={20} />
            <div>
              <h2 className="font-display text-lg">Address</h2>
              <p className="text-muted-foreground">{contact.address}</p>
            </div>
          </div>

          <div className="flex gap-4">
            <Phone className="mt-1 shrink-0 text-secondary" size={20} />
            <div>
              <h2 className="font-display text-lg">Phone</h2>
              {contact.phones.map((p) => (
                <p key={p}>
                  <a
                    href={`tel:${p.replace(/\s/g, "")}`}
                    className="text-muted-foreground hover:text-primary"
                  >
                    {p}
                  </a>
                </p>
              ))}
              {contact.whatsapp && (
                <p className="mt-1">
                  <a
                    href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`}
                    className="text-muted-foreground hover:text-primary"
                  >
                    WhatsApp {contact.whatsapp}
                  </a>
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <Mail className="mt-1 shrink-0 text-secondary" size={20} />
            <div>
              <h2 className="font-display text-lg">Email</h2>
              <a
                href={`mailto:${contact.email}`}
                className="text-muted-foreground hover:text-primary"
              >
                {contact.email}
              </a>
            </div>
          </div>

          {socials.length > 0 && (
            <div>
              <h2 className="font-display text-lg">Get us on</h2>
              <p className="text-sm text-muted-foreground">
                Stay connected with us on social media for updates, events and news.
              </p>
              <div className="mt-4 flex gap-3">
                {socials.map(({ Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className="rounded-full border border-border p-3 text-foreground transition-colors hover:bg-muted"
                  >
                    <Icon size={18} />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <h2 className="eyebrow">Vadeessunnah Kolathur</h2>
          <iframe
            title="Map of Darusuffa Academy, Vadeesunnah Kolathur"
            src={`https://www.google.com/maps?q=${encodeURIComponent(contact.mapQuery)}&output=embed`}
            loading="lazy"
            className="mt-4 h-[420px] w-full rounded-3xl border border-border"
          />
        </div>
      </section>
    </PageShell>
  );
}
