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
import { DEFAULT_HOME, type HomeSettings } from "@/lib/cms";
import heroBooks from "@/assets/hero-books.jpg";
import studentsHallAsset from "@/assets/darusuffa-students-hall.jpg.asset.json";

export const Route = createFileRoute("/admin/home")({
  component: HomeAdmin,
});

function HomeAdmin() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<HomeSettings>(DEFAULT_HOME);
  const [saving, setSaving] = useState(false);

  const { data } = useQuery({
    queryKey: ["settings", "home"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "home")
        .maybeSingle();
      return { ...DEFAULT_HOME, ...((data?.value as object) ?? {}) } as HomeSettings;
    },
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const set = (patch: Partial<HomeSettings>) => setForm((f) => ({ ...f, ...patch }));

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: "home", value: form }, { onConflict: "key" });
    setSaving(false);
    if (error) {
      toast.error("Could not save the home page content.");
      return;
    }
    toast.success("Home page updated.");
    queryClient.invalidateQueries();
  };

  return (
    <>
      <PageHeading
        title="Home Page"
        description="Edit the banner text, buttons and welcome section of the home page."
      />

      <div className="space-y-6">
        <Panel title="Banner">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="heroTitle">Main title</Label>
              <Input
                id="heroTitle"
                value={form.heroTitle}
                onChange={(e) => set({ heroTitle: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="heroSubtitle">Subtitle</Label>
              <Input
                id="heroSubtitle"
                value={form.heroSubtitle}
                onChange={(e) => set({ heroSubtitle: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="heroDescription">Short description</Label>
              <Textarea
                id="heroDescription"
                rows={3}
                value={form.heroDescription}
                onChange={(e) => set({ heroDescription: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2 pt-3 border-t border-border">
              <ImageFieldManager
                label="Banner Background Image"
                description="Background photo displayed behind the main hero title on the Home page."
                currentImageUrl={form.heroImage}
                defaultImageUrl={heroBooks}
                storageFolder="home"
                cropShape="rect"
                aspectRatio={16 / 9}
                modalTitle="Crop & Adjust Banner Background"
                onSave={async (url) => {
                  const updated = { ...form, heroImage: url };
                  set({ heroImage: url });
                  await supabase
                    .from("site_settings")
                    .upsert({ key: "home", value: updated }, { onConflict: "key" });
                  queryClient.invalidateQueries({ queryKey: ["settings", "home"] });
                }}
              />
            </div>
          </div>
        </Panel>

        <Panel title="Buttons">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="primaryCtaLabel">Main button text</Label>
              <Input
                id="primaryCtaLabel"
                value={form.primaryCtaLabel}
                onChange={(e) => set({ primaryCtaLabel: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="primaryCtaLink">Main button link</Label>
              <Input
                id="primaryCtaLink"
                value={form.primaryCtaLink}
                onChange={(e) => set({ primaryCtaLink: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondaryCtaLabel">Second button text</Label>
              <Input
                id="secondaryCtaLabel"
                value={form.secondaryCtaLabel}
                onChange={(e) => set({ secondaryCtaLabel: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondaryCtaLink">Second button link</Label>
              <Input
                id="secondaryCtaLink"
                value={form.secondaryCtaLink}
                onChange={(e) => set({ secondaryCtaLink: e.target.value })}
              />
            </div>
          </div>
        </Panel>

        <Panel title="Our Story Section">
          <div className="space-y-5">
            <ImageFieldManager
              label="Our Story Image"
              description="Photo displayed in the Our Story section on the Home page next to the narrative."
              currentImageUrl={form.ourStoryImage || form.welcomeImage}
              defaultImageUrl={studentsHallAsset.url}
              storageFolder="home"
              cropShape="rect"
              aspectRatio={4 / 3}
              modalTitle="Crop & Adjust Our Story Photo"
              onSave={async (url) => {
                const updated = { ...form, ourStoryImage: url, welcomeImage: url };
                set({ ourStoryImage: url, welcomeImage: url });
                await supabase
                  .from("site_settings")
                  .upsert({ key: "home", value: updated }, { onConflict: "key" });
                queryClient.invalidateQueries({ queryKey: ["settings", "home"] });
              }}
            />

            <div className="space-y-2">
              <Label htmlFor="welcomeTitle">Section Heading</Label>
              <Input
                id="welcomeTitle"
                value={form.welcomeTitle}
                onChange={(e) => set({ welcomeTitle: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="welcomeText">Story / Welcome Text</Label>
              <Textarea
                id="welcomeText"
                rows={6}
                value={form.welcomeText}
                onChange={(e) => set({ welcomeText: e.target.value })}
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
