import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import logoDark from "@/assets/darusuffa-logo-dark.png";
import logoWhite from "@/assets/darusuffa-logo-white.png";

const nav = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About us" },
  { to: "/admission", label: "Admission" },
  { to: "/academic", label: "Academic" },
  { to: "/contact", label: "Contact Us" },
  { to: "/staff", label: "Staffs" },
  { to: "/media", label: "Gallery" },
] as const;

const otherLinks = [
  { to: "/art-literature", label: "Art and Literature" },
  { to: "/language-door", label: "Language Door" },
  { to: "/magazine", label: "Magazine" },
  { to: "/ssf-dawa", label: "SSF Da'wa" },
] as const;

export function SiteHeader({ variant = "solid" }: { variant?: "solid" | "overlay" }) {
  const [open, setOpen] = useState(false);
  const [otherDropdownOpen, setOtherDropdownOpen] = useState(false);
  const overlay = variant === "overlay";
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isOtherActive = otherLinks.some(
    (l) => pathname === l.to || pathname.startsWith(l.to + "/"),
  );

  return (
    <header
      className={
        overlay
          ? "absolute inset-x-0 top-0 z-50"
          : "sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur"
      }
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-4">
        <Link to="/" className="flex items-center gap-3">
          <img
            src={overlay ? logoWhite : logoDark}
            alt="Darusuffa Academy logo"
            width={384}
            height={126}
            className={`h-12 w-auto ${overlay ? "drop-shadow-sm" : ""}`}
          />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className={`font-display text-sm transition-opacity hover:opacity-100 ${
                overlay ? "text-ink-foreground/85" : "text-foreground/75"
              }`}
              activeProps={{ className: "font-semibold opacity-100" }}
            >
              {item.label}
            </Link>
          ))}

          {/* Other Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setOtherDropdownOpen(true)}
            onMouseLeave={() => setOtherDropdownOpen(false)}
          >
            <button
              type="button"
              onClick={() => setOtherDropdownOpen((v) => !v)}
              className={`flex items-center gap-1 font-display text-sm transition-opacity hover:opacity-100 ${
                overlay ? "text-ink-foreground/85" : "text-foreground/75"
              } ${isOtherActive ? "font-semibold opacity-100" : ""}`}
              aria-expanded={otherDropdownOpen}
            >
              <span>Other</span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${
                  otherDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {otherDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-border bg-card p-2 shadow-xl">
                {otherLinks.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOtherDropdownOpen(false)}
                    className="block rounded-xl px-3 py-2 font-display text-sm text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
                    activeProps={{ className: "bg-muted font-semibold text-foreground" }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        <button
          type="button"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className={`md:hidden ${overlay ? "text-ink-foreground" : "text-foreground"}`}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-5 py-3 md:hidden">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="block py-2 font-display text-sm text-foreground/80"
            >
              {item.label}
            </Link>
          ))}

          <div className="mt-2 border-t border-border pt-2">
            <p className="px-1 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Other Pages
            </p>
            {otherLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="block py-1.5 pl-2 font-display text-sm text-foreground/80 hover:text-foreground"
                activeProps={{ className: "font-semibold text-foreground" }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
