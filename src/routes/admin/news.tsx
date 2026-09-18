import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Images, Edit2, Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeading, Panel, StatusPill, EmptyState } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { slugify, uploadMedia, deleteStoredMedia, formatDate, type Post } from "@/lib/cms";
import { EventMediaManager } from "@/components/admin/EventMediaManager";
import { ConfirmDeleteDialog } from "@/components/admin/ConfirmDeleteDialog";
import { ImageFieldManager } from "@/components/admin/ImageFieldManager";

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
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
  const set = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));

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

    const exists = posts.some((p) => p.id === draft.id);
    const { error } = exists
      ? await supabase.from("posts").update(payload).eq("id", draft.id)
      : await supabase.from("posts").insert(draft.id ? { ...payload, id: draft.id } : payload);

    setSaving(false);
    if (error) {
      toast.error("Could not save this update: " + error.message);
      return;
    }
    toast.success("Saved. The website is updated.");
    setDraft(null);
    queryClient.invalidateQueries({ queryKey: ["admin", "posts"] });
    queryClient.invalidateQueries({ queryKey: ["posts"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      // 1. Delete post from database
      const { error } = await supabase.from("posts").delete().eq("id", deleteTarget.id);
      if (error) {
        toast.error("Could not delete the item: " + error.message);
        return;
      }

      // 2. Clean up cover image if present
      if (deleteTarget.image_url) {
        void deleteStoredMedia(deleteTarget.image_url);
      }

      toast.success("Item deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ["admin", "posts"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
      setDeleteTarget(null);
    } catch (err) {
      console.error("[NewsAdmin] Delete error:", err);
      toast.error("An unexpected error occurred while deleting.");
    } finally {
      setIsDeleting(false);
    }
  };

  const togglePublish = async (p: Post) => {
    const { error } = await supabase
      .from("posts")
      .update({ published: !p.published })
      .eq("id", p.id);
    if (error) {
      toast.error("Could not change visibility: " + error.message);
      return;
    }
    toast.success(p.published ? "Post unpublished." : "Post published.");
    queryClient.invalidateQueries({ queryKey: ["admin", "posts"] });
    queryClient.invalidateQueries({ queryKey: ["posts"] });
  };

  return (
    <>
      <PageHeading
        title="News & Events"
        description="Add, edit or remove the news and events shown on the website."
        action={
          <Button
            className="rounded-full gap-2"
            onClick={() => setDraft({ ...EMPTY, id: crypto.randomUUID() })}
          >
            <Plus className="h-4 w-4" />
            Add new
          </Button>
        }
      />

      {draft && (
        <Panel
          title={draft.id && posts.some((p) => p.id === draft.id) ? "Edit item" : "New item"}
          className="mb-6"
        >
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
              <ImageFieldManager
                label="Featured Image"
                description="Photo displayed in the news/event card and detail modal."
                currentImageUrl={draft.image_url}
                storageFolder="posts"
                cropShape="rect"
                aspectRatio={16 / 9}
                modalTitle="Crop & Adjust Event Image"
                onSave={(url) => set({ image_url: url ?? "" })}
              />
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

          {/* Event Media Management Section */}
          <div className="mt-8">
            <EventMediaManager
              eventId={draft.id || ""}
              eventTitle={draft.title}
              eventSlug={slugify(draft.title) || draft.id || ""}
            />
          </div>

          <div className="mt-6 flex gap-3">
            <Button className="rounded-full" onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button variant="outline" className="rounded-full" onClick={() => setDraft(null)}>
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
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg">{p.title}</h3>
                  <StatusPill published={p.published} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {p.kind} · {p.event_date ? formatDate(p.event_date) : formatDate(p.created_at)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full gap-1.5"
                  onClick={() => edit(p)}
                >
                  <Images className="h-3.5 w-3.5" />
                  <span>Media</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full gap-1.5"
                  onClick={() => edit(p)}
                >
                  <Edit2 className="h-3.5 w-3.5" />
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
                  className="rounded-full gap-1.5"
                  onClick={() => setDeleteTarget(p)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            </Panel>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete Post"
        itemName={deleteTarget?.title}
        description={`Are you sure you want to permanently delete "${deleteTarget?.title}"? Any attached media will also be cleaned up.`}
        onConfirm={executeDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}
