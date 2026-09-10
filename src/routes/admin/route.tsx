import { useEffect, useState } from "react";
import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import {
  LayoutDashboard,
  Home,
  Newspaper,
  Inbox,
  Megaphone,
  Images,
  GraduationCap,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import logoWhite from "@/assets/darusuffa-logo-white.png";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/admin-login" });

    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!role) throw redirect({ to: "/admin-login" });
    return { adminEmail: data.user.email ?? "" };
  },
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/home", label: "Home Page", icon: Home },
  { to: "/admin/news", label: "News & Events", icon: Newspaper },
  { to: "/admin/enquiries", label: "Enquiries", icon: Inbox },
  { to: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { to: "/admin/gallery", label: "Gallery", icon: Images },
  { to: "/admin/courses", label: "Courses", icon: GraduationCap },
  { to: "/admin/settings", label: "Settings", icon: Settings },
] as const;

function AdminLayout() {
  const { adminEmail } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/admin-login", replace: true });
  };

  const sidebar = (
    <div className="flex h-full flex-col gap-6 bg-ink px-5 py-7 text-ink-foreground">
      <img src={logoWhite} alt="Darusuffa Academy" className="h-10 w-auto self-start" />

      <nav className="flex-1 space-y-1">
        {NAV.map(({ to, label, icon: Icon, ...rest }) => {
          const exact = "exact" in rest && rest.exact;
          const active = exact ? pathname === to : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-white/15 text-ink-foreground"
                  : "text-ink-foreground/70 hover:bg-white/10"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-white/15 pt-4 text-sm">
        <p className="truncate text-ink-foreground/60">{adminEmail}</p>
        <Link
          to="/"
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-ink-foreground/80 hover:bg-white/10"
        >
          <ExternalLink size={16} /> View website
        </Link>
        <button
          type="button"
          onClick={signOut}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-ink-foreground/80 hover:bg-white/10"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted font-enquiry">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="fixed inset-y-0 left-0 w-64">{sidebar}</div>
        </aside>

        {open && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              aria-label="Close menu"
              className="absolute inset-0 bg-black/50"
              onClick={() => setOpen(false)}
            />
            <div className="relative z-50 h-full w-64">{sidebar}</div>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <header className="flex items-center gap-3 border-b border-border bg-background px-5 py-4 lg:hidden">
            <button type="button" onClick={() => setOpen((v) => !v)} aria-label="Menu">
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
            <span className="font-display text-lg">Admin</span>
          </header>

          <main className="px-5 py-8 sm:px-8">
            <Outlet />
          </main>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
