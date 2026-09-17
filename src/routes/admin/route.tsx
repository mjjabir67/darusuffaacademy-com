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
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  FileText,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
    const username =
      data.user.user_metadata?.username ||
      (data.user.email?.startsWith("admin@") ? data.user.email.slice(6) : data.user.email) ||
      "";
    return { adminEmail: username };
  },
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/home", label: "Home Page", icon: Home },
  { to: "/admin/admission", label: "Admission", icon: FileText },
  { to: "/admin/news", label: "News & Events", icon: Newspaper },
  { to: "/admin/enquiries", label: "Enquiries", icon: Inbox },
  { to: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { to: "/admin/gallery", label: "Gallery", icon: Images },
  { to: "/admin/courses", label: "Courses", icon: GraduationCap },
  { to: "/admin/staff", label: "Staff & Committee", icon: Users },
  { to: "/admin/settings", label: "Settings", icon: Settings },
] as const;

function AdminLayout() {
  const { adminEmail } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  // Unread general enquiries count (strictly from enquiries table)
  const { data: unreadEnquiriesCount = 0 } = useQuery({
    queryKey: ["admin", "unread-enquiries-count"],
    queryFn: async () => {
      const { data } = await supabase
        .from("enquiries")
        .select("id, is_read, message")
        .eq("is_read", false);
      const valid = (data ?? []).filter((e) => !e.message?.includes("[ADMISSION APPLICATION]"));
      return valid.length;
    },
    refetchInterval: 30000,
  });

  // New admission applications count (strictly from admission_applications data structure)
  const { data: newApplicationsCount = 0 } = useQuery({
    queryKey: ["admin", "new-applications-count"],
    queryFn: async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        const res = await fetch("/api/admissions/applications", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.applications)) {
            return json.applications.filter((a: { status?: string }) => a.status === "New").length;
          }
        }
      } catch {
        // fallback
      }
      try {
        const { data } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "admission_applications")
          .maybeSingle();
        if (data && Array.isArray(data.value)) {
          return (data.value as { status?: string }[]).filter((a) => a.status === "New").length;
        }
      } catch (err) {
        console.warn("[AdminNav] Count fetch error:", err);
      }
      return 0;
    },
    refetchInterval: 30000,
  });

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

          const badgeCount =
            to === "/admin/admission"
              ? newApplicationsCount
              : to === "/admin/enquiries"
                ? unreadEnquiriesCount
                : 0;

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
              <span>{label}</span>
              {badgeCount > 0 && (
                <span
                  className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold ${
                    to === "/admin/admission"
                      ? "bg-blue-500/30 text-blue-200 border border-blue-400/30"
                      : "bg-emerald-500/30 text-emerald-200 border border-emerald-400/30"
                  }`}
                >
                  {badgeCount}
                </span>
              )}
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
          <header className="sticky top-0 z-30 hidden items-center justify-between border-b border-border bg-background px-8 py-4 lg:flex">
            <h1 className="font-display text-lg">Admin Dashboard</h1>
            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-2 text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
            >
              <ExternalLink size={16} />
              View Website
            </Link>
          </header>

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
