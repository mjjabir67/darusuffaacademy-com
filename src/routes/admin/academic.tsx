import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight, BookOpen, Globe, UserCheck, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeading, Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageFieldManager } from "@/components/admin/ImageFieldManager";
import { PageBannerFieldManager } from "@/components/admin/PageBannerFieldManager";
import { DEFAULT_ACADEMIC, type AcademicSettings } from "@/lib/cms";
import students from "@/assets/students.jpg";

export const Route = createFileRoute("/admin/academic")({
  component: AcademicAdmin,
});

function AcademicAdmin() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AcademicSettings>(DEFAULT_ACADEMIC);
  const [saving, setSaving] = useState(false);

  const { data } = useQuery({
    queryKey: ["settings", "academic"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "academic")
        .maybeSingle();
      return { ...DEFAULT_ACADEMIC, ...((data?.value as object) ?? {}) } as AcademicSettings;
    },
  });

  const { data: submissionsData } = useQuery({
    queryKey: ["admin", "submissions-academic-count"],
    queryFn: async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) return { total: 0, published: 0, pending: 0 };
        const res = await fetch("/api/admin/submissions", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          const subs = (json.submissions || []) as Array<{
            status: string;
            is_published: boolean;
          }>;
          return {
            total: subs.length,
            published: subs.filter((s) => s.is_published).length,
            pending: subs.filter((s) => s.status === "Submitted").length,
          };
        }
      } catch {
        // ignore
      }
      return { total: 0, published: 0, pending: 0 };
    },
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const set = (patch: Partial<AcademicSettings>) => setForm((f) => ({ ...f, ...patch }));

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: "academic", value: form }, { onConflict: "key" });
    setSaving(false);
    if (error) {
      toast.error("Could not save the academic page settings.");
      return;
    }
    toast.success("Academic page settings updated.");
    queryClient.invalidateQueries({ queryKey: ["settings", "academic"] });
  };

  return (
    <>
      <PageHeading
        title="Academic Page"
        description="Manage the featured image, curriculum introduction, and student works on the Academic page."
      />

      <div className="space-y-6">
        {/* Academic Page Banner Image */}
        <PageBannerFieldManager
          pageKey="academic"
          pageTitle="Academic"
          pageDescription="Top hero banner image displayed across the header of the public Academic page behind the title."
          liveUrl="/academic"
        />

        {/* Student Works & Publications Showcase link */}
        <Panel title="Student Works & Publications Section">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">
                  Live Public Publications & Student Works
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <Globe size={12} /> {submissionsData?.published ?? 0} Published on Academic Page
                </span>
                {(submissionsData?.pending ?? 0) > 0 && (
                  <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                    {submissionsData?.pending} Pending Review
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Students submit creative writings, poems, essays, speeches, and drawings via the
                Student Portal. Once approved and marked as published, they appear automatically in
                the &ldquo;Student Works &amp; Publications&rdquo; section on the public Academic
                page.
              </p>
            </div>
            <Link
              to="/admin/students"
              search={{ tab: "submissions" }}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition"
            >
              <UserCheck size={14} />
              Manage Student Works ({submissionsData?.total ?? 0})
              <ArrowRight size={14} />
            </Link>
          </div>
        </Panel>

        {/* Academic Page Feature Image */}
        <Panel title="Academic Page Feature Image">
          <ImageFieldManager
            label="Curriculum & Dars Overview Image"
            description="Photo displayed beside the curriculum blocks and academic modules on the public Academic page."
            currentImageUrl={form.pageImage}
            defaultImageUrl={students}
            storageFolder="academic"
            cropShape="rect"
            aspectRatio={4 / 3}
            modalTitle="Crop & Adjust Academic Page Image"
            onSave={async (url) => {
              const updated = { ...form, pageImage: url };
              set({ pageImage: url });
              await supabase
                .from("site_settings")
                .upsert({ key: "academic", value: updated }, { onConflict: "key" });
              queryClient.invalidateQueries({ queryKey: ["settings", "academic"] });
            }}
          />
        </Panel>

        {/* Headings and Intro */}
        <Panel title="Headings &amp; Introduction">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="eyebrow">Eyebrow</Label>
                <Input
                  id="eyebrow"
                  value={form.eyebrow ?? ""}
                  onChange={(e) => set({ eyebrow: e.target.value })}
                  placeholder="e.g. Curriculum"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Page Title</Label>
                <Input
                  id="title"
                  value={form.title ?? ""}
                  onChange={(e) => set({ title: e.target.value })}
                  placeholder="e.g. Academics"
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="intro">Introduction / Narrative</Label>
              <Textarea
                id="intro"
                rows={4}
                value={form.intro ?? ""}
                onChange={(e) => set({ intro: e.target.value })}
                placeholder="Brief introduction displayed in the academic hero banner."
                className="rounded-xl"
              />
            </div>
          </div>
        </Panel>

        <Button className="rounded-full px-8" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </>
  );
}
