import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Upload,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Film,
  Images,
  X,
  CheckCircle2,
  FileCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  uploadMedia,
  deleteStoredMedia,
  parseGalleryMeta,
  serializeGalleryMeta,
  isVideoUrl,
  type GalleryImage,
} from "@/lib/cms";
import { ConfirmDeleteDialog } from "@/components/admin/ConfirmDeleteDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

interface EventMediaManagerProps {
  eventId: string;
  eventTitle: string;
  eventSlug: string;
}

interface PendingFile {
  id: string;
  file: File;
  previewUrl: string;
  isVideo: boolean;
}

export function EventMediaManager({ eventId, eventTitle, eventSlug }: EventMediaManagerProps) {
  const queryClient = useQueryClient();
  const [uploadMode, setUploadMode] = useState<"single" | "multiple">("single");

  // Single file state
  const [singleFile, setSingleFile] = useState<File | null>(null);
  const [singlePreview, setSinglePreview] = useState<string | null>(null);
  const [singleCaption, setSingleCaption] = useState("");
  const [singleUploading, setSingleUploading] = useState(false);

  // Multiple files state
  const [multipleFiles, setMultipleFiles] = useState<PendingFile[]>([]);
  const [multipleUploading, setMultipleUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number }>({
    current: 0,
    total: 0,
  });

  const singleFileInputRef = useRef<HTMLInputElement>(null);
  const multipleFileInputRef = useRef<HTMLInputElement>(null);

  // Deletion modal state
  const [deleteTarget, setDeleteTarget] = useState<GalleryImage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch all gallery images to get items associated with this event
  const { data: allImages = [], isLoading } = useQuery({
    queryKey: ["admin", "gallery"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_images")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as GalleryImage[];
    },
  });

  // Filter for this event
  const normTitle = eventTitle.trim().toLowerCase();
  const normSlug = eventSlug.trim().toLowerCase();

  const eventMedia = allImages
    .filter((img) => {
      const meta = parseGalleryMeta(img.caption);
      if (meta.eventId && meta.eventId === eventId) return true;
      if (meta.eventSlug && meta.eventSlug.toLowerCase() === normSlug) return true;
      const albumNorm = meta.album.trim().toLowerCase();
      if (normTitle && albumNorm === normTitle) return true;
      if (normSlug && albumNorm === normSlug) return true;
      return false;
    })
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  // Single file selection handler
  const handleSingleSelect = (file: File) => {
    setSingleFile(file);
    const isVideo = file.type.startsWith("video/") || isVideoUrl(file.name);
    setSinglePreview(URL.createObjectURL(file));
  };

  const cancelSingleSelection = () => {
    setSingleFile(null);
    if (singlePreview) {
      URL.revokeObjectURL(singlePreview);
      setSinglePreview(null);
    }
    setSingleCaption("");
    if (singleFileInputRef.current) singleFileInputRef.current.value = "";
  };

  const uploadSingle = async () => {
    if (!singleFile) return;
    setSingleUploading(true);
    try {
      const url = await uploadMedia(singleFile, "event-media");
      const isVideo = singleFile.type.startsWith("video/") || isVideoUrl(singleFile.name);
      const nextSort = eventMedia.length;

      const { error } = await supabase.from("gallery_images").insert({
        image_url: url,
        caption: serializeGalleryMeta({
          album: eventTitle.trim() || "Event Media",
          caption: singleCaption.trim(),
          eventId,
          eventSlug,
          mediaType: isVideo ? "video" : "image",
        }),
        sort_order: nextSort,
        published: true,
      });

      if (error) throw error;

      toast.success("Media file uploaded successfully.");
      cancelSingleSelection();
      queryClient.invalidateQueries({ queryKey: ["admin", "gallery"] });
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
    } catch {
      toast.error("Could not upload the media file.");
    } finally {
      setSingleUploading(false);
    }
  };

  // Multiple files selection handler
  const handleMultipleSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newItems: PendingFile[] = [];
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
    if (multipleFileInputRef.current) multipleFileInputRef.current.value = "";
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
    if (multipleFileInputRef.current) multipleFileInputRef.current.value = "";
  };

  const uploadMultiple = async () => {
    if (multipleFiles.length === 0) return;
    setMultipleUploading(true);
    setUploadProgress({ current: 0, total: multipleFiles.length });

    let successCount = 0;
    const startIndex = eventMedia.length;

    for (let i = 0; i < multipleFiles.length; i++) {
      const item = multipleFiles[i];
      setUploadProgress({ current: i + 1, total: multipleFiles.length });
      try {
        const url = await uploadMedia(item.file, "event-media");
        const { error } = await supabase.from("gallery_images").insert({
          image_url: url,
          caption: serializeGalleryMeta({
            album: eventTitle.trim() || "Event Media",
            caption: "",
            eventId,
            eventSlug,
            mediaType: item.isVideo ? "video" : "image",
          }),
          sort_order: startIndex + i,
          published: true,
        });
        if (!error) successCount++;
      } catch (err) {
        console.warn("Failed to upload file:", item.file.name, err);
      }
    }

    setMultipleUploading(false);
    clearAllPending();
    queryClient.invalidateQueries({ queryKey: ["admin", "gallery"] });
    queryClient.invalidateQueries({ queryKey: ["gallery"] });

    if (successCount > 0) {
      toast.success(`${successCount} media files uploaded successfully.`);
    } else {
      toast.error("Failed to upload media files.");
    }
  };

  // Reordering media items
  const moveMedia = async (index: number, direction: "left" | "right") => {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= eventMedia.length) return;

    const current = eventMedia[index];
    const target = eventMedia[targetIndex];

    const currentOrder = current.sort_order ?? index;
    const targetOrder = target.sort_order ?? targetIndex;

    const newCurrentOrder =
      currentOrder === targetOrder ? targetOrder + (direction === "left" ? -1 : 1) : targetOrder;
    const newTargetOrder = currentOrder;

    await Promise.all([
      supabase.from("gallery_images").update({ sort_order: newCurrentOrder }).eq("id", current.id),
      supabase.from("gallery_images").update({ sort_order: newTargetOrder }).eq("id", target.id),
    ]);

    queryClient.invalidateQueries({ queryKey: ["admin", "gallery"] });
    queryClient.invalidateQueries({ queryKey: ["gallery"] });
  };

  // Deleting a media item
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      // 1. Delete from database
      const { data: deletedRows, error: dbError } = await supabase
        .from("gallery_images")
        .delete()
        .eq("id", deleteTarget.id)
        .select();

      if (dbError) {
        console.error("[EventMediaManager] Failed to delete gallery image:", dbError);
        toast.error("Could not delete media item. " + (dbError.message || ""));
        setIsDeleting(false);
        return;
      }

      if (!deletedRows || deletedRows.length === 0) {
        console.warn("[EventMediaManager] No rows deleted, check admin permissions.");
        toast.error("Could not delete media item. Permission denied or item not found.");
        setIsDeleting(false);
        return;
      }

      // 2. Safely clean up file in storage
      if (deleteTarget.image_url) {
        await deleteStoredMedia(deleteTarget.image_url).catch((err) => {
          console.warn("[EventMediaManager] Storage cleanup warning:", err);
        });
      }

      toast.success("Media item deleted.");
      setDeleteTarget(null);

      // Invalidate queries so UI immediately reflects removal
      queryClient.invalidateQueries({ queryKey: ["admin", "gallery"] });
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
    } catch (err) {
      console.error("[EventMediaManager] Deletion error:", err);
      toast.error("An unexpected error occurred while deleting.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      id="event-media-manager"
      className="space-y-6 rounded-2xl border border-border/80 bg-card/60 p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <h4 className="font-display text-base font-semibold text-foreground flex items-center gap-2">
            <Images className="h-4 w-4 text-primary" />
            <span>Event Media Gallery</span>
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Photos and videos uploaded specifically for this event. Public visitors can view them
            via the "Media" button.
          </p>
        </div>

        {/* Upload Mode Switcher */}
        <div className="inline-flex rounded-full border border-border bg-background p-1 shadow-xs">
          <button
            id="event-media-mode-single"
            type="button"
            onClick={() => setUploadMode("single")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
              uploadMode === "single"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Upload One
          </button>
          <button
            id="event-media-mode-multiple"
            type="button"
            onClick={() => setUploadMode("multiple")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
              uploadMode === "multiple"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Upload Multiple
          </button>
        </div>
      </div>

      {/* UPLOAD ONE MODE */}
      {uploadMode === "single" && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="single-media-file" className="text-xs">
                Select Photo or Video
              </Label>
              <Input
                id="single-media-file"
                ref={singleFileInputRef}
                type="file"
                accept="image/*,video/*"
                disabled={singleUploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleSingleSelect(file);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="single-media-caption" className="text-xs">
                Caption (optional)
              </Label>
              <Input
                id="single-media-caption"
                value={singleCaption}
                onChange={(e) => setSingleCaption(e.target.value)}
                placeholder="e.g. Inauguration ceremony"
                disabled={singleUploading}
              />
            </div>
          </div>

          {/* Single preview */}
          {singleFile && singlePreview && (
            <div className="flex items-center gap-4 rounded-xl border border-border bg-background p-3">
              <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                {singleFile.type.startsWith("video/") || isVideoUrl(singleFile.name) ? (
                  <div className="flex h-full w-full items-center justify-center bg-black/80 text-white">
                    <Film className="h-6 w-6" />
                  </div>
                ) : (
                  <img src={singlePreview} alt="Preview" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-foreground">{singleFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(singleFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  id="event-media-single-upload-btn"
                  size="sm"
                  className="rounded-full gap-1 text-xs"
                  onClick={uploadSingle}
                  disabled={singleUploading}
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>{singleUploading ? "Uploading..." : "Upload File"}</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full p-2 h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={cancelSingleSelection}
                  disabled={singleUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* UPLOAD MULTIPLE MODE */}
      {uploadMode === "multiple" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <Label htmlFor="multiple-media-files" className="text-xs">
                Select Multiple Photos or Videos
              </Label>
              <p className="text-xs text-muted-foreground">
                You can select multiple files at once. Preview before uploading.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                id="select-multiple-media-btn"
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full gap-1.5 text-xs"
                onClick={() => multipleFileInputRef.current?.click()}
                disabled={multipleUploading}
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Select Files</span>
              </Button>
              <input
                id="multiple-media-files"
                ref={multipleFileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                className="hidden"
                disabled={multipleUploading}
                onChange={(e) => handleMultipleSelect(e.target.files)}
              />
            </div>
          </div>

          {/* Selected Count & Upload All button */}
          {multipleFiles.length > 0 && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-primary/20 px-3 py-1 font-mono text-xs font-semibold text-primary">
                    {multipleFiles.length} {multipleFiles.length === 1 ? "file" : "files"} selected
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Ready to upload to this event
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    id="event-media-upload-all-btn"
                    size="sm"
                    className="rounded-full gap-1.5 text-xs font-medium"
                    onClick={uploadMultiple}
                    disabled={multipleUploading}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>
                      {multipleUploading
                        ? `Uploading ${uploadProgress.current}/${uploadProgress.total}...`
                        : "Upload All Selected"}
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

              {/* Upload Progress Bar */}
              {multipleUploading && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Uploading files...</span>
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

              {/* Previews grid with remove buttons */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5 pt-2">
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
                        aria-label="Remove file"
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

      {/* ALREADY UPLOADED EVENT MEDIA */}
      <div className="border-t border-border/60 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Uploaded Event Media ({eventMedia.length})
          </h5>
          {eventMedia.length > 0 && (
            <span className="text-xs text-muted-foreground">Use arrows to reorder</span>
          )}
        </div>

        {eventMedia.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            No media uploaded for this event yet. On the public website, clicking the "Media" button
            will display "No media uploaded".
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {eventMedia.map((img, index) => {
              const meta = parseGalleryMeta(img.caption);
              const isVideo = meta.mediaType === "video" || isVideoUrl(img.image_url);

              return (
                <div
                  key={img.id}
                  className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-background shadow-xs"
                >
                  <div className="relative h-28 w-full bg-muted">
                    {isVideo ? (
                      <div className="flex h-full w-full items-center justify-center bg-black/90 text-white">
                        <Film className="h-8 w-8" />
                      </div>
                    ) : (
                      <img
                        src={img.image_url}
                        alt={meta.caption || "Event media"}
                        className="h-full w-full object-cover"
                      />
                    )}

                    {/* Order badge */}
                    <span className="absolute left-1.5 top-1.5 rounded-md bg-black/60 px-1.5 py-0.5 font-mono text-[10px] text-white">
                      #{index + 1}
                    </span>

                    {/* Delete button */}
                    <button
                      type="button"
                      aria-label="Delete media item"
                      onClick={() => setDeleteTarget(img)}
                      className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-80 transition hover:bg-destructive hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Reorder and caption bar */}
                  <div className="flex items-center justify-between p-2">
                    <p className="truncate text-[11px] text-muted-foreground min-w-0 flex-1">
                      {meta.caption || (isVideo ? "Video" : "Photo")}
                    </p>
                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      <button
                        type="button"
                        aria-label="Move left"
                        disabled={index === 0}
                        onClick={() => moveMedia(index, "left")}
                        className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Move right"
                        disabled={index === eventMedia.length - 1}
                        onClick={() => moveMedia(index, "right")}
                        className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete Event Media"
        itemName={
          deleteTarget
            ? parseGalleryMeta(deleteTarget.caption).caption || "this media item"
            : undefined
        }
        description="Are you sure you want to permanently delete this media item from this event? The file will also be removed from storage."
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
