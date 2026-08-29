import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import logo from "@/assets/darusuffa-logo.jpg.asset.json";

const nav = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About us" },
  { to: "/admission", label: "Admission" },
  { to: "/academic", label: "Academic" },
  { to: "/contact", label: "Contact Us" },
  { to: "/staff", label: "Staffs" },
] as const;

export function SiteHeader({ variant = "solid" }: { variant?: "solid" | "overlay" }) {
  const [open, setOpen] = useState(false);
  const overlay = variant === "overlay";

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
            src={logo.url}
            alt="Darusuffa Academy logo"
            width={384}
            height={126}
            className={`h-10 w-auto ${overlay ? "rounded-md bg-white px-3 py-1.5 shadow-sm" : ""}`}
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
        </div>
      )}
    </header>
  );
}
