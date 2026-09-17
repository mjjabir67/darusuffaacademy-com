import { useState, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload, Trash2, Images, FolderOpen, Grid, X, Film } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeading, Panel, StatusPill, EmptyState } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  uploadMedia,
  deleteStoredMedia,
  parseGalleryMeta,
  serializeGalleryMeta,
  groupGalleryAlbums,
  isVideoUrl,
  type GalleryImage,
  type Post,
} from "@/lib/cms";
import { ConfirmDeleteDialog } from "@/components/admin/ConfirmDeleteDialog";

export const Route = createFileRoute("/admin/gallery")({
  component: GalleryAdmin,
});

interface PendingGalleryFile {
  id: string;
  file: File;
  previewUrl: string;
  isVideo: boolean;
}

function GalleryAdmin() {
  const queryClient = useQueryClient();

  // Mode: single or multiple
  const [uploadType, setUploadType] = useState<"single" | "multiple">("multiple");

  // Single upload state
  const [singleAlbum, setSingleAlbum] = useState("");
  const [singleCaption, setSingleCaption] = useState("");
  const [singleFile, setSingleFile] = useState<File | null>(null);
  const [singlePreview, setSinglePreview] = useState<string | null>(null);
  const [singleUploading, setSingleUploading] = useState(false);
  const singleInputRef = useRef<HTMLInputElement>(null);

  // Multiple upload state
  const [albumName, setAlbumName] = useState("");
  const [multipleFiles, setMultipleFiles] = useState<PendingGalleryFile[]>([]);
  const [multipleUploading, setMultipleUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number }>({
    current: 0,
    total: 0,
  });
  const multipleInputRef = useRef<HTMLInputElement>(null);

  // View state: 'albums' or 'all'
  const [activeView, setActiveView] = useState<"albums" | "all">("albums");

  // Deletion modal state
  const [deleteTarget, setDeleteTarget] = useState<
    | { type: "image"; image: GalleryImage }
    | { type: "album"; title: string; images: { id: string; url: string; caption?: string }[] }
    | null
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch gallery images
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

  // Fetch events to offer suggestions for album association
  const { data: posts = [] } = useQuery({
    queryKey: ["admin", "posts-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("id, title, slug")
        .order("created_at", { ascending: false });
      if (error) return [];
      return (data ?? []) as Post[];
    },
  });

  const images = data ?? [];
  const albums = groupGalleryAlbums(images);

  // Single image upload
  const handleSingleSelect = (file: File) => {
    setSingleFile(file);
    setSinglePreview(URL.createObjectURL(file));
  };

  const cancelSingle = () => {
    setSingleFile(null);
    if (singlePreview) {
      URL.revokeObjectURL(singlePreview);
      setSinglePreview(null);
    }
    setSingleCaption("");
    if (singleInputRef.current) singleInputRef.current.value = "";
  };

  const uploadSingle = async () => {
    if (!singleFile) return;
    setSingleUploading(true);
    try {
      const url = await uploadMedia(singleFile, "gallery");
      const isVideo = singleFile.type.startsWith("video/") || isVideoUrl(singleFile.name);
      const chosenAlbum = singleAlbum.trim() || "General Gallery";

      // Find if chosen album links to an existing event
      const matchedEvent = posts.find(
        (p) => p.title.trim().toLowerCase() === chosenAlbum.toLowerCase(),
      );

      const { error } = await supabase.from("gallery_images").insert({
        image_url: url,
        caption: serializeGalleryMeta({
          album: chosenAlbum,
          caption: singleCaption.trim(),
          eventId: matchedEvent?.id,
          eventSlug: matchedEvent?.slug,
          mediaType: isVideo ? "video" : "image",
        }),
        published: true,
      });

      if (error) throw error;
      toast.success("Image added to the gallery.");
      cancelSingle();
      queryClient.invalidateQueries();
    } catch {
      toast.error("Could not add the image.");
    } finally {
      setSingleUploading(false);
    }
  };

  // Multiple image upload
  const handleMultipleSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newItems: PendingGalleryFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isVideo = file.type.startsWith("video/") || isVideoUrl(file.name);
      newItems.push({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        isVideo,
      });
    }
    setMultipleFiles((prev) => [...prev, ...newItems]);
    if (multipleInputRef.current) multipleInputRef.current.value = "";
  };

  const removePendingFile = (id: string) => {
    setMultipleFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  };

  const clearAllPending = () => {
    multipleFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    setMultipleFiles([]);
    if (multipleInputRef.current) multipleInputRef.current.value = "";
  };

  const uploadMultiple = async () => {
    if (multipleFiles.length === 0) return;
    const chosenAlbum = albumName.trim() || "General Gallery";

    setMultipleUploading(true);
    setUploadProgress({ current: 0, total: multipleFiles.length });

    const matchedEvent = posts.find(
      (p) => p.title.trim().toLowerCase() === chosenAlbum.toLowerCase(),
    );

    let successCount = 0;
    for (let i = 0; i < multipleFiles.length; i++) {
      const item = multipleFiles[i];
      setUploadProgress({ current: i + 1, total: multipleFiles.length });

      try {
        const url = await uploadMedia(item.file, "gallery");
        const { error } = await supabase.from("gallery_images").insert({
          image_url: url,
          caption: serializeGalleryMeta({
            album: chosenAlbum,
            caption: "",
            eventId: matchedEvent?.id,
            eventSlug: matchedEvent?.slug,
            mediaType: item.isVideo ? "video" : "image",
          }),
          sort_order: i,
          published: true,
        });
        if (!error) successCount++;
      } catch (err) {
        console.warn("Failed to upload image:", item.file.name, err);
      }
    }

    setMultipleUploading(false);
    clearAllPending();
    setAlbumName("");
    queryClient.invalidateQueries();

    if (successCount > 0) {
      toast.success(`Album "${chosenAlbum}" published with ${successCount} images.`);
    } else {
      toast.error("Could not upload images.");
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

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      if (deleteTarget.type === "image") {
        const img = deleteTarget.image;
        const { data: deletedRows, error: dbError } = await supabase
          .from("gallery_images")
          .delete()
          .eq("id", img.id)
          .select();

        if (dbError) {
          console.error("[GalleryAdmin] Failed to delete image:", dbError);
          toast.error("Could not delete image. " + (dbError.message || ""));
          setIsDeleting(false);
          return;
        }

        if (!deletedRows || deletedRows.length === 0) {
          toast.error("Could not delete image. Permission denied or item not found.");
          setIsDeleting(false);
          return;
        }

        // Clean up file in storage
        if (img.image_url) {
          await deleteStoredMedia(img.image_url).catch((err) => {
            console.warn("[GalleryAdmin] Storage cleanup warning:", err);
          });
        }

        toast.success("Image removed from gallery.");
      } else if (deleteTarget.type === "album") {
        const { title, images: albumImgs } = deleteTarget;
        const ids = albumImgs.map((i) => i.id);

        const { data: deletedRows, error: dbError } = await supabase
          .from("gallery_images")
          .delete()
          .in("id", ids)
          .select();

        if (dbError) {
          console.error("[GalleryAdmin] Failed to delete album:", dbError);
          toast.error("Could not delete album. " + (dbError.message || ""));
          setIsDeleting(false);
          return;
        }

        if (!deletedRows || deletedRows.length === 0) {
          toast.error("Could not delete album. Permission denied or items not found.");
          setIsDeleting(false);
          return;
        }

        // Clean up all storage files for these album images
        await Promise.allSettled(albumImgs.map((img) => deleteStoredMedia(img.url)));

        toast.success(`Album "${title}" deleted.`);
      }

      setDeleteTarget(null);
      queryClient.invalidateQueries();
    } catch (err) {
      console.error("[GalleryAdmin] Unexpected deletion error:", err);
      toast.error("An unexpected error occurred while deleting.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <PageHeading
        title="Gallery"
        description="Upload and manage the photos and albums shown in the media gallery."
      />

      {/* Datalist for album/event suggestions */}
      <datalist id="album-event-suggestions">
        {posts.map((p) => (
          <option key={p.id} value={p.title}>
            {p.title} (Event)
          </option>
        ))}
        {albums.map((a) => (
          <option key={a.slug} value={a.title}>
            {a.title} (Existing Album)
          </option>
        ))}
      </datalist>

      {/* ADD GALLERY CONTENT PANEL */}
      <Panel title="Gallery Upload" className="mb-8 space-y-6">
        <div>
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            What would you like to upload?
          </Label>

          <div className="mt-2 flex flex-wrap gap-2">
            <button
              id="gallery-type-single-btn"
              type="button"
              onClick={() => setUploadType("single")}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                uploadType === "single"
                  ? "border-primary bg-primary text-primary-foreground shadow-xs"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              <div
                className={`h-2.5 w-2.5 rounded-full ${
                  uploadType === "single" ? "bg-white" : "bg-muted-foreground/40"
                }`}
              />
              <span>Upload One Image</span>
            </button>

            <button
              id="gallery-type-multiple-btn"
              type="button"
              onClick={() => setUploadType("multiple")}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                uploadType === "multiple"
                  ? "border-primary bg-primary text-primary-foreground shadow-xs"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              <div
                className={`h-2.5 w-2.5 rounded-full ${
                  uploadType === "multiple" ? "bg-white" : "bg-muted-foreground/40"
                }`}
              />
              <span>Upload Multiple Images</span>
            </button>
          </div>
        </div>

        {/* SINGLE IMAGE FORM */}
        {uploadType === "single" && (
          <div className="space-y-4 rounded-2xl border border-border/80 bg-background/50 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="single-album">Album / Event Name</Label>
                <Input
                  id="single-album"
                  list="album-event-suggestions"
                  value={singleAlbum}
                  onChange={(e) => setSingleAlbum(e.target.value)}
                  placeholder="e.g. Meelad Celebration 2026"
                  disabled={singleUploading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="single-caption">Caption (optional)</Label>
                <Input
                  id="single-caption"
                  value={singleCaption}
                  onChange={(e) => setSingleCaption(e.target.value)}
                  placeholder="e.g. Inaugural session at campus"
                  disabled={singleUploading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="single-image-file">Select Image</Label>
              <Input
                id="single-image-file"
                ref={singleInputRef}
                type="file"
                accept="image/*,video/*"
                disabled={singleUploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleSingleSelect(file);
                }}
              />
            </div>

            {singleFile && singlePreview && (
              <div className="flex items-center gap-4 rounded-xl border border-border bg-background p-3">
                <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <img src={singlePreview} alt="Preview" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{singleFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(singleFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    id="add-single-image-btn"
                    size="sm"
                    className="rounded-full"
                    onClick={uploadSingle}
                    disabled={singleUploading}
                  >
                    <Upload className="mr-1.5 h-3.5 w-3.5" />
                    <span>{singleUploading ? "Uploading..." : "Add to Gallery"}</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-full p-2 h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={cancelSingle}
                    disabled={singleUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MULTIPLE IMAGES / BULK UPLOAD FORM */}
        {uploadType === "multiple" && (
          <div className="space-y-5 rounded-2xl border border-border/80 bg-background/50 p-5">
            <div className="space-y-2">
              <Label htmlFor="multiple-album-name" className="text-sm font-semibold">
                Album / Event Name
              </Label>
              <Input
                id="multiple-album-name"
                list="album-event-suggestions"
                value={albumName}
                onChange={(e) => setAlbumName(e.target.value)}
                placeholder="e.g. Meelad Celebration 2026"
                disabled={multipleUploading}
              />
              <p className="text-xs text-muted-foreground">
                All selected photos will be grouped together under this album name. Type a new name
                or pick an existing event.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor="multiple-files-input" className="text-sm font-semibold">
                  Images
                </Label>
                <Button
                  id="select-bulk-images-btn"
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full gap-1.5 text-xs"
                  onClick={() => multipleInputRef.current?.click()}
                  disabled={multipleUploading}
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Choose Images</span>
                </Button>
                <input
                  id="multiple-files-input"
                  ref={multipleInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  className="hidden"
                  disabled={multipleUploading}
                  onChange={(e) => handleMultipleSelect(e.target.files)}
                />
              </div>

              {multipleFiles.length === 0 && (
                <div
                  onClick={() => multipleInputRef.current?.click()}
                  className="cursor-pointer rounded-2xl border-2 border-dashed border-border/80 p-8 text-center transition hover:border-primary/50 hover:bg-primary/5"
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary/80 text-muted-foreground">
                    <Images className="h-6 w-6" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-foreground">
                    Click to select multiple photos
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Support for batch selection of JPG, PNG, WEBP, and videos
                  </p>
                </div>
              )}
            </div>

            {/* PREVIEWS & UPLOAD ALL */}
            {multipleFiles.length > 0 && (
              <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      id="selected-images-count-badge"
                      className="rounded-full bg-primary/20 px-3 py-1 font-mono text-xs font-semibold text-primary"
                    >
                      {multipleFiles.length} {multipleFiles.length === 1 ? "image" : "images"}{" "}
                      selected
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Album:{" "}
                      <strong className="text-foreground">
                        {albumName.trim() || "General Gallery"}
                      </strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      id="upload-all-bulk-btn"
                      size="sm"
                      className="rounded-full gap-1.5 font-medium shadow-xs"
                      onClick={uploadMultiple}
                      disabled={multipleUploading}
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>
                        {multipleUploading
                          ? `Uploading ${uploadProgress.current}/${uploadProgress.total}...`
                          : "Upload All"}
                      </span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full text-xs text-muted-foreground hover:text-foreground"
                      onClick={clearAllPending}
                      disabled={multipleUploading}
                    >
                      Clear All
                    </Button>
                  </div>
                </div>

                {/* Progress bar */}
                {multipleUploading && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Uploading images...</span>
                      <span>
                        {Math.round((uploadProgress.current / uploadProgress.total) * 100)}%
                      </span>
                    </div>
                    <Progress
                      value={(uploadProgress.current / uploadProgress.total) * 100}
                      className="h-2"
                    />
                  </div>
                )}

                {/* Preview Grid */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6 pt-2">
                  {multipleFiles.map((item) => (
                    <div
                      key={item.id}
                      className="group relative overflow-hidden rounded-xl border border-border bg-background shadow-xs"
                    >
                      <div className="relative h-24 w-full bg-muted">
                        {item.isVideo ? (
                          <div className="flex h-full w-full items-center justify-center bg-black/80 text-white">
                            <Film className="h-6 w-6" />
                          </div>
                        ) : (
                          <img
                            src={item.previewUrl}
                            alt="Preview"
                            className="h-full w-full object-cover"
                          />
                        )}
                        <button
                          type="button"
                          aria-label="Remove image"
                          onClick={() => removePendingFile(item.id)}
                          className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white opacity-90 transition hover:bg-destructive hover:opacity-100"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="p-1.5">
                        <p className="truncate text-[11px] font-medium text-foreground">
                          {item.file.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Panel>

      {/* GALLERY MANAGEMENT & VIEW SWITCHER */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-lg font-semibold text-foreground">
          Existing Gallery Media ({images.length} photos in {albums.length} albums)
        </h3>

        <div className="inline-flex rounded-full border border-border bg-background p-1 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveView("albums")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
              activeView === "albums"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FolderOpen className="h-3.5 w-3.5" />
            <span>Grouped by Album ({albums.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView("all")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
              activeView === "all"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Grid className="h-3.5 w-3.5" />
            <span>All Photos ({images.length})</span>
          </button>
        </div>
      </div>

      {images.length === 0 ? (
        <EmptyState>No photos in the gallery yet.</EmptyState>
      ) : activeView === "albums" ? (
        /* ALBUM GROUPED VIEW */
        <div className="space-y-6">
          {albums.map((album) => (
            <Panel
              key={album.slug}
              className="space-y-4"
              title={
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-lg font-medium">{album.title}</span>
                    <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                      {album.count} {album.count === 1 ? "Photo" : "Photos"}
                    </span>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-1"
                    onClick={() =>
                      setDeleteTarget({
                        type: "album",
                        title: album.title,
                        images: album.images,
                      })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Album</span>
                  </Button>
                </div>
              }
            >
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {album.images.map((img) => (
                  <div
                    key={img.id}
                    className="group flex flex-col overflow-hidden rounded-xl border border-border bg-background shadow-xs"
                  >
                    <div className="relative h-32 w-full bg-muted">
                      {img.type === "video" ? (
                        <div className="flex h-full w-full items-center justify-center bg-black/90 text-white">
                          <Film className="h-8 w-8" />
                        </div>
                      ) : (
                        <img
                          src={img.url}
                          alt={img.caption || album.title}
                          className="h-full w-full object-cover"
                        />
                      )}
                      <div className="absolute right-1.5 top-1.5">
                        <StatusPill published={img.published} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2">
                      <p className="truncate text-xs text-muted-foreground min-w-0 flex-1">
                        {img.caption || (img.type === "video" ? "Video" : "Photo")}
                      </p>
                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs"
                          onClick={() => {
                            const original = images.find((i) => i.id === img.id);
                            if (original) toggle(original);
                          }}
                        >
                          {img.published ? "Hide" : "Show"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            const original = images.find((i) => i.id === img.id);
                            if (original) {
                              setDeleteTarget({ type: "image", image: original });
                            }
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          ))}
        </div>
      ) : (
        /* ALL PHOTOS FLAT VIEW */
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {images.map((img) => {
            const meta = parseGalleryMeta(img.caption);
            const isVideo = meta.mediaType === "video" || isVideoUrl(img.image_url);

            return (
              <div
                key={img.id}
                className="overflow-hidden rounded-2xl border border-border bg-background shadow-xs"
              >
                <div className="relative h-48 w-full bg-muted">
                  {isVideo ? (
                    <div className="flex h-full w-full items-center justify-center bg-black/90 text-white">
                      <Film className="h-10 w-10" />
                    </div>
                  ) : (
                    <img
                      src={img.image_url}
                      alt={meta.caption || img.caption || "Gallery photo"}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  )}
                  <span className="absolute bottom-2 left-2 rounded-md bg-black/70 px-2 py-0.5 font-display text-[11px] text-white backdrop-blur">
                    {meta.album || "General Gallery"}
                  </span>
                </div>

                <div className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-medium">
                      {meta.caption || meta.album || "Untitled"}
                    </p>
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
                      onClick={() => setDeleteTarget({ type: "image", image: img })}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={deleteTarget?.type === "album" ? "Delete Gallery Album" : "Delete Gallery Image"}
        itemName={
          deleteTarget?.type === "album"
            ? deleteTarget.title
            : deleteTarget
              ? parseGalleryMeta(deleteTarget.image.caption).caption || "this image"
              : undefined
        }
        description={
          deleteTarget?.type === "album"
            ? `Are you sure you want to permanently delete the album "${deleteTarget.title}" and all ${deleteTarget.images.length} of its photos? Associated files will be removed from storage.`
            : "Are you sure you want to permanently delete this photo from the gallery? The file will also be removed from storage."
        }
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}
