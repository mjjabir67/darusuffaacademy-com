import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Upload,
  RefreshCw,
  Trash2,
  Image as ImageIcon,
  ExternalLink,
  Loader2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageCropModal } from "@/components/admin/ImageCropModal";
import { uploadMedia, deleteStoredMedia, usePageBanner, updatePageBanner } from "@/lib/cms";
import bannerAsset from "@/assets/darusuffa-banner-flipped.png.asset.json";
import { toast } from "sonner";

interface PageBannerFieldManagerProps {
  pageKey: string;
  pageTitle: string;
  pageDescription?: string;
  liveUrl?: string;
  onBannerSaved?: (url: string | null) => Promise<void> | void;
  disabled?: boolean;
}

export function PageBannerFieldManager({
  pageKey,
  pageTitle,
  pageDescription,
  liveUrl,
  onBannerSaved,
  disabled = false,
}: PageBannerFieldManagerProps) {
  const queryClient = useQueryClient();
  const currentBanner = usePageBanner(pageKey);

  const [fileToCrop, setFileToCrop] = useState<string | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCustom = Boolean(currentBanner);
  const displayUrl = currentBanner || bannerAsset.url;

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

    // Reset so selecting the same file triggers onChange
    e.target.value = "";
  };

  const handleCropConfirm = async (croppedFile: File) => {
    setIsUploading(true);
    try {
      const oldUrl = currentBanner;
      // Upload to supabase storage under 'banners' folder
      const newUrl = await uploadMedia(croppedFile, `banners/${pageKey}`);

      // Persist to database site_settings
      await updatePageBanner(pageKey, newUrl);

      // Call optional custom callback
      if (onBannerSaved) {
        await onBannerSaved(newUrl);
      }

      // Invalidate queries so public page and admin components re-render immediately
      queryClient.invalidateQueries({ queryKey: ["settings", "page_banners"] });
      queryClient.invalidateQueries({ queryKey: ["settings", pageKey] });

      // Clean up previous custom banner file from storage
      if (oldUrl && oldUrl !== newUrl) {
        void deleteStoredMedia(oldUrl);
      }

      setIsCropOpen(false);
      setFileToCrop(null);
      toast.success(`${pageTitle} banner updated successfully.`);
    } catch (err) {
      console.error("[PageBannerFieldManager] Upload failed:", err);
      toast.error("Could not upload banner image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!currentBanner) return;
    setIsUploading(true);
    try {
      const oldUrl = currentBanner;
      await updatePageBanner(pageKey, null);

      if (onBannerSaved) {
        await onBannerSaved(null);
      }

      queryClient.invalidateQueries({ queryKey: ["settings", "page_banners"] });
      queryClient.invalidateQueries({ queryKey: ["settings", pageKey] });

      void deleteStoredMedia(oldUrl);
      toast.success(`${pageTitle} banner removed. Reverted to system default.`);
    } catch (err) {
      console.error("[PageBannerFieldManager] Remove failed:", err);
      toast.error("Failed to remove banner image.");
    } finally {
      setIsUploading(false);
    }
  };

  const triggerUpload = () => {
    if (disabled || isUploading) return;
    fileInputRef.current?.click();
  };

  return (
    <div
      id={`page-banner-manager-${pageKey}`}
      className="space-y-3.5 rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs"
    >
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-border/60">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary" />
            Banner Image &mdash; {pageTitle}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {pageDescription ||
              `Custom top hero banner image displayed at the head of the public ${pageTitle} page.`}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isCustom ? (
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1.5 shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Custom Banner Active
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full border border-border inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
              System Default Banner
            </span>
          )}

          {liveUrl && (
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-primary hover:underline inline-flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-primary/5 transition-colors"
              title="View public page"
            >
              <span>View Page</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
      />

      {/* Responsive Banner Preview & Overlay Showcase */}
      <div className="space-y-3">
        <div
          onClick={triggerUpload}
          className="group relative w-full aspect-[21/9] sm:aspect-[16/6] min-h-[140px] max-h-[260px] rounded-xl overflow-hidden bg-neutral-900 border border-border cursor-pointer transition-all hover:border-primary/50 shadow-inner"
          title="Click to upload or replace banner photo"
        >
          {/* Banner Photo */}
          <img
            src={displayUrl}
            alt={`${pageTitle} banner preview`}
            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]"
          />

          {/* Realistic gradient overlay identical to public view */}
          <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/75 to-ink/40 pointer-events-none" />

          {/* Sample Title / Heading Overlay to simulate the real page look */}
          <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-center pointer-events-none z-10 text-left">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-sand/90">
              Live Preview
            </span>
            <h4 className="font-display text-lg sm:text-2xl font-bold text-white tracking-tight mt-0.5">
              {pageTitle}
            </h4>
            <span className="text-[11px] text-white/70 hidden sm:inline-block mt-1 max-w-md line-clamp-1">
              {pageDescription || "Darusuffa Academy"}
            </span>
          </div>

          {/* Hover interaction prompt */}
          <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium gap-2 backdrop-blur-[2px] z-20">
            <Upload className="h-4 w-4" />
            <span>{isCustom ? "Click to Change Banner" : "Click to Upload Banner"}</span>
          </div>

          {/* Uploading indicator */}
          {isUploading && (
            <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-2 z-30">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-xs font-medium text-foreground">Saving banner...</span>
            </div>
          )}
        </div>

        {/* Action Controls & Description */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={isCustom ? "outline" : "default"}
              size="sm"
              className="rounded-xl gap-1.5 text-xs h-9 px-4 shadow-xs"
              onClick={triggerUpload}
              disabled={disabled || isUploading}
            >
              {isCustom ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5" />
                  Change Banner
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" />
                  Upload Banner
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
                Remove Banner
              </Button>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed max-w-md">
            Recommended wide banner format (16:6 or 21:9). You can crop, zoom, rotate, and preview
            before confirming.
          </p>
        </div>
      </div>

      {/* Reusable Image Crop & Adjust Modal */}
      <ImageCropModal
        open={isCropOpen}
        imageSrc={fileToCrop}
        cropShape="rect"
        aspectRatio={16 / 6}
        title={`Crop & Adjust ${pageTitle} Banner`}
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
