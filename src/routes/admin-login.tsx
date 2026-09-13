import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logoWhite from "@/assets/darusuffa-logo-white.png";

export const Route = createFileRoute("/admin-login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin Login | Darusuffa Academy" },
      { name: "description", content: "Secure administrator sign in for the Darusuffa Academy website." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin Login | Darusuffa Academy" },
      { property: "og:description", content: "Administrator access to the Darusuffa Academy website control panel." },
    ],
  }),
  component: AdminLogin,
});

function toEmail(value: string) {
  const v = value.trim();
  if (v.includes("@")) return v;
  return `admin@${v}`;
}

function AdminLogin() {
  const navigate = useNavigate();
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!adminId.trim() || !password) {
      setError("Please enter both the admin ID and password.");
      return;
    }

    setLoading(true);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: toEmail(adminId),
      password,
    });

    if (signInError || !data.user) {
      setLoading(false);
      setError("Incorrect admin ID or password.");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roles) {
      await supabase.auth.signOut();
      setLoading(false);
      setError("This account is not allowed to access the dashboard.");
      return;
    }

    setLoading(false);
    navigate({ to: "/admin", replace: true });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-ink px-5 py-16 font-enquiry">
      <Link
        to="/"
        className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-ink/60 px-4 py-2 text-sm text-white/90 backdrop-blur-sm transition-colors hover:border-primary/40 hover:bg-white/10 hover:text-white"
      >
        <ArrowLeft size={16} />
        Back to Home
      </Link>

      <div className="w-full max-w-md">
        <img
          src={logoWhite}
          alt="Darusuffa Academy"
          width={240}
          height={74}
          className="mx-auto h-14 w-auto"
        />

        <form
          onSubmit={handleSubmit}
          className="mt-10 rounded-3xl bg-background p-8 shadow-[var(--shadow-soft)]"
          noValidate
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <LockKeyhole size={22} />
          </div>
          <h1 className="mt-5 text-center font-display text-2xl">Admin Login</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Sign in to manage the Darusuffa Academy website.
          </p>

          <div className="mt-7 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="adminId">Admin ID</Label>
              <Input
                id="adminId"
                value={adminId}
                autoComplete="username"
                onChange={(e) => setAdminId(e.target.value)}
                placeholder="darusuffa.in"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full rounded-full py-6">
              {loading ? "Signing in..." : "Login"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
