import { useEffect, useState, useRef, type TouchEvent } from "react";
import { X, ChevronLeft, ChevronRight, ImageOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface MediaItem {
  id?: string;
  url: string;
  caption?: string;
  type?: "image" | "video";
}

interface MediaViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  media: MediaItem[];
  initialIndex?: number;
}

export function MediaViewerModal({
  isOpen,
  onClose,
  title,
  subtitle,
  media,
  initialIndex = 0,
}: MediaViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [mediaLoading, setMediaLoading] = useState(true);
  const [mediaError, setMediaError] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.min(Math.max(0, initialIndex), Math.max(0, media.length - 1)));
      setMediaLoading(true);
      setMediaError(false);
      // Prevent body scrolling when open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, initialIndex, media.length]);

  // Reset loading and error when changing item index
  useEffect(() => {
    setMediaLoading(true);
    setMediaError(false);
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : media.length - 1));
      } else if (e.key === "ArrowRight") {
        setCurrentIndex((prev) => (prev < media.length - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, media.length, onClose]);

  if (!isOpen) return null;

  const hasMedia = media.length > 0;
  const currentItem = hasMedia ? media[currentIndex] : null;

  const goToPrev = () => {
    if (!hasMedia) return;
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : media.length - 1));
  };

  const goToNext = () => {
    if (!hasMedia) return;
    setCurrentIndex((prev) => (prev < media.length - 1 ? prev + 1 : 0));
  };

  // Touch swipe handling
  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Minimum swipe threshold 40px and more horizontal than vertical
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        goToPrev();
      } else {
        goToNext();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
    <div
      id="media-viewer-modal"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3 sm:p-6 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* If Event HAS NO MEDIA */}
      {!hasMedia ? (
        <div
          id="no-media-popup"
          className="relative w-full max-w-md rounded-3xl border border-white/10 bg-card p-8 text-card-foreground shadow-2xl text-center animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            id="close-no-media-btn"
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/50 text-muted-foreground">
            <ImageOff className="h-8 w-8" />
          </div>

          <h3 className="font-display text-2xl font-medium tracking-tight text-foreground">
            No media uploaded
          </h3>

          <p className="mt-2 text-sm text-muted-foreground">
            There are currently no photos or videos uploaded for{" "}
            <span className="font-semibold text-foreground">"{title}"</span>.
          </p>

          <div className="mt-6 flex justify-center">
            <Button
              id="close-no-media-action"
              variant="outline"
              className="rounded-full px-6"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      ) : (
        /* If Event HAS MEDIA */
        <div
          id="event-media-gallery-popup"
          className="relative flex h-full max-h-[92vh] w-full max-w-5xl flex-col justify-between"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between gap-4 px-2 py-2 text-white sm:px-4">
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-display text-lg sm:text-xl font-medium text-white drop-shadow">
                {title}
              </h3>
              {subtitle && <p className="truncate text-xs text-white/70 sm:text-sm">{subtitle}</p>}
            </div>

            <div className="flex items-center gap-3">
              <span
                id="media-counter-badge"
                className="rounded-full bg-white/15 px-3 py-1 font-mono text-xs sm:text-sm font-medium text-white shadow-sm backdrop-blur"
              >
                {currentIndex + 1} / {media.length}
              </span>

              <button
                id="media-gallery-close-btn"
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/25 focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Media Display Stage */}
          <div
            className="relative flex flex-1 items-center justify-center overflow-hidden px-2 py-2"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                onClose();
              }
            }}
          >
            {/* Desktop Previous Button */}
            <button
              id="desktop-prev-media-btn"
              type="button"
              aria-label="Previous"
              onClick={goToPrev}
              className="absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-black/60 p-3 text-white backdrop-blur transition hover:scale-105 hover:bg-black/80 focus:outline-none sm:flex items-center justify-center shadow-lg"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            {/* Current Media (Image or Video) */}
            <div className="relative flex min-h-[240px] max-h-[72vh] max-w-full items-center justify-center select-none">
              {/* Subtle loading spinner */}
              {mediaLoading && !mediaError && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-white/60" />
                </div>
              )}

              {/* Graceful error state if an image fails to load */}
              {mediaError ? (
                <div
                  id="media-error-placeholder"
                  className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/80 shadow-2xl backdrop-blur-md"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white/60">
                    <ImageOff className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="font-display text-base font-medium text-white">
                      Image Unavailable
                    </p>
                    <p className="mt-1 text-xs text-white/60">This image could not be loaded.</p>
                  </div>
                </div>
              ) : currentItem?.type === "video" ||
                currentItem?.url.match(/\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i) ? (
                <video
                  key={currentItem?.url}
                  src={currentItem?.url}
                  controls
                  autoPlay
                  playsInline
                  onLoadedData={() => setMediaLoading(false)}
                  onError={() => {
                    setMediaLoading(false);
                    setMediaError(true);
                  }}
                  className="max-h-[72vh] max-w-full rounded-2xl object-contain shadow-2xl"
                />
              ) : (
                <img
                  key={currentItem?.url}
                  src={currentItem?.url}
                  alt={currentItem?.caption || `${title} - photo ${currentIndex + 1}`}
                  onLoad={() => setMediaLoading(false)}
                  onError={(e) => {
                    console.warn("[MediaViewerModal] Failed to load image:", currentItem?.url, e);
                    setMediaLoading(false);
                    setMediaError(true);
                  }}
                  className={`max-h-[72vh] max-w-full rounded-2xl object-contain shadow-2xl transition-opacity duration-200 ${
                    mediaLoading ? "opacity-0" : "opacity-100"
                  }`}
                />
              )}
            </div>

            {/* Desktop Next Button */}
            <button
              id="desktop-next-media-btn"
              type="button"
              aria-label="Next"
              onClick={goToNext}
              className="absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-black/60 p-3 text-white backdrop-blur transition hover:scale-105 hover:bg-black/80 focus:outline-none sm:flex items-center justify-center shadow-lg"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          {/* Caption & Controls Footer */}
          <div className="flex flex-col items-center gap-3 px-2 py-3 text-white sm:px-4">
            {currentItem?.caption && currentItem.caption !== title && (
              <p className="max-w-xl text-center text-xs sm:text-sm text-white/80 line-clamp-2 px-4">
                {currentItem.caption}
              </p>
            )}

            {/* Mobile / Screen navigation bar */}
            <div className="flex w-full items-center justify-between sm:justify-center sm:gap-6 pt-1">
              <Button
                id="media-prev-btn"
                type="button"
                variant="outline"
                size="sm"
                onClick={goToPrev}
                className="rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white px-4 py-2 text-xs sm:text-sm gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </Button>

              <span className="sm:hidden font-mono text-xs text-white/70">
                {currentIndex + 1} / {media.length}
              </span>

              <Button
                id="media-next-btn"
                type="button"
                variant="outline"
                size="sm"
                onClick={goToNext}
                className="rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white px-4 py-2 text-xs sm:text-sm gap-1"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
