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
import { uploadMedia, deleteStoredMedia, type Course } from "@/lib/cms";
import { ConfirmDeleteDialog } from "@/components/admin/ConfirmDeleteDialog";

export const Route = createFileRoute("/admin/courses")({
  component: CoursesAdmin,
});

type Draft = {
  id?: string;
  title: string;
  description: string;
  image_url: string;
  sort_order: number;
  published: boolean;
};

const EMPTY: Draft = {
  title: "",
  description: "",
  image_url: "",
  sort_order: 0,
  published: true,
};

function CoursesAdmin() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data } = useQuery({
    queryKey: ["admin", "courses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("*").order("sort_order");
      if (error) throw error;
      return (data ?? []) as Course[];
    },
  });

  const courses = data ?? [];
  const set = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  const save = async () => {
    if (!draft) return;
    if (!draft.title.trim()) {
      toast.error("Please enter a course title.");
      return;
    }
    const payload = {
      title: draft.title.trim(),
      description: draft.description,
      image_url: draft.image_url || null,
      sort_order: draft.sort_order,
      published: draft.published,
    };
    const { error } = draft.id
      ? await supabase.from("courses").update(payload).eq("id", draft.id)
      : await supabase.from("courses").insert(payload);
    if (error) {
      toast.error("Could not save the course: " + error.message);
      return;
    }
    toast.success("Course saved successfully.");
    setDraft(null);
    queryClient.invalidateQueries({ queryKey: ["admin", "courses"] });
    queryClient.invalidateQueries({ queryKey: ["courses"] });
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from("courses").delete().eq("id", deleteTarget.id);
      if (error) {
        toast.error("Could not delete the course: " + error.message);
        return;
      }
      if (deleteTarget.image_url) {
        void deleteStoredMedia(deleteTarget.image_url);
      }
      toast.success("Course deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ["admin", "courses"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
      setDeleteTarget(null);
    } catch (err) {
      console.error("[CoursesAdmin] Delete error:", err);
      toast.error("An unexpected error occurred while deleting.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpload = async (file: File) => {
    try {
      const url = await uploadMedia(file, "courses");
      set({ image_url: url });
      toast.success("Image uploaded.");
    } catch {
      toast.error("Could not upload the image.");
    }
  };

  return (
    <>
      <PageHeading
        title="Courses & Programs"
        description="The courses listed on the academics and admission pages."
        action={
          <Button className="rounded-full gap-2" onClick={() => setDraft({ ...EMPTY })}>
            <Plus className="h-4 w-4" />
            Add course
          </Button>
        }
      />

      {draft && (
        <Panel title={draft.id ? "Edit course" : "New course"} className="mb-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={draft.title}
                onChange={(e) => set({ title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sort">Display order</Label>
              <Input
                id="sort"
                type="number"
                value={draft.sort_order}
                onChange={(e) => set({ sort_order: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={4}
                value={draft.description}
                onChange={(e) => set({ description: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="image">Image (optional)</Label>
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
            <Button className="rounded-full" onClick={save}>
              Save
            </Button>
            <Button variant="outline" className="rounded-full" onClick={() => setDraft(null)}>
              Cancel
            </Button>
          </div>
        </Panel>
      )}

      {courses.length === 0 ? (
        <EmptyState>No courses yet.</EmptyState>
      ) : (
        <div className="space-y-3">
          {courses.map((c) => (
            <Panel key={c.id} className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg">{c.title}</h3>
                  <StatusPill published={c.published} />
                </div>
                <p className="mt-1 max-w-xl text-sm text-muted-foreground">{c.description}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full gap-1.5"
                  onClick={() =>
                    setDraft({
                      id: c.id,
                      title: c.title,
                      description: c.description,
                      image_url: c.image_url ?? "",
                      sort_order: c.sort_order,
                      published: c.published,
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
                  onClick={() => setDeleteTarget(c)}
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
        title="Delete Course"
        itemName={deleteTarget?.title}
        description={`Are you sure you want to permanently delete "${deleteTarget?.title}"?`}
        onConfirm={executeDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}
