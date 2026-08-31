import { Link } from "@tanstack/react-router";
import logo from "@/assets/darusuffa-logo-transparent.png";

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
            className="h-14 w-auto rounded-lg bg-white/95 px-2 py-1.5"
          />

          <p className="font-display text-lg">"Educate. Elevate. Empower."</p>
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
          <a href="tel:+919961009313" className="hover:opacity-70">
            +91 99610 09313
          </a>
          <a href="mailto:darusuffaacademymsa@gmail.com" className="hover:opacity-70">
            darusuffaacademymsa@gmail.com
          </a>
          <a href="tel:+917902520097" className="hover:opacity-70">
            +91 79025 20097
          </a>
          <a href="https://wa.me/917034649996" className="hover:opacity-70">
            WhatsApp +91 70346 49996
          </a>
        </div>
      </div>

      <p className="mx-auto mt-6 max-w-6xl text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Darusuffa Academy, Vadeesunnah, Kolathur. Muhyissunna
        Integrated Dars.
      </p>
    </footer>
  );
}
