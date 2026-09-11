import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeading, Panel, StatusPill, EmptyState } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadMedia, type GalleryImage } from "@/lib/cms";

export const Route = createFileRoute("/admin/gallery")({
  component: GalleryAdmin,
});

function GalleryAdmin() {
  const queryClient = useQueryClient();
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);

  const { data } = useQuery({
    queryKey: ["admin", "gallery"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_images")
        .select("*")
        .order("sort_order")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as GalleryImage[];
    },
  });

  const images = data ?? [];

  const addImage = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadMedia(file, "gallery");
      const { error } = await supabase
        .from("gallery_images")
        .insert({ image_url: url, caption, published: true });
      if (error) throw error;
      toast.success("Image added to the gallery.");
      setCaption("");
      queryClient.invalidateQueries();
    } catch {
      toast.error("Could not add the image.");
    } finally {
      setUploading(false);
    }
  };

  const toggle = async (img: GalleryImage) => {
    const { error } = await supabase
      .from("gallery_images")
      .update({ published: !img.published })
      .eq("id", img.id);
    if (error) {
      toast.error("Could not change visibility.");
      return;
    }
    queryClient.invalidateQueries();
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this image from the gallery?")) return;
    const { error } = await supabase.from("gallery_images").delete().eq("id", id);
    if (error) {
      toast.error("Could not remove the image.");
      return;
    }
    queryClient.invalidateQueries();
  };

  return (
    <>
      <PageHeading
        title="Gallery"
        description="Upload and manage the photos shown in the media gallery."
      />

      <Panel title="Add a photo" className="mb-6">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="caption">Caption (optional)</Label>
            <Input
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="e.g. Amazio arts fest 2026"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="file">Photo</Label>
            <Input
              id="file"
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) addImage(file);
              }}
            />
          </div>
        </div>
        {uploading && <p className="mt-3 text-sm text-muted-foreground">Uploading...</p>}
      </Panel>

      {images.length === 0 ? (
        <EmptyState>No photos yet.</EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {images.map((img) => (
            <div
              key={img.id}
              className="overflow-hidden rounded-2xl border border-border bg-background"
            >
              <img
                src={img.image_url}
                alt={img.caption || "Gallery photo"}
                loading="lazy"
                className="h-48 w-full object-cover"
              />
              <div className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm">{img.caption || "Untitled"}</p>
                  <StatusPill published={img.published} />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => toggle(img)}
                  >
                    {img.published ? "Hide" : "Show"}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="rounded-full"
                    onClick={() => remove(img.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
