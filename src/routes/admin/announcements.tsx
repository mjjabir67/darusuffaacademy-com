import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, Edit2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeading, Panel, StatusPill, EmptyState } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { formatDate, type Announcement } from "@/lib/cms";
import { ConfirmDeleteDialog } from "@/components/admin/ConfirmDeleteDialog";

export const Route = createFileRoute("/admin/announcements")({
  component: AnnouncementsAdmin,
});

type Draft = { id?: string; title: string; body: string; published: boolean };
const EMPTY: Draft = { title: "", body: "", published: true };

function AnnouncementsAdmin() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Announcement[];
    },
  });

  const items = data ?? [];
  const set = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  const save = async () => {
    if (!draft) return;
    if (!draft.title.trim()) {
      toast.error("Please enter a title.");
      return;
    }
    const payload = {
      title: draft.title.trim(),
      body: draft.body,
      published: draft.published,
    };
    const { error } = draft.id
      ? await supabase.from("announcements").update(payload).eq("id", draft.id)
      : await supabase.from("announcements").insert(payload);
    if (error) {
      toast.error("Could not save the announcement: " + error.message);
      return;
    }
    toast.success("Announcement saved successfully.");
    setDraft(null);
    queryClient.invalidateQueries({ queryKey: ["admin", "announcements"] });
    queryClient.invalidateQueries({ queryKey: ["announcements"] });
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from("announcements").delete().eq("id", deleteTarget.id);

      if (error) {
        toast.error("Could not delete the announcement: " + error.message);
        return;
      }
      toast.success("Announcement deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ["admin", "announcements"] });
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
      setDeleteTarget(null);
    } catch (err) {
      console.error("[AnnouncementsAdmin] Delete error:", err);
      toast.error("An unexpected error occurred while deleting.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <PageHeading
        title="Announcements"
        description="Short notices shown across the website."
        action={
          <Button className="rounded-full gap-2" onClick={() => setDraft({ ...EMPTY })}>
            <Plus className="h-4 w-4" />
            Add announcement
          </Button>
        }
      />

      {draft && (
        <Panel title={draft.id ? "Edit announcement" : "New announcement"} className="mb-6">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={draft.title}
                onChange={(e) => set({ title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                rows={4}
                value={draft.body}
                onChange={(e) => set({ body: e.target.value })}
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
            <div className="flex gap-3">
              <Button className="rounded-full" onClick={save}>
                Save
              </Button>
              <Button variant="outline" className="rounded-full" onClick={() => setDraft(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </Panel>
      )}

      {items.length === 0 ? (
        <EmptyState>No announcements yet.</EmptyState>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <Panel key={a.id} className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg">{a.title}</h3>
                  <StatusPill published={a.published} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(a.created_at)}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full gap-1.5"
                  onClick={() =>
                    setDraft({
                      id: a.id,
                      title: a.title,
                      body: a.body,
                      published: a.published,
                    })
                  }
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="rounded-full gap-1.5"
                  onClick={() => setDeleteTarget(a)}
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
        title="Delete Announcement"
        itemName={deleteTarget?.title}
        description={`Are you sure you want to permanently delete "${deleteTarget?.title}"? This announcement will be removed from the website.`}
        onConfirm={executeDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}
