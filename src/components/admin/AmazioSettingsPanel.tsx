import { useState } from "react";
import {
  Sparkles,
  ExternalLink,
  Check,
  Loader2,
  Eye,
  Globe,
  Palette,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ImageFieldManager } from "@/components/admin/ImageFieldManager";
import { DEFAULT_AMAZIO, type ArtLiteratureSettings, type AmazioSettings } from "@/lib/cms";
import { AmazioHomeSection, formatExternalUrl } from "@/components/site/AmazioHomeSection";
import { toast } from "sonner";

interface AmazioSettingsPanelProps {
  artState: ArtLiteratureSettings;
  setArtState: React.Dispatch<React.SetStateAction<ArtLiteratureSettings>>;
  onSave: (override?: ArtLiteratureSettings) => Promise<void>;
  isSaving: boolean;
}

export function AmazioSettingsPanel({
  artState,
  setArtState,
  onSave,
  isSaving,
}: AmazioSettingsPanelProps) {
  const amazio: AmazioSettings = {
    ...DEFAULT_AMAZIO,
    ...(artState.amazio || {}),
  };

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  const updateAmazio = (patch: Partial<AmazioSettings>) => {
    const updatedAmazio: AmazioSettings = {
      ...amazio,
      ...patch,
    };
    const updatedArtState: ArtLiteratureSettings = {
      ...artState,
      amazio: updatedAmazio,
    };
    setArtState(updatedArtState);
    if (patch.url !== undefined) {
      setUrlError(null);
    }
  };

  const validateUrl = (url: string): boolean => {
    if (!url || !url.trim()) {
      return false;
    }
    const formatted = formatExternalUrl(url);
    try {
      const parsed = new URL(formatted);
      return Boolean(parsed.hostname);
    } catch {
      return false;
    }
  };

  const handleTestLink = () => {
    const rawUrl = amazio.url?.trim();
    if (!rawUrl) {
      toast.error("Please enter a website URL first.");
      setUrlError("Website URL cannot be empty");
      return;
    }

    if (!validateUrl(rawUrl)) {
      toast.error("Please enter a valid website URL (e.g. https://amazio.darusuffa.org).");
      setUrlError("Invalid URL format");
      return;
    }

    const formatted = formatExternalUrl(rawUrl);
    window.open(formatted, "_blank", "noopener,noreferrer");
    toast.success("Opening Amazio website link in new tab...");
  };

  const handleSaveWithValidation = async () => {
    const rawUrl = amazio.url?.trim();

    // If enabled, ensure URL is valid
    if (amazio.enabled) {
      if (!rawUrl) {
        setUrlError("Website URL is required when Amazio section is enabled");
        toast.error("Please provide the Amazio website URL before enabling the section.");
        return;
      }

      if (!validateUrl(rawUrl)) {
        setUrlError("Please enter a valid web address (e.g. https://amazio.darusuffa.org)");
        toast.error("Please enter a valid website URL.");
        return;
      }
    }

    // Standardize URL protocol if user entered a domain without protocol
    const standardizedUrl = rawUrl ? formatExternalUrl(rawUrl) : "";
    const updatedAmazio: AmazioSettings = {
      ...amazio,
      url: standardizedUrl,
    };

    const updatedArtState: ArtLiteratureSettings = {
      ...artState,
      amazio: updatedAmazio,
    };

    setArtState(updatedArtState);
    await onSave(updatedArtState);
  };

  return (
    <Panel className="p-6 border-2 border-primary/20 bg-gradient-to-b from-card via-card to-primary/[0.02]">
      {/* Header with Title & Action */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles size={13} />
            <span>Home Page Feature</span>
          </div>
          <h3 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
            <span>AMAZIO ARTS FEST</span>
            <span className="text-xs font-normal font-sans text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
              Separate Website Link
            </span>
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
            Configure the dedicated Amazio Arts &amp; Knowledge Fest section on the Darusuffa
            Academy Home page. Visitors will be directed to your separate Amazio website.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsPreviewOpen(true)}
            className="gap-1.5 rounded-xl border-border hover:bg-muted"
          >
            <Eye size={15} />
            <span>Preview on Home</span>
          </Button>

          <Button
            type="button"
            onClick={handleSaveWithValidation}
            disabled={isSaving}
            className="gap-2 rounded-xl bg-primary shadow-sm hover:opacity-95"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            <span>Save Amazio Settings</span>
          </Button>
        </div>
      </div>

      {/* Enable / Disable Banner & Toggle */}
      <div className="mt-6 rounded-2xl border border-border bg-muted/40 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Label
              htmlFor="amazio-enabled"
              className="text-sm font-bold text-foreground cursor-pointer"
            >
              Enable Amazio Section on Home Page
            </Label>
            {amazio.enabled ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={12} />
                Active on Home
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                Disabled / Hidden
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {amazio.enabled
              ? "The Amazio banner card will appear on the public Home page with the 'Visit Amazio' link."
              : "The Amazio section is currently hidden from the Home page. Your configured content & URL are preserved."}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Switch
            id="amazio-enabled"
            checked={amazio.enabled}
            onCheckedChange={(checked) => updateAmazio({ enabled: checked })}
          />
        </div>
      </div>

      {/* Main Settings Grid */}
      <div className="mt-6 grid gap-6 md:grid-cols-12">
        {/* Left Column: Text & Link Config (7 cols) */}
        <div className="space-y-4 md:col-span-7">
          {/* Eyebrow / Badge */}
          <div>
            <Label htmlFor="amazio-eyebrow" className="text-xs font-semibold text-foreground">
              Badge / Eyebrow Text
            </Label>
            <Input
              id="amazio-eyebrow"
              value={amazio.eyebrow || ""}
              onChange={(e) => updateAmazio({ eyebrow: e.target.value })}
              className="mt-1"
              placeholder="AMAZIO ARTS & KNOWLEDGE FEST"
            />
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="amazio-title" className="text-xs font-semibold text-foreground">
              Amazio Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="amazio-title"
              value={amazio.title || ""}
              onChange={(e) => updateAmazio({ title: e.target.value })}
              className="mt-1 font-display"
              placeholder="Amazio Arts & Knowledge Fest"
            />
          </div>

          {/* Short Description */}
          <div>
            <Label htmlFor="amazio-description" className="text-xs font-semibold text-foreground">
              Short Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="amazio-description"
              rows={3}
              value={amazio.description || ""}
              onChange={(e) => updateAmazio({ description: e.target.value })}
              className="mt-1 leading-relaxed"
              placeholder="Explore our annual celebration of arts, literature, knowledge and creativity."
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Brief summary describing the festival to visitors on the Home page.
            </p>
          </div>

          {/* Button Text & Open In New Tab */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="amazio-btn-text" className="text-xs font-semibold text-foreground">
                Button Text
              </Label>
              <Input
                id="amazio-btn-text"
                value={amazio.buttonText || ""}
                onChange={(e) => updateAmazio({ buttonText: e.target.value })}
                className="mt-1 font-display"
                placeholder="Visit Amazio"
              />
            </div>

            <div className="flex flex-col justify-end">
              <div className="rounded-xl border border-border bg-muted/30 p-2.5 flex items-center justify-between">
                <div>
                  <Label
                    htmlFor="amazio-new-tab"
                    className="text-xs font-medium text-foreground cursor-pointer"
                  >
                    Open in New Tab
                  </Label>
                  <p className="text-[10px] text-muted-foreground">Recommended for external site</p>
                </div>
                <Switch
                  id="amazio-new-tab"
                  checked={amazio.openInNewTab !== false}
                  onCheckedChange={(checked) => updateAmazio({ openInNewTab: checked })}
                />
              </div>
            </div>
          </div>

          {/* Amazio Website URL with Test Link Button */}
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="amazio-url" className="text-xs font-semibold text-foreground">
                Amazio Website URL <span className="text-destructive">*</span>
              </Label>
              <button
                type="button"
                onClick={handleTestLink}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <ExternalLink size={12} />
                <span>Test Link</span>
              </button>
            </div>

            <div className="relative mt-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                <Globe size={16} />
              </div>
              <Input
                id="amazio-url"
                type="url"
                value={amazio.url || ""}
                onChange={(e) => updateAmazio({ url: e.target.value })}
                className={`pl-9 pr-24 font-mono text-xs sm:text-sm ${
                  urlError ? "border-destructive bg-destructive/5" : ""
                }`}
                placeholder="https://amazio.darusuffa.org"
              />
              <div className="absolute inset-y-0 right-1 flex items-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleTestLink}
                  className="h-7 px-2.5 text-xs text-primary hover:bg-primary/10"
                >
                  Visit Link
                </Button>
              </div>
            </div>

            {urlError ? (
              <p className="mt-1 text-xs text-destructive flex items-center gap-1">
                <AlertCircle size={13} />
                <span>{urlError}</span>
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Enter the full web address of your separate Amazio website (e.g.{" "}
                <span className="font-mono text-foreground font-medium">
                  https://amazio.darusuffa.org
                </span>
                ).
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Promotional Image / Banner (5 cols) */}
        <div className="space-y-4 md:col-span-5">
          <ImageFieldManager
            label="Amazio Promotional Poster / Thumbnail (Optional)"
            description="Upload an attractive banner or festival poster to showcase beside the Amazio card. If left empty, a clean Darusuffa decorative fallback is used."
            currentImageUrl={amazio.imageUrl}
            storageFolder="art-literature"
            aspectRatio={16 / 10}
            modalTitle="Crop Amazio Poster / Thumbnail"
            onSave={async (url) => {
              updateAmazio({ imageUrl: url });
            }}
          />

          <div className="rounded-2xl border border-border/80 bg-background/60 p-4 space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <Palette size={14} className="text-primary" />
              <span>Independent Website Connection</span>
            </div>
            <p className="leading-relaxed">
              The Amazio website remains completely separate. When visitors click{" "}
              <strong>"{amazio.buttonText || "Visit Amazio"}"</strong> on the Home page, the
              configured URL is opened safely in a new browser window.
            </p>
          </div>
        </div>
      </div>

      {/* Home Page Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-3xl border-border">
          <DialogHeader className="p-6 border-b border-border bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="font-display text-lg">
                  Home Page Section Live Preview
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  This preview reflects how the Amazio Arts Fest section will render to visitors on
                  the Darusuffa Academy Home page.
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                {amazio.enabled ? (
                  <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-600">
                    Status: Enabled
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-600">
                    Status: Disabled (Hidden)
                  </span>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="p-4 sm:p-6 bg-background max-h-[70vh] overflow-y-auto">
            <AmazioHomeSection settings={amazio} isPreview={true} />
          </div>
        </DialogContent>
      </Dialog>
    </Panel>
  );
}
