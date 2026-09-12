import { Link } from "@tanstack/react-router";
import logo from "@/assets/darusuffa-logo-white.png";
import { useContactSettings, useSiteSettings } from "@/lib/cms";

const columns = [
  {
    title: "About",
    links: [
      { to: "/about", label: "Know us" },
      { to: "/staff", label: "Faculties" },
      { to: "/contact", label: "Locate us" },
    ],
  },
  {
    title: "Admission",
    links: [{ to: "/admission", label: "Application form" }],
  },
  {
    title: "Academic",
    links: [
      { to: "/language-door", label: "Language Door" },
      { to: "/art-literature", label: "Art and Literature" },
      { to: "/ssf-dawa", label: "SSF da'wa" },
    ],
  },
  {
    title: "Updates",
    links: [
      { to: "/news", label: "News" },
      { to: "/news", label: "Events" },
      { to: "/media", label: "Media" },
    ],
  },
] as const;

export function SiteFooter() {
  const contact = useContactSettings();
  const site = useSiteSettings();

  return (
    <footer className="bg-background px-5 pb-10 pt-16">
      <div className="footer-gradient mx-auto max-w-6xl rounded-4xl px-6 py-10 text-ink-foreground sm:px-12">
        <div className="flex flex-col items-center justify-between gap-5 sm:flex-row">
          <img
            src={logo}
            alt="Darusuffa Academy"
            width={240}
            height={74}
            loading="lazy"
            className="h-16 w-auto"
          />

          <p className="font-display text-lg">"{site.footerText}"</p>
        </div>

        <div className="my-8 h-px bg-white/25" />

        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="mb-3 font-display text-lg">{col.title}</h3>
              <ul className="space-y-1.5 text-sm text-ink-foreground/85">
                {col.links.map((link) => (
                  <li key={`${col.title}-${link.label}`}>
                    <Link to={link.to} className="transition-opacity hover:opacity-70">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="rule-heading mt-10 font-display text-sm">contact us</p>

        <div className="mt-6 grid gap-2 text-sm text-ink-foreground/90 sm:grid-cols-2">
          {contact.phones.map((p) => (
            <a key={p} href={`tel:${p.replace(/\s/g, "")}`} className="hover:opacity-70">
              {p}
            </a>
          ))}
          <a href={`mailto:${contact.email}`} className="hover:opacity-70">
            {contact.email}
          </a>
          {contact.whatsapp && (
            <a
              href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`}
              className="hover:opacity-70"
            >
              WhatsApp {contact.whatsapp}
            </a>
          )}
        </div>
      </div>

      <p className="mx-auto mt-6 max-w-6xl text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {site.siteName}, {contact.address}
      </p>
    </footer>
  );
}
