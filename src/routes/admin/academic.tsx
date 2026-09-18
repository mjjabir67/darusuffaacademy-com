import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeading, Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageFieldManager } from "@/components/admin/ImageFieldManager";
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
        description="Manage the featured image, curriculum introduction, and overview content of the Academic page."
      />

      <div className="space-y-6">
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
