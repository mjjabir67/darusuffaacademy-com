import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeading, Panel, StatusPill, EmptyState } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { slugify, uploadMedia, formatDate, type Post } from "@/lib/cms";

export const Route = createFileRoute("/admin/news")({
  component: NewsAdmin,
});

type Draft = {
  id?: string;
  kind: string;
  title: string;
  summary: string;
  body: string;
  event_date: string;
  event_time: string;
  location: string;
  image_url: string;
  published: boolean;
};

const EMPTY: Draft = {
  kind: "news",
  title: "",
  summary: "",
  body: "",
  event_date: "",
  event_time: "",
  location: "",
  image_url: "",
  published: true,
};

function NewsAdmin() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const { data } = useQuery({
    queryKey: ["admin", "posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Post[];
    },
  });

  const posts = data ?? [];
  const set = (patch: Partial<Draft>) =>
    setDraft((d) => (d ? { ...d, ...patch } : d));

  const edit = (p: Post) =>
    setDraft({
      id: p.id,
      kind: p.kind,
      title: p.title,
      summary: p.summary,
      body: p.body,
      event_date: p.event_date ?? "",
      event_time: p.event_time ?? "",
      location: p.location ?? "",
      image_url: p.image_url ?? "",
      published: p.published,
    });

  const handleUpload = async (file: File) => {
    try {
      const url = await uploadMedia(file, "posts");
      set({ image_url: url });
      toast.success("Image uploaded.");
    } catch {
      toast.error("Could not upload the image.");
    }
  };

  const save = async () => {
    if (!draft) return;
    if (!draft.title.trim()) {
      toast.error("Please enter a title.");
      return;
    }
    setSaving(true);
    const payload = {
      kind: draft.kind,
      title: draft.title.trim(),
      slug: slugify(draft.title) || crypto.randomUUID(),
      summary: draft.summary,
      body: draft.body,
      event_date: draft.event_date || null,
      event_time: draft.event_time || null,
      location: draft.location || null,
      image_url: draft.image_url || null,
      published: draft.published,
    };

    const { error } = draft.id
      ? await supabase.from("posts").update(payload).eq("id", draft.id)
      : await supabase.from("posts").insert(payload);

    setSaving(false);
    if (error) {
      toast.error("Could not save this update.");
      return;
    }
    toast.success("Saved. The website is updated.");
    setDraft(null);
    queryClient.invalidateQueries();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this item permanently?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) {
      toast.error("Could not delete the item.");
      return;
    }
    toast.success("Deleted.");
    queryClient.invalidateQueries();
  };

  const togglePublish = async (p: Post) => {
    const { error } = await supabase
      .from("posts")
      .update({ published: !p.published })
      .eq("id", p.id);
    if (error) {
      toast.error("Could not change visibility.");
      return;
    }
    queryClient.invalidateQueries();
  };

  return (
    <>
      <PageHeading
        title="News & Events"
        description="Add, edit or remove the news and events shown on the website."
        action={
          <Button className="rounded-full" onClick={() => setDraft({ ...EMPTY })}>
            Add new
          </Button>
        }
      />

      {draft && (
        <Panel title={draft.id ? "Edit item" : "New item"} className="mb-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="kind">Type</Label>
              <select
                id="kind"
                value={draft.kind}
                onChange={(e) => set({ kind: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="news">News</option>
                <option value="event">Event</option>
                <option value="upcoming">Upcoming</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={draft.title}
                onChange={(e) => set({ title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event_date">Date</Label>
              <Input
                id="event_date"
                type="date"
                value={draft.event_date}
                onChange={(e) => set({ event_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event_time">Time / duration</Label>
              <Input
                id="event_time"
                value={draft.event_time}
                placeholder="e.g. 10:00 AM or Aug 01 – 10"
                onChange={(e) => set({ event_time: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={draft.location}
                onChange={(e) => set({ location: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="summary">Short summary</Label>
              <Textarea
                id="summary"
                rows={2}
                value={draft.summary}
                onChange={(e) => set({ summary: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="body">Full description</Label>
              <Textarea
                id="body"
                rows={6}
                value={draft.body}
                onChange={(e) => set({ body: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="image">Image</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file);
                }}
              />
              {draft.image_url && (
                <img
                  src={draft.image_url}
                  alt="Selected"
                  className="mt-2 h-32 w-auto rounded-xl object-cover"
                />
              )}
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="published"
                checked={draft.published}
                onCheckedChange={(v) => set({ published: v })}
              />
              <Label htmlFor="published">Visible on the website</Label>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button className="rounded-full" onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => setDraft(null)}
            >
              Cancel
            </Button>
          </div>
        </Panel>
      )}

      {posts.length === 0 ? (
        <EmptyState>No news or events yet.</EmptyState>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <Panel key={p.id} className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg">{p.title}</h3>
                  <StatusPill published={p.published} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {p.kind} · {p.event_date ? formatDate(p.event_date) : formatDate(p.created_at)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => edit(p)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => togglePublish(p)}
                >
                  {p.published ? "Unpublish" : "Publish"}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="rounded-full"
                  onClick={() => remove(p.id)}
                >
                  Delete
                </Button>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}
