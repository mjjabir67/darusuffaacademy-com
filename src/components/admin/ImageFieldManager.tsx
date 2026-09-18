import { useState, useRef } from "react";
import { Upload, RefreshCw, Trash2, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageCropModal } from "@/components/admin/ImageCropModal";
import { uploadMedia, deleteStoredMedia } from "@/lib/cms";
import { toast } from "sonner";

interface ImageFieldManagerProps {
  label: string;
  description?: string;
  currentImageUrl?: string | null;
  defaultImageUrl?: string;
  storageFolder?: string;
  cropShape?: "round" | "rect";
  aspectRatio?: number;
  modalTitle?: string;
  onSave: (url: string | null) => Promise<void> | void;
  disabled?: boolean;
}

export function ImageFieldManager({
  label,
  description,
  currentImageUrl,
  defaultImageUrl,
  storageFolder = "uploads",
  cropShape = "rect",
  aspectRatio = 4 / 3,
  modalTitle,
  onSave,
  disabled = false,
}: ImageFieldManagerProps) {
  const [fileToCrop, setFileToCrop] = useState<string | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayUrl = currentImageUrl || defaultImageUrl;
  const isCustom = Boolean(currentImageUrl);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (JPG, PNG, WebP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFileToCrop(reader.result as string);
      setIsCropOpen(true);
    };
    reader.readAsDataURL(file);

    // Reset input so re-selecting the same file triggers change
    e.target.value = "";
  };

  const handleCropConfirm = async (croppedFile: File) => {
    setIsUploading(true);
    try {
      const oldUrl = currentImageUrl;
      const newUrl = await uploadMedia(croppedFile, storageFolder);

      await onSave(newUrl);

      // Clean up old custom media if it was stored in supabase storage
      if (oldUrl && oldUrl !== newUrl) {
        void deleteStoredMedia(oldUrl);
      }

      setIsCropOpen(false);
      setFileToCrop(null);
      toast.success(`${label} updated successfully.`);
    } catch (err) {
      console.error("[ImageFieldManager] Upload failed:", err);
      toast.error("Could not upload the image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!currentImageUrl) return;
    try {
      const oldUrl = currentImageUrl;
      await onSave(null);
      void deleteStoredMedia(oldUrl);
      toast.success(`${label} removed. Reverted to default.`);
    } catch (err) {
      console.error("[ImageFieldManager] Remove failed:", err);
      toast.error("Failed to remove image.");
    }
  };

  const triggerUpload = () => {
    if (disabled || isUploading) return;
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
        <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <ImageIcon className="h-4 w-4 text-primary" />
          {label}
        </label>
        {isCustom ? (
          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60 inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Custom Image Active
          </span>
        ) : defaultImageUrl ? (
          <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border">
            Using System Default
          </span>
        ) : (
          <span className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/60">
            No Image Set
          </span>
        )}
      </div>

      {description && <p className="text-xs text-muted-foreground">{description}</p>}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-2xl border border-border bg-card shadow-xs">
        {/* Preview Frame */}
        <div
          onClick={triggerUpload}
          className={`relative overflow-hidden rounded-xl bg-neutral-900 border border-border cursor-pointer group shrink-0 transition-transform hover:scale-[1.02] ${
            cropShape === "round"
              ? "w-28 h-28 rounded-full aspect-square"
              : "w-44 sm:w-48 aspect-[4/3]"
          }`}
          title="Click to change or upload photo"
        >
          {displayUrl ? (
            <img
              src={displayUrl}
              alt={label}
              className="h-full w-full object-cover transition-opacity duration-200 group-hover:opacity-85"
            />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center p-3 text-neutral-400 text-center gap-1.5">
              <ImageIcon className="h-7 w-7 opacity-50" />
              <span className="text-[10px] font-medium leading-tight">No image uploaded</span>
            </div>
          )}

          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium gap-1.5 backdrop-blur-[2px]">
            <Upload className="h-3.5 w-3.5" />
            <span>{isCustom ? "Replace" : "Upload"}</span>
          </div>

          {isUploading && (
            <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-1 z-10">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-[10px] font-medium text-foreground">Uploading...</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              type="button"
              variant={isCustom ? "outline" : "default"}
              size="sm"
              className="rounded-xl gap-1.5 text-xs h-9 px-3.5 shadow-xs"
              onClick={triggerUpload}
              disabled={disabled || isUploading}
            >
              {isCustom ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5" />
                  Change Image
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" />
                  Upload Image
                </>
              )}
            </Button>

            {isCustom && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-xl gap-1.5 text-xs h-9 px-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={handleRemove}
                disabled={disabled || isUploading}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove Image
              </Button>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Click &quot;{isCustom ? "Change Image" : "Upload Image"}&quot; to choose a photo. You
            can crop, rotate, and zoom the image before saving. Recommended format: JPG, PNG, or
            WebP.
          </p>
        </div>
      </div>

      {/* Image Crop Modal */}
      <ImageCropModal
        open={isCropOpen}
        imageSrc={fileToCrop}
        cropShape={cropShape}
        aspectRatio={aspectRatio}
        title={modalTitle || `Crop & Adjust ${label}`}
        isProcessing={isUploading}
        onConfirm={handleCropConfirm}
        onClose={() => {
          setIsCropOpen(false);
          setFileToCrop(null);
        }}
      />
    </div>
  );
}
