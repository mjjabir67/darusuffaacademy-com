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
import {
  DEFAULT_CONTACT,
  DEFAULT_SITE,
  type ContactSettings,
  type SiteSettings,
} from "@/lib/cms";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsAdmin,
});

function SettingsAdmin() {
  const queryClient = useQueryClient();
  const [contact, setContact] = useState<ContactSettings>(DEFAULT_CONTACT);
  const [site, setSite] = useState<SiteSettings>(DEFAULT_SITE);
  const [saving, setSaving] = useState(false);

  const { data } = useQuery({
    queryKey: ["settings", "all"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("key, value");
      const rows = data ?? [];
      const byKey = (k: string) => rows.find((r) => r.key === k)?.value as object | undefined;
      return {
        contact: { ...DEFAULT_CONTACT, ...(byKey("contact") ?? {}) } as ContactSettings,
        site: { ...DEFAULT_SITE, ...(byKey("site") ?? {}) } as SiteSettings,
      };
    },
  });

  useEffect(() => {
    if (data) {
      setContact(data.contact);
      setSite(data.site);
    }
  }, [data]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("site_settings").upsert(
      [
        { key: "contact", value: contact },
        { key: "site", value: site },
      ],
      { onConflict: "key" },
    );
    setSaving(false);
    if (error) {
      toast.error("Could not save the settings.");
      return;
    }
    toast.success("Settings updated.");
    queryClient.invalidateQueries();
  };

  return (
    <>
      <PageHeading
        title="Contact & Site Settings"
        description="These details appear in the footer, the contact page and across the website."
      />

      <div className="space-y-6">
        <Panel title="Contact details">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                rows={2}
                value={contact.address}
                onChange={(e) => setContact({ ...contact, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phones">Phone numbers (comma separated)</Label>
              <Input
                id="phones"
                value={contact.phones.join(", ")}
                onChange={(e) =>
                  setContact({
                    ...contact,
                    phones: e.target.value
                      .split(",")
                      .map((p) => p.trim())
                      .filter(Boolean),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp number</Label>
              <Input
                id="whatsapp"
                value={contact.whatsapp}
                onChange={(e) => setContact({ ...contact, whatsapp: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={contact.email}
                onChange={(e) => setContact({ ...contact, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mapQuery">Map location search</Label>
              <Input
                id="mapQuery"
                value={contact.mapQuery}
                onChange={(e) => setContact({ ...contact, mapQuery: e.target.value })}
              />
            </div>
          </div>
        </Panel>

        <Panel title="Social links">
          <div className="grid gap-5 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                id="facebook"
                value={contact.facebook}
                onChange={(e) => setContact({ ...contact, facebook: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={contact.instagram}
                onChange={(e) => setContact({ ...contact, instagram: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="youtube">YouTube</Label>
              <Input
                id="youtube"
                value={contact.youtube}
                onChange={(e) => setContact({ ...contact, youtube: e.target.value })}
              />
            </div>
          </div>
        </Panel>

        <Panel title="Website details">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="siteName">Institution name</Label>
              <Input
                id="siteName"
                value={site.siteName}
                onChange={(e) => setSite({ ...site, siteName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="footerText">Footer tagline</Label>
              <Input
                id="footerText"
                value={site.footerText}
                onChange={(e) => setSite({ ...site, footerText: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seoTitle">Search engine title</Label>
              <Input
                id="seoTitle"
                value={site.seoTitle}
                onChange={(e) => setSite({ ...site, seoTitle: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seoDescription">Search engine description</Label>
              <Textarea
                id="seoDescription"
                rows={2}
                value={site.seoDescription}
                onChange={(e) => setSite({ ...site, seoDescription: e.target.value })}
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
