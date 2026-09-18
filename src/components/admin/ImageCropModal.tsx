import { useState, useCallback, useEffect } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import {
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Check,
  X,
  Loader2,
  Eye,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { getCroppedImg } from "@/lib/cropImage";

interface ImageCropModalProps {
  open: boolean;
  imageSrc: string | null;
  cropShape?: "round" | "rect";
  aspectRatio?: number;
  title?: string;
  isProcessing?: boolean;
  onConfirm: (croppedFile: File) => Promise<void> | void;
  onClose: () => void;
}

export function ImageCropModal({
  open,
  imageSrc,
  cropShape = "round",
  aspectRatio,
  title = "Adjust & Crop Photo",
  isProcessing = false,
  onConfirm,
  onClose,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Reset controls when a new image source is loaded
  useEffect(() => {
    if (open) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setCroppedAreaPixels(null);
      setPreviewUrl(null);
      setShowPreview(false);
    }
  }, [open, imageSrc]);

  const onCropComplete = useCallback((_croppedArea: Area, currentCroppedAreaPixels: Area) => {
    setCroppedAreaPixels(currentCroppedAreaPixels);
  }, []);

  const handleRotateLeft = () => {
    setRotation((prev) => (prev - 90) % 360);
  };

  const handleRotateRight = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(3, Number((prev + 0.2).toFixed(2))));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(1, Number((prev - 0.2).toFixed(2))));
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setShowPreview(false);
    setPreviewUrl(null);
  };

  const handleTogglePreview = async () => {
    if (showPreview) {
      setShowPreview(false);
      return;
    }
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setGenerating(true);
      const file = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setShowPreview(true);
    } catch (err) {
      console.error("[ImageCropModal] Failed to generate preview:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setGenerating(true);
      const croppedFile = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation,
        `photo-${Date.now()}.jpg`,
      );
      await onConfirm(croppedFile);
    } catch (err) {
      console.error("[ImageCropModal] Error generating cropped image:", err);
    } finally {
      setGenerating(false);
    }
  };

  const isBusy = isProcessing || generating;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && !isBusy) {
          onClose();
        }
      }}
    >
      <DialogContent
        id="image-crop-modal"
        className="max-w-lg w-[calc(100vw-2rem)] p-5 sm:p-6 rounded-3xl border border-border bg-card shadow-2xl overflow-hidden max-h-[95vh] flex flex-col"
      >
        <DialogHeader className="text-left pb-2">
          <DialogTitle className="font-display text-xl font-bold text-foreground">
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Reposition, zoom, and rotate the photo before confirming and uploading.
          </DialogDescription>
        </DialogHeader>

        {/* Cropper or Preview Area */}
        <div className="relative w-full h-64 sm:h-72 bg-neutral-900 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center border border-border">
          {imageSrc && !showPreview && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspectRatio ?? (cropShape === "round" ? 1 : 4 / 3)}
              cropShape={cropShape}
              showGrid={true}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              minZoom={1}
              maxZoom={3}
              step={0.05}
            />
          )}

          {showPreview && previewUrl && (
            <div className="flex flex-col items-center justify-center p-4">
              <div
                className={`overflow-hidden border-2 border-primary shadow-lg ${
                  cropShape === "round"
                    ? "rounded-full w-44 h-44 sm:w-48 sm:h-48 aspect-square"
                    : "rounded-2xl max-w-xs max-h-52 object-contain"
                } bg-muted`}
              >
                <img src={previewUrl} alt="Final preview" className="w-full h-full object-cover" />
              </div>
              <span className="mt-3 text-xs text-neutral-300 font-medium">
                Final Result Preview
              </span>
            </div>
          )}

          {isBusy && (
            <div className="absolute inset-0 bg-background/70 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs font-semibold text-foreground">Processing image...</p>
            </div>
          )}
        </div>

        {/* Editing Controls */}
        <div className="space-y-4 pt-3 flex-1">
          {/* Zoom Slider & Controls */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium text-foreground">
              <span className="flex items-center gap-1 text-muted-foreground">
                <ZoomIn className="h-3.5 w-3.5" />
                Zoom
              </span>
              <span className="text-muted-foreground">{Math.round(zoom * 100)}%</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 rounded-lg shrink-0"
                onClick={handleZoomOut}
                disabled={zoom <= 1 || isBusy || showPreview}
                title="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.05}
                disabled={isBusy || showPreview}
                onValueChange={([val]) => setZoom(val)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 rounded-lg shrink-0"
                onClick={handleZoomIn}
                disabled={zoom >= 3 || isBusy || showPreview}
                title="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Rotate & Action Tools */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl text-xs gap-1.5 h-8 px-2.5"
                onClick={handleRotateLeft}
                disabled={isBusy || showPreview}
                title="Rotate Left 90°"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Rotate Left</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl text-xs gap-1.5 h-8 px-2.5"
                onClick={handleRotateRight}
                disabled={isBusy || showPreview}
                title="Rotate Right 90°"
              >
                <RotateCw className="h-3.5 w-3.5" />
                <span>Rotate Right</span>
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-xl text-xs gap-1.5 h-8 px-2.5 text-muted-foreground hover:text-foreground"
                onClick={handleReset}
                disabled={isBusy}
                title="Reset adjustments"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </Button>

              <Button
                type="button"
                variant={showPreview ? "secondary" : "outline"}
                size="sm"
                className="rounded-xl text-xs gap-1.5 h-8 px-2.5"
                onClick={handleTogglePreview}
                disabled={isBusy}
                title="Toggle cropped preview"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>{showPreview ? "Edit Mode" : "Preview"}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="pt-4 border-t border-border flex items-center justify-end gap-2.5 mt-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl text-xs sm:text-sm px-4 h-9"
            onClick={onClose}
            disabled={isBusy}
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Cancel
          </Button>

          <Button
            type="button"
            className="rounded-xl text-xs sm:text-sm px-5 h-9 gap-1.5 font-medium shadow-sm"
            onClick={handleConfirm}
            disabled={isBusy || !imageSrc}
          >
            {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Use This Image
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
