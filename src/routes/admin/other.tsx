import { useState, useRef, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Palette,
  Globe,
  BookOpen,
  Calendar,
  Layers,
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Upload,
  FileText,
  Check,
  X,
  Loader2,
  Images,
  Eye,
  RefreshCw,
  Sparkles,
  ArrowRight,
  FolderPlus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeading, Panel, EmptyState } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ImageFieldManager } from "@/components/admin/ImageFieldManager";
import { ImageCropModal } from "@/components/admin/ImageCropModal";
import { ConfirmDeleteDialog } from "@/components/admin/ConfirmDeleteDialog";
import {
  uploadMedia,
  deleteStoredMedia,
  DEFAULT_ART_LITERATURE,
  DEFAULT_LANGUAGE_DOOR,
  DEFAULT_MAGAZINES,
  DEFAULT_SSF_DAWA_SETTINGS,
  DEFAULT_SSF_DAWA_EVENTS,
  type ArtLiteratureSettings,
  type ArtLiteratureCard,
  type LanguageDoorSettings,
  type LanguageDoorCard,
  type MagazineItem,
  type SsfDawaSettings,
  type SsfDawaEvent,
  type SsfDawaMediaItem,
} from "@/lib/cms";

export const Route = createFileRoute("/admin/other")({
  component: AdminOtherPage,
});

type TabType = "overview" | "art-literature" | "language-door" | "magazine" | "ssf-dawa";

function AdminOtherPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // Sync tab with URL search parameter if present
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as TabType;
      if (
        tabParam === "overview" ||
        tabParam === "art-literature" ||
        tabParam === "language-door" ||
        tabParam === "magazine" ||
        tabParam === "ssf-dawa"
      ) {
        setActiveTab(tabParam);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleTabChange = (val: string) => {
    const tab = val as TabType;
    setActiveTab(tab);
    try {
      const url = new URL(window.location.href);
      if (tab === "overview") {
        url.searchParams.delete("tab");
      } else {
        url.searchParams.set("tab", tab);
      }
      window.history.replaceState({}, "", url.toString());
    } catch {
      // ignore
    }
  };

  // --------------------------------------------------------------------------
  // 1. ART & LITERATURE DATA & STATE
  // --------------------------------------------------------------------------
  const { data: artData } = useQuery({
    queryKey: ["settings", "art_literature"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "art_literature")
        .maybeSingle();
      if (!data?.value) return DEFAULT_ART_LITERATURE;
      const parsed = data.value as unknown as ArtLiteratureSettings;
      return {
        ...DEFAULT_ART_LITERATURE,
        ...parsed,
        cards: Array.isArray(parsed?.cards) ? parsed.cards : DEFAULT_ART_LITERATURE.cards,
      };
    },
  });

  const [artState, setArtState] = useState<ArtLiteratureSettings>(DEFAULT_ART_LITERATURE);
  const [isSavingArt, setIsSavingArt] = useState(false);
  const [editingArtCard, setEditingArtCard] = useState<ArtLiteratureCard | null>(null);
  const [isArtCardModalOpen, setIsArtCardModalOpen] = useState(false);

  useEffect(() => {
    if (artData) setArtState(artData);
  }, [artData]);

  const handleSaveArtSettings = async (override?: ArtLiteratureSettings) => {
    setIsSavingArt(true);
    const toSave = override || artState;
    try {
      const { error } = await supabase.from("site_settings").upsert(
        {
          key: "art_literature",
          value: toSave,
        },
        { onConflict: "key" },
      );
      if (error) throw error;
      toast.success("Art and Literature settings saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["settings", "art_literature"] });
    } catch (err: unknown) {
      toast.error(
        "Failed to save Art & Literature: " +
          (err instanceof Error ? err.message : "Unknown error"),
      );
    } finally {
      setIsSavingArt(false);
    }
  };

  // --------------------------------------------------------------------------
  // 2. LANGUAGE DOOR DATA & STATE
  // --------------------------------------------------------------------------
  const { data: langData } = useQuery({
    queryKey: ["settings", "language_door"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "language_door")
        .maybeSingle();
      if (!data?.value) return DEFAULT_LANGUAGE_DOOR;
      const parsed = data.value as unknown as LanguageDoorSettings;
      return {
        ...DEFAULT_LANGUAGE_DOOR,
        ...parsed,
        languages: Array.isArray(parsed?.languages)
          ? parsed.languages
          : DEFAULT_LANGUAGE_DOOR.languages,
      };
    },
  });

  const [langState, setLangState] = useState<LanguageDoorSettings>(DEFAULT_LANGUAGE_DOOR);
  const [isSavingLang, setIsSavingLang] = useState(false);
  const [editingLangCard, setEditingLangCard] = useState<LanguageDoorCard | null>(null);
  const [isLangCardModalOpen, setIsLangCardModalOpen] = useState(false);

  useEffect(() => {
    if (langData) setLangState(langData);
  }, [langData]);

  const handleSaveLangSettings = async (override?: LanguageDoorSettings) => {
    setIsSavingLang(true);
    const toSave = override || langState;
    try {
      const { error } = await supabase.from("site_settings").upsert(
        {
          key: "language_door",
          value: toSave,
        },
        { onConflict: "key" },
      );
      if (error) throw error;
      toast.success("Language Door settings saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["settings", "language_door"] });
    } catch (err: unknown) {
      toast.error(
        "Failed to save Language Door: " + (err instanceof Error ? err.message : "Unknown error"),
      );
    } finally {
      setIsSavingLang(false);
    }
  };

  // --------------------------------------------------------------------------
  // 3. MAGAZINES DATA & STATE
  // --------------------------------------------------------------------------
  const { data: magData } = useQuery({
    queryKey: ["settings", "magazines"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "magazines")
        .maybeSingle();
      if (!data?.value || !Array.isArray(data.value)) return DEFAULT_MAGAZINES;
      return (data.value as MagazineItem[]).sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
      );
    },
  });

  const [magList, setMagList] = useState<MagazineItem[]>(DEFAULT_MAGAZINES);
  const [isSavingMags, setIsSavingMags] = useState(false);
  const [editingMagazine, setEditingMagazine] = useState<MagazineItem | null>(null);
  const [isMagModalOpen, setIsMagModalOpen] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Magazine delete confirmation
  const [deleteTargetMag, setDeleteTargetMag] = useState<MagazineItem | null>(null);

  useEffect(() => {
    if (magData) setMagList(magData);
  }, [magData]);

  const persistMagazines = async (updated: MagazineItem[]) => {
    setIsSavingMags(true);
    const sorted = updated.map((m, idx) => ({ ...m, sort_order: idx + 1 }));
    setMagList(sorted);
    try {
      const { error } = await supabase.from("site_settings").upsert(
        {
          key: "magazines",
          value: sorted,
        },
        { onConflict: "key" },
      );
      if (error) throw error;
      toast.success("Magazines updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["settings", "magazines"] });
    } catch (err: unknown) {
      toast.error(
        "Failed to save magazines: " + (err instanceof Error ? err.message : "Unknown error"),
      );
    } finally {
      setIsSavingMags(false);
    }
  };

  const handleSaveMagazineForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMagazine) return;

    if (!editingMagazine.title.trim()) {
      toast.error("Please provide a title for the magazine.");
      return;
    }

    if (editingMagazine.source_type === "link") {
      if (!editingMagazine.external_url || !editingMagazine.external_url.trim()) {
        toast.error("Please enter a valid link for the magazine.");
        return;
      }
      try {
        new URL(editingMagazine.external_url.trim());
      } catch {
        toast.error("Please enter a valid URL (including https://).");
        return;
      }
    } else if (editingMagazine.source_type === "pdf") {
      if (!editingMagazine.pdf_url) {
        toast.error("Please upload a PDF file for this magazine or switch to External Link.");
        return;
      }
    }

    const isNew = !magList.some((m) => m.id === editingMagazine.id);
    let updated: MagazineItem[];
    if (isNew) {
      updated = [editingMagazine, ...magList];
    } else {
      updated = magList.map((m) => (m.id === editingMagazine.id ? editingMagazine : m));
    }

    await persistMagazines(updated);
    setIsMagModalOpen(false);
    setEditingMagazine(null);
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingMagazine) return;

    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      toast.error("Please select a valid PDF file.");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error("PDF file size must be under 50MB.");
      return;
    }

    setIsUploadingPdf(true);
    try {
      // If there's an existing PDF, clean it up optionally
      if (editingMagazine.pdf_url) {
        await deleteStoredMedia(editingMagazine.pdf_url).catch(() => {});
      }

      const uploadedUrl = await uploadMedia(file, "magazines");
      setEditingMagazine({
        ...editingMagazine,
        pdf_url: uploadedUrl,
        pdf_filename: file.name,
      });
      toast.success(`Uploaded "${file.name}" successfully!`);
    } catch (err: unknown) {
      toast.error(
        "Failed to upload PDF: " + (err instanceof Error ? err.message : "Unknown error"),
      );
    } finally {
      setIsUploadingPdf(false);
      e.target.value = "";
    }
  };

  // --------------------------------------------------------------------------
  // 4. SSF DA'WA DATA & STATE
  // --------------------------------------------------------------------------
  const { data: ssfSettingsData } = useQuery({
    queryKey: ["settings", "ssf_dawa_settings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "ssf_dawa_settings")
        .maybeSingle();
      if (!data?.value) return DEFAULT_SSF_DAWA_SETTINGS;
      return {
        ...DEFAULT_SSF_DAWA_SETTINGS,
        ...(data.value as SsfDawaSettings),
      };
    },
  });

  const { data: ssfEventsData } = useQuery({
    queryKey: ["settings", "ssf_dawa_events"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "ssf_dawa_events")
        .maybeSingle();
      if (!data?.value || !Array.isArray(data.value)) return DEFAULT_SSF_DAWA_EVENTS;
      return (data.value as SsfDawaEvent[]).sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
      );
    },
  });

  const [ssfSettings, setSsfSettings] = useState<SsfDawaSettings>(DEFAULT_SSF_DAWA_SETTINGS);
  const [isSavingSsfSettings, setIsSavingSsfSettings] = useState(false);

  const [ssfEvents, setSsfEvents] = useState<SsfDawaEvent[]>(DEFAULT_SSF_DAWA_EVENTS);
  const [isSavingSsfEvents, setIsSavingSsfEvents] = useState(false);
  const [editingSsfEvent, setEditingSsfEvent] = useState<SsfDawaEvent | null>(null);
  const [isSsfEventModalOpen, setIsSsfEventModalOpen] = useState(false);
  const [deleteTargetEvent, setDeleteTargetEvent] = useState<SsfDawaEvent | null>(null);

  // SSF Da'wa image crop & upload queue
  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const [cropQueue, setCropQueue] = useState<{ file: File; dataUrl: string }[]>([]);
  const [currentCropItem, setCurrentCropItem] = useState<{ file: File; dataUrl: string } | null>(
    null,
  );
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [isUploadingCroppedImage, setIsUploadingCroppedImage] = useState(false);
  // If replacing an existing image
  const [replacingImageId, setReplacingImageId] = useState<string | null>(null);

  useEffect(() => {
    if (ssfSettingsData) setSsfSettings(ssfSettingsData);
  }, [ssfSettingsData]);

  useEffect(() => {
    if (ssfEventsData) setSsfEvents(ssfEventsData);
  }, [ssfEventsData]);

  const handleSaveSsfSettings = async (override?: SsfDawaSettings) => {
    setIsSavingSsfSettings(true);
    const toSave = override || ssfSettings;
    try {
      const { error } = await supabase.from("site_settings").upsert(
        {
          key: "ssf_dawa_settings",
          value: toSave,
        },
        { onConflict: "key" },
      );
      if (error) throw error;
      toast.success("SSF Da'wa page settings saved successfully!");
      queryClient.invalidateQueries({
        queryKey: ["settings", "ssf_dawa_settings"],
      });
    } catch (err: unknown) {
      toast.error(
        "Failed to save SSF Da'wa settings: " +
          (err instanceof Error ? err.message : "Unknown error"),
      );
    } finally {
      setIsSavingSsfSettings(false);
    }
  };

  const persistSsfEvents = async (updated: SsfDawaEvent[]) => {
    setIsSavingSsfEvents(true);
    const sorted = updated.map((e, idx) => ({ ...e, sort_order: idx + 1 }));
    setSsfEvents(sorted);
    try {
      const { error } = await supabase.from("site_settings").upsert(
        {
          key: "ssf_dawa_events",
          value: sorted,
        },
        { onConflict: "key" },
      );
      if (error) throw error;
      toast.success("SSF Da'wa events updated successfully!");
      queryClient.invalidateQueries({
        queryKey: ["settings", "ssf_dawa_events"],
      });
    } catch (err: unknown) {
      toast.error(
        "Failed to save SSF Da'wa events: " +
          (err instanceof Error ? err.message : "Unknown error"),
      );
    } finally {
      setIsSavingSsfEvents(false);
    }
  };

  const handleSaveSsfEventForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSsfEvent) return;

    if (!editingSsfEvent.event_name.trim()) {
      toast.error("Please enter an event name.");
      return;
    }

    const isNew = !ssfEvents.some((ev) => ev.id === editingSsfEvent.id);
    let updated: SsfDawaEvent[];
    if (isNew) {
      updated = [editingSsfEvent, ...ssfEvents];
    } else {
      updated = ssfEvents.map((ev) => (ev.id === editingSsfEvent.id ? editingSsfEvent : ev));
    }

    await persistSsfEvents(updated);
    setIsSsfEventModalOpen(false);
    setEditingSsfEvent(null);
  };

  // Image files selected for event
  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter((f) => f.type.startsWith("image/"));
    if (validFiles.length === 0) {
      toast.error("Please select valid image files.");
      return;
    }

    const queue: { file: File; dataUrl: string }[] = [];
    let loaded = 0;

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        queue.push({ file, dataUrl: reader.result as string });
        loaded++;
        if (loaded === validFiles.length) {
          setCropQueue(queue.slice(1));
          setCurrentCropItem(queue[0]);
          setIsCropModalOpen(true);
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
  };

  // Handling single cropped image confirmation
  const handleConfirmCroppedImage = async (croppedFile: File) => {
    if (!editingSsfEvent) return;
    setIsUploadingCroppedImage(true);

    try {
      const uploadedUrl = await uploadMedia(croppedFile, "ssf-dawa");

      if (replacingImageId) {
        // Replace existing image in event
        const updatedImages = editingSsfEvent.images.map((img) =>
          img.id === replacingImageId ? { ...img, image_url: uploadedUrl } : img,
        );
        setEditingSsfEvent({ ...editingSsfEvent, images: updatedImages });
        setReplacingImageId(null);
        toast.success("Image replaced successfully!");
      } else {
        // Add new image to event
        const newMediaItem: SsfDawaMediaItem = {
          id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          image_url: uploadedUrl,
          caption: "",
          sort_order: editingSsfEvent.images.length + 1,
        };
        setEditingSsfEvent({
          ...editingSsfEvent,
          images: [...editingSsfEvent.images, newMediaItem],
        });
        toast.success("Image confirmed and added!");
      }

      // If more images exist in queue, proceed to next
      if (cropQueue.length > 0) {
        const next = cropQueue[0];
        setCropQueue(cropQueue.slice(1));
        setCurrentCropItem(next);
      } else {
        setIsCropModalOpen(false);
        setCurrentCropItem(null);
      }
    } catch (err: unknown) {
      toast.error(
        "Failed to upload image: " + (err instanceof Error ? err.message : "Unknown error"),
      );
    } finally {
      setIsUploadingCroppedImage(false);
    }
  };

  const handleCloseCropModal = () => {
    // If canceled, skip current and proceed or finish
    setReplacingImageId(null);
    if (cropQueue.length > 0) {
      const next = cropQueue[0];
      setCropQueue(cropQueue.slice(1));
      setCurrentCropItem(next);
    } else {
      setIsCropModalOpen(false);
      setCurrentCropItem(null);
    }
  };

  return (
    <>
      <PageHeading
        title="Other Sections"
        description="Manage Art & Literature, Language Door, Magazines & Publications, and SSF Da'wa events."
      />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="h-11 w-full justify-start overflow-x-auto rounded-xl border border-border bg-card p-1 sm:w-auto">
          <TabsTrigger value="overview" className="gap-2 px-4 text-xs sm:text-sm">
            <Layers size={16} />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="art-literature" className="gap-2 px-4 text-xs sm:text-sm">
            <Palette size={16} />
            <span>Art & Literature</span>
          </TabsTrigger>
          <TabsTrigger value="language-door" className="gap-2 px-4 text-xs sm:text-sm">
            <Globe size={16} />
            <span>Language Door</span>
          </TabsTrigger>
          <TabsTrigger value="magazine" className="gap-2 px-4 text-xs sm:text-sm">
            <BookOpen size={16} />
            <span>Magazine</span>
          </TabsTrigger>
          <TabsTrigger value="ssf-dawa" className="gap-2 px-4 text-xs sm:text-sm">
            <Calendar size={16} />
            <span>SSF Da'wa</span>
          </TabsTrigger>
        </TabsList>

        {/* ================================================================= */}
        {/* OVERVIEW TAB */}
        {/* ================================================================= */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Card 1: Art and Literature */}
            <Panel className="flex flex-col justify-between p-6">
              <div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Palette size={24} />
                </div>
                <h3 className="font-display text-xl text-foreground">Art and Literature</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Manage page introduction, featured photo, and key creative strands such as Amazio
                  fest, calligraphy, and oratory stages.
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-md bg-muted px-2 py-1 font-medium">
                    {artState.cards?.length || 0} Strands Listed
                  </span>
                  {artState.imageUrl && (
                    <span className="rounded-md bg-primary/10 px-2 py-1 font-medium text-primary">
                      Custom Photo
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => handleTabChange("art-literature")}
                  className="gap-2 rounded-xl"
                >
                  <span>Manage Content</span>
                  <ArrowRight size={14} />
                </Button>
                <Link
                  to="/art-literature"
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <span>View Public Page</span>
                  <ExternalLink size={13} />
                </Link>
              </div>
            </Panel>

            {/* Card 2: Language Door */}
            <Panel className="flex flex-col justify-between p-6">
              <div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Globe size={24} />
                </div>
                <h3 className="font-display text-xl text-foreground">Language Door</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Configure language programmes, classical & modern tongues (Arabic, English, Urdu,
                  Malayalam), descriptions, and wing banner photos.
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-md bg-muted px-2 py-1 font-medium">
                    {langState.languages?.length || 0} Language Wings
                  </span>
                  {langState.imageUrl && (
                    <span className="rounded-md bg-primary/10 px-2 py-1 font-medium text-primary">
                      Custom Photo
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => handleTabChange("language-door")}
                  className="gap-2 rounded-xl"
                >
                  <span>Manage Content</span>
                  <ArrowRight size={14} />
                </Button>
                <Link
                  to="/language-door"
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <span>View Public Page</span>
                  <ExternalLink size={13} />
                </Link>
              </div>
            </Panel>

            {/* Card 3: Magazine */}
            <Panel className="flex flex-col justify-between p-6">
              <div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <BookOpen size={24} />
                </div>
                <h3 className="font-display text-xl text-foreground">Magazine</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Upload PDF magazine issues or configure external publication links, covers,
                  edition dates, and publication status.
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-md bg-muted px-2 py-1 font-medium">
                    {magList.length} Magazines
                  </span>
                  <span className="rounded-md bg-emerald-500/10 px-2 py-1 font-medium text-emerald-600">
                    {magList.filter((m) => m.published).length} Published
                  </span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => handleTabChange("magazine")}
                  className="gap-2 rounded-xl"
                >
                  <span>Manage Magazines</span>
                  <ArrowRight size={14} />
                </Button>
                <Link
                  to="/magazine"
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <span>View Public Page</span>
                  <ExternalLink size={13} />
                </Link>
              </div>
            </Panel>

            {/* Card 4: SSF Da'wa */}
            <Panel className="flex flex-col justify-between p-6">
              <div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Calendar size={24} />
                </div>
                <h3 className="font-display text-xl text-foreground">SSF Da'wa</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Manage campus dawah events, study circles, service drives, multi-image galleries,
                  dates, descriptions, and page quote.
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-md bg-muted px-2 py-1 font-medium">
                    {ssfEvents.length} Events
                  </span>
                  <span className="rounded-md bg-emerald-500/10 px-2 py-1 font-medium text-emerald-600">
                    {ssfEvents.filter((e) => e.published).length} Published
                  </span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => handleTabChange("ssf-dawa")}
                  className="gap-2 rounded-xl"
                >
                  <span>Manage Events</span>
                  <ArrowRight size={14} />
                </Button>
                <Link
                  to="/ssf-dawa"
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <span>View Public Page</span>
                  <ExternalLink size={13} />
                </Link>
              </div>
            </Panel>
          </div>
        </TabsContent>

        {/* ================================================================= */}
        {/* ART AND LITERATURE TAB */}
        {/* ================================================================= */}
        <TabsContent value="art-literature" className="space-y-6">
          <Panel className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <h3 className="font-display text-lg text-foreground">Art and Literature Page</h3>
                <p className="text-xs text-muted-foreground">
                  Configure titles, descriptive paragraphs, and featured imagery for the public
                  page.
                </p>
              </div>
              <Button
                type="button"
                onClick={() => handleSaveArtSettings()}
                disabled={isSavingArt}
                className="gap-2 rounded-xl"
              >
                {isSavingArt ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                <span>Save All Changes</span>
              </Button>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="art-eyebrow" className="text-xs font-semibold">
                    Eyebrow Tag
                  </Label>
                  <Input
                    id="art-eyebrow"
                    value={artState.eyebrow || ""}
                    onChange={(e) => setArtState({ ...artState, eyebrow: e.target.value })}
                    className="mt-1"
                    placeholder="Academic wing"
                  />
                </div>

                <div>
                  <Label htmlFor="art-title" className="text-xs font-semibold">
                    Main Title
                  </Label>
                  <Input
                    id="art-title"
                    value={artState.title || ""}
                    onChange={(e) => setArtState({ ...artState, title: e.target.value })}
                    className="mt-1"
                    placeholder="Art and Literature"
                  />
                </div>

                <div>
                  <Label htmlFor="art-intro" className="text-xs font-semibold">
                    Introductory Subtitle
                  </Label>
                  <Textarea
                    id="art-intro"
                    rows={2}
                    value={artState.intro || ""}
                    onChange={(e) => setArtState({ ...artState, intro: e.target.value })}
                    className="mt-1"
                    placeholder="Creativity as an extension of scholarship..."
                  />
                </div>

                <div>
                  <Label htmlFor="art-body" className="text-xs font-semibold">
                    Body Paragraph / Description
                  </Label>
                  <Textarea
                    id="art-body"
                    rows={3}
                    value={artState.bodyContent || ""}
                    onChange={(e) => setArtState({ ...artState, bodyContent: e.target.value })}
                    className="mt-1"
                    placeholder="Art and literature at Darusuffa Academy — Amazio arts fest..."
                  />
                </div>
              </div>

              {/* Page Image Manager */}
              <div>
                <ImageFieldManager
                  label="Featured Page Photo"
                  description="Upload a high-resolution photo of campus festivals, exhibitions, or student artwork."
                  currentImageUrl={artState.imageUrl}
                  storageFolder="art-literature"
                  aspectRatio={16 / 9}
                  modalTitle="Crop Art & Literature Photo"
                  onSave={async (url) => {
                    const updated = { ...artState, imageUrl: url };
                    setArtState(updated);
                    await handleSaveArtSettings(updated);
                  }}
                />
              </div>
            </div>
          </Panel>

          {/* Strands & Programs Section */}
          <Panel className="p-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h4 className="font-display text-base text-foreground">
                  Literary Strands & Programs
                </h4>
                <p className="text-xs text-muted-foreground">
                  Cards displayed on the public Art and Literature page.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setEditingArtCard({
                    id: `strand-${Date.now()}`,
                    title: "",
                    body: "",
                  });
                  setIsArtCardModalOpen(true);
                }}
                className="gap-2 rounded-xl"
              >
                <Plus size={15} />
                <span>Add Strand</span>
              </Button>
            </div>

            <div className="mt-6 space-y-3">
              {(artState.cards || []).map((card, idx) => (
                <div
                  key={card.id || idx}
                  className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card/60 p-4 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-display text-sm font-medium text-foreground">
                        {card.title}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{card.body}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={idx === 0}
                      onClick={() => {
                        const newCards = [...artState.cards];
                        [newCards[idx - 1], newCards[idx]] = [newCards[idx], newCards[idx - 1]];
                        const updated = { ...artState, cards: newCards };
                        setArtState(updated);
                        handleSaveArtSettings(updated);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <ArrowUp size={14} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={idx === artState.cards.length - 1}
                      onClick={() => {
                        const newCards = [...artState.cards];
                        [newCards[idx + 1], newCards[idx]] = [newCards[idx], newCards[idx + 1]];
                        const updated = { ...artState, cards: newCards };
                        setArtState(updated);
                        handleSaveArtSettings(updated);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <ArrowDown size={14} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingArtCard(card);
                        setIsArtCardModalOpen(true);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 size={14} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newCards = artState.cards.filter((c) => c.id !== card.id);
                        const updated = { ...artState, cards: newCards };
                        setArtState(updated);
                        handleSaveArtSettings(updated);
                        toast.success(`Removed "${card.title}"`);
                      }}
                      className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}

              {(!artState.cards || artState.cards.length === 0) && (
                <EmptyState
                  title="No strands created"
                  description="Add literary and creative strands for your students."
                />
              )}
            </div>
          </Panel>

          {/* Add/Edit Strand Modal */}
          {editingArtCard && (
            <Dialog open={isArtCardModalOpen} onOpenChange={setIsArtCardModalOpen}>
              <DialogContent className="max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="font-display text-lg">
                    {artState.cards?.some((c) => c.id === editingArtCard.id)
                      ? "Edit Strand"
                      : "Add New Strand"}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Provide the title and description for this literary focus.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                  <div>
                    <Label htmlFor="strand-title" className="text-xs font-semibold">
                      Strand Title
                    </Label>
                    <Input
                      id="strand-title"
                      value={editingArtCard.title}
                      onChange={(e) =>
                        setEditingArtCard({ ...editingArtCard, title: e.target.value })
                      }
                      className="mt-1"
                      placeholder="e.g. Amazio Arts Fest"
                    />
                  </div>

                  <div>
                    <Label htmlFor="strand-body" className="text-xs font-semibold">
                      Description / Body
                    </Label>
                    <Textarea
                      id="strand-body"
                      rows={4}
                      value={editingArtCard.body}
                      onChange={(e) =>
                        setEditingArtCard({ ...editingArtCard, body: e.target.value })
                      }
                      className="mt-1"
                      placeholder="Describe this activity or strand..."
                    />
                  </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsArtCardModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      if (!editingArtCard.title.trim()) {
                        toast.error("Please provide a strand title.");
                        return;
                      }
                      const isNew = !artState.cards.some((c) => c.id === editingArtCard.id);
                      let newCards: ArtLiteratureCard[];
                      if (isNew) {
                        newCards = [...artState.cards, editingArtCard];
                      } else {
                        newCards = artState.cards.map((c) =>
                          c.id === editingArtCard.id ? editingArtCard : c,
                        );
                      }
                      const updated = { ...artState, cards: newCards };
                      setArtState(updated);
                      handleSaveArtSettings(updated);
                      setIsArtCardModalOpen(false);
                      setEditingArtCard(null);
                    }}
                  >
                    Save Strand
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </TabsContent>

        {/* ================================================================= */}
        {/* LANGUAGE DOOR TAB */}
        {/* ================================================================= */}
        <TabsContent value="language-door" className="space-y-6">
          <Panel className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <h3 className="font-display text-lg text-foreground">Language Door Page</h3>
                <p className="text-xs text-muted-foreground">
                  Configure language programmes, classical & modern tongues, and header graphics.
                </p>
              </div>
              <Button
                type="button"
                onClick={() => handleSaveLangSettings()}
                disabled={isSavingLang}
                className="gap-2 rounded-xl"
              >
                {isSavingLang ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                <span>Save All Changes</span>
              </Button>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="lang-eyebrow" className="text-xs font-semibold">
                    Eyebrow Tag
                  </Label>
                  <Input
                    id="lang-eyebrow"
                    value={langState.eyebrow || ""}
                    onChange={(e) => setLangState({ ...langState, eyebrow: e.target.value })}
                    className="mt-1"
                    placeholder="Academic wing"
                  />
                </div>

                <div>
                  <Label htmlFor="lang-title" className="text-xs font-semibold">
                    Main Title
                  </Label>
                  <Input
                    id="lang-title"
                    value={langState.title || ""}
                    onChange={(e) => setLangState({ ...langState, title: e.target.value })}
                    className="mt-1"
                    placeholder="Language Door"
                  />
                </div>

                <div>
                  <Label htmlFor="lang-intro" className="text-xs font-semibold">
                    Introductory Subtitle
                  </Label>
                  <Textarea
                    id="lang-intro"
                    rows={2}
                    value={langState.intro || ""}
                    onChange={(e) => setLangState({ ...langState, intro: e.target.value })}
                    className="mt-1"
                    placeholder="A dedicated wing that opens the doors of language..."
                  />
                </div>

                <div>
                  <Label htmlFor="lang-body" className="text-xs font-semibold">
                    Body Paragraph / Description
                  </Label>
                  <Textarea
                    id="lang-body"
                    rows={3}
                    value={langState.bodyContent || ""}
                    onChange={(e) => setLangState({ ...langState, bodyContent: e.target.value })}
                    className="mt-1"
                    placeholder="Language Door at Darusuffa Academy builds fluency..."
                  />
                </div>
              </div>

              {/* Page Image Manager */}
              <div>
                <ImageFieldManager
                  label="Featured Session Photo"
                  description="Upload a photo of students engaged in language practice, spoken circles, or camps."
                  currentImageUrl={langState.imageUrl}
                  storageFolder="language-door"
                  aspectRatio={4 / 3}
                  modalTitle="Crop Language Door Photo"
                  onSave={async (url) => {
                    const updated = { ...langState, imageUrl: url };
                    setLangState(updated);
                    await handleSaveLangSettings(updated);
                  }}
                />
              </div>
            </div>
          </Panel>

          {/* Languages List */}
          <Panel className="p-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h4 className="font-display text-base text-foreground">Language Wings</h4>
                <p className="text-xs text-muted-foreground">
                  Language wings and training circles listed on the page.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setEditingLangCard({
                    id: `lang-${Date.now()}`,
                    name: "",
                    note: "",
                  });
                  setIsLangCardModalOpen(true);
                }}
                className="gap-2 rounded-xl"
              >
                <Plus size={15} />
                <span>Add Language</span>
              </Button>
            </div>

            <div className="mt-6 space-y-3">
              {(langState.languages || []).map((l, idx) => (
                <div
                  key={l.id || idx}
                  className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card/60 p-4 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-display text-sm font-medium text-foreground">
                        {l.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{l.note}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={idx === 0}
                      onClick={() => {
                        const newLangs = [...langState.languages];
                        [newLangs[idx - 1], newLangs[idx]] = [newLangs[idx], newLangs[idx - 1]];
                        const updated = { ...langState, languages: newLangs };
                        setLangState(updated);
                        handleSaveLangSettings(updated);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <ArrowUp size={14} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={idx === langState.languages.length - 1}
                      onClick={() => {
                        const newLangs = [...langState.languages];
                        [newLangs[idx + 1], newLangs[idx]] = [newLangs[idx], newLangs[idx + 1]];
                        const updated = { ...langState, languages: newLangs };
                        setLangState(updated);
                        handleSaveLangSettings(updated);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <ArrowDown size={14} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingLangCard(l);
                        setIsLangCardModalOpen(true);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 size={14} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newLangs = langState.languages.filter((x) => x.id !== l.id);
                        const updated = { ...langState, languages: newLangs };
                        setLangState(updated);
                        handleSaveLangSettings(updated);
                        toast.success(`Removed "${l.name}"`);
                      }}
                      className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}

              {(!langState.languages || langState.languages.length === 0) && (
                <EmptyState
                  title="No language wings"
                  description="Add languages like Arabic, English, Urdu, or Malayalam."
                />
              )}
            </div>
          </Panel>

          {/* Add/Edit Language Modal */}
          {editingLangCard && (
            <Dialog open={isLangCardModalOpen} onOpenChange={setIsLangCardModalOpen}>
              <DialogContent className="max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="font-display text-lg">
                    {langState.languages?.some((x) => x.id === editingLangCard.id)
                      ? "Edit Language Wing"
                      : "Add New Language Wing"}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Specify the language name and details regarding spoken classes or syllabus.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                  <div>
                    <Label htmlFor="lang-name" className="text-xs font-semibold">
                      Language Name
                    </Label>
                    <Input
                      id="lang-name"
                      value={editingLangCard.name}
                      onChange={(e) =>
                        setEditingLangCard({ ...editingLangCard, name: e.target.value })
                      }
                      className="mt-1"
                      placeholder="e.g. Arabic, English, Urdu"
                    />
                  </div>

                  <div>
                    <Label htmlFor="lang-note" className="text-xs font-semibold">
                      Curriculum / Practice Details
                    </Label>
                    <Textarea
                      id="lang-note"
                      rows={4}
                      value={editingLangCard.note}
                      onChange={(e) =>
                        setEditingLangCard({ ...editingLangCard, note: e.target.value })
                      }
                      className="mt-1"
                      placeholder="Classical grammar, daily spoken sessions, camps..."
                    />
                  </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsLangCardModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      if (!editingLangCard.name.trim()) {
                        toast.error("Please provide a language name.");
                        return;
                      }
                      const isNew = !langState.languages.some((x) => x.id === editingLangCard.id);
                      let newLangs: LanguageDoorCard[];
                      if (isNew) {
                        newLangs = [...langState.languages, editingLangCard];
                      } else {
                        newLangs = langState.languages.map((x) =>
                          x.id === editingLangCard.id ? editingLangCard : x,
                        );
                      }
                      const updated = { ...langState, languages: newLangs };
                      setLangState(updated);
                      handleSaveLangSettings(updated);
                      setIsLangCardModalOpen(false);
                      setEditingLangCard(null);
                    }}
                  >
                    Save Language
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </TabsContent>

        {/* ================================================================= */}
        {/* MAGAZINE TAB */}
        {/* ================================================================= */}
        <TabsContent value="magazine" className="space-y-6">
          <Panel className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <h3 className="font-display text-lg text-foreground">Magazines & Periodicals</h3>
                <p className="text-xs text-muted-foreground">
                  Publish campus magazines, annual editions, and student journals with PDF files or
                  online links.
                </p>
              </div>
              <Button
                type="button"
                onClick={() => {
                  setEditingMagazine({
                    id: `mag-${Date.now()}`,
                    title: "",
                    description: "",
                    cover_image: null,
                    publication_date: new Date().getFullYear().toString(),
                    source_type: "pdf",
                    pdf_url: null,
                    pdf_filename: null,
                    external_url: "",
                    published: true,
                    created_at: new Date().toISOString(),
                  });
                  setIsMagModalOpen(true);
                }}
                className="gap-2 rounded-xl"
              >
                <Plus size={16} />
                <span>Add Magazine</span>
              </Button>
            </div>

            {/* Magazines Table / List */}
            <div className="mt-6 space-y-4">
              {magList.map((mag, idx) => (
                <div
                  key={mag.id}
                  className="flex flex-col gap-4 rounded-2xl border border-border bg-card/60 p-5 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Cover Preview or Icon */}
                    <div className="flex h-16 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/60">
                      {mag.cover_image ? (
                        <img
                          src={mag.cover_image}
                          alt={mag.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <BookOpen size={20} className="text-muted-foreground" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="truncate font-display text-base font-semibold text-foreground">
                          {mag.title}
                        </h4>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            mag.published
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {mag.published ? "Published" : "Draft"}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                          {mag.source_type === "pdf" ? "PDF File" : "External Link"}
                        </span>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {mag.publication_date && <span>Edition: {mag.publication_date}</span>}
                        {mag.source_type === "pdf" && mag.pdf_filename && (
                          <span className="truncate max-w-[200px]">File: {mag.pdf_filename}</span>
                        )}
                        {mag.source_type === "link" && mag.external_url && (
                          <span className="truncate max-w-[220px]">URL: {mag.external_url}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    {/* Preview / View Action */}
                    {mag.source_type === "pdf" && mag.pdf_url && (
                      <a
                        href={mag.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground hover:bg-muted"
                        title="Preview PDF"
                      >
                        <Eye size={15} />
                      </a>
                    )}
                    {mag.source_type === "link" && mag.external_url && (
                      <a
                        href={mag.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground hover:bg-muted"
                        title="Open Link"
                      >
                        <ExternalLink size={15} />
                      </a>
                    )}

                    {/* Published toggle */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const updated = magList.map((m) =>
                          m.id === mag.id ? { ...m, published: !m.published } : m,
                        );
                        persistMagazines(updated);
                        toast.success(
                          `Magazine is now ${!mag.published ? "published" : "unpublished"}.`,
                        );
                      }}
                      className={`h-9 px-2 text-xs ${
                        mag.published ? "text-emerald-600" : "text-muted-foreground"
                      }`}
                      title={mag.published ? "Unpublish" : "Publish"}
                    >
                      {mag.published ? "Published" : "Publish"}
                    </Button>

                    {/* Reorder Buttons */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={idx === 0}
                      onClick={() => {
                        const updated = [...magList];
                        [updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]];
                        persistMagazines(updated);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <ArrowUp size={14} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={idx === magList.length - 1}
                      onClick={() => {
                        const updated = [...magList];
                        [updated[idx + 1], updated[idx]] = [updated[idx], updated[idx + 1]];
                        persistMagazines(updated);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <ArrowDown size={14} />
                    </Button>

                    {/* Edit */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingMagazine(mag);
                        setIsMagModalOpen(true);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 size={14} />
                    </Button>

                    {/* Delete */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTargetMag(mag)}
                      className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}

              {magList.length === 0 && (
                <EmptyState
                  title="No magazines created yet"
                  description="Click 'Add Magazine' above to upload a new PDF or link to an online publication."
                />
              )}
            </div>
          </Panel>

          {/* Add/Edit Magazine Dialog */}
          {editingMagazine && (
            <Dialog open={isMagModalOpen} onOpenChange={setIsMagModalOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
                <form onSubmit={handleSaveMagazineForm}>
                  <DialogHeader>
                    <DialogTitle className="font-display text-lg">
                      {magList.some((m) => m.id === editingMagazine.id)
                        ? "Edit Magazine"
                        : "Add Magazine"}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      Configure issue details, cover image, PDF file, or external link.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-5 py-4">
                    {/* Title */}
                    <div>
                      <Label htmlFor="mag-title" className="text-xs font-semibold">
                        Magazine Title <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="mag-title"
                        required
                        value={editingMagazine.title}
                        onChange={(e) =>
                          setEditingMagazine({ ...editingMagazine, title: e.target.value })
                        }
                        className="mt-1"
                        placeholder="e.g. Al-Bayan Annual Magazine 2024"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Publication Date / Year */}
                      <div>
                        <Label htmlFor="mag-date" className="text-xs font-semibold">
                          Publication Date / Year
                        </Label>
                        <Input
                          id="mag-date"
                          value={editingMagazine.publication_date || ""}
                          onChange={(e) =>
                            setEditingMagazine({
                              ...editingMagazine,
                              publication_date: e.target.value,
                            })
                          }
                          className="mt-1"
                          placeholder="e.g. 2024 or Oct 2023"
                        />
                      </div>

                      {/* Published Toggle */}
                      <div className="flex items-center justify-between rounded-xl border border-border p-3">
                        <div>
                          <Label className="text-xs font-semibold">Publication Status</Label>
                          <p className="text-[11px] text-muted-foreground">
                            {editingMagazine.published
                              ? "Visible on public website"
                              : "Hidden as draft"}
                          </p>
                        </div>
                        <Switch
                          checked={editingMagazine.published}
                          onCheckedChange={(checked) =>
                            setEditingMagazine({ ...editingMagazine, published: checked })
                          }
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <Label htmlFor="mag-desc" className="text-xs font-semibold">
                        Short Description
                      </Label>
                      <Textarea
                        id="mag-desc"
                        rows={2}
                        value={editingMagazine.description || ""}
                        onChange={(e) =>
                          setEditingMagazine({ ...editingMagazine, description: e.target.value })
                        }
                        className="mt-1"
                        placeholder="Brief overview of themes, research articles, or student works..."
                      />
                    </div>

                    {/* Cover Image Manager */}
                    <div>
                      <ImageFieldManager
                        label="Cover Image (Optional)"
                        description="Aspect ratio 3:4 recommended for magazine covers."
                        currentImageUrl={editingMagazine.cover_image}
                        storageFolder="magazines"
                        aspectRatio={3 / 4}
                        modalTitle="Crop Magazine Cover"
                        onSave={(url) => {
                          setEditingMagazine({ ...editingMagazine, cover_image: url });
                        }}
                      />
                    </div>

                    {/* Source Type Selection: PDF or Link */}
                    <div className="rounded-2xl border border-border p-4 bg-muted/20">
                      <Label className="text-xs font-semibold">Content Format</Label>
                      <div className="mt-2 grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setEditingMagazine({ ...editingMagazine, source_type: "pdf" })
                          }
                          className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-medium transition-all ${
                            editingMagazine.source_type === "pdf"
                              ? "border-primary bg-primary/10 text-primary shadow-sm"
                              : "border-border bg-card text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          <FileText size={16} />
                          <span>Upload PDF Document</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setEditingMagazine({ ...editingMagazine, source_type: "link" })
                          }
                          className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-medium transition-all ${
                            editingMagazine.source_type === "link"
                              ? "border-primary bg-primary/10 text-primary shadow-sm"
                              : "border-border bg-card text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          <ExternalLink size={16} />
                          <span>External Magazine Link</span>
                        </button>
                      </div>

                      {/* Option A: PDF Upload */}
                      {editingMagazine.source_type === "pdf" ? (
                        <div className="mt-4 space-y-3">
                          <input
                            type="file"
                            ref={pdfInputRef}
                            accept=".pdf,application/pdf"
                            onChange={handlePdfUpload}
                            className="hidden"
                          />

                          {editingMagazine.pdf_url ? (
                            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                  <FileText size={18} />
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-xs font-medium text-foreground">
                                    {editingMagazine.pdf_filename || "Uploaded Magazine PDF"}
                                  </p>
                                  <a
                                    href={editingMagazine.pdf_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                                  >
                                    <span>Preview file in browser</span>
                                    <ExternalLink size={11} />
                                  </a>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => pdfInputRef.current?.click()}
                                  disabled={isUploadingPdf}
                                  className="h-8 gap-1.5 text-xs"
                                >
                                  {isUploadingPdf ? (
                                    <Loader2 size={13} className="animate-spin" />
                                  ) : (
                                    <RefreshCw size={13} />
                                  )}
                                  <span>Replace</span>
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setEditingMagazine({
                                      ...editingMagazine,
                                      pdf_url: null,
                                      pdf_filename: null,
                                    })
                                  }
                                  className="h-8 text-xs text-destructive hover:bg-destructive/10"
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div
                              onClick={() => pdfInputRef.current?.click()}
                              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-6 text-center transition-colors hover:border-primary hover:bg-muted/40"
                            >
                              {isUploadingPdf ? (
                                <>
                                  <Loader2 size={24} className="animate-spin text-primary" />
                                  <p className="mt-2 text-xs font-medium text-foreground">
                                    Uploading PDF document...
                                  </p>
                                </>
                              ) : (
                                <>
                                  <Upload size={24} className="text-muted-foreground" />
                                  <p className="mt-2 text-xs font-medium text-foreground">
                                    Click to select and upload Magazine PDF
                                  </p>
                                  <p className="mt-1 text-[11px] text-muted-foreground">
                                    Supports files up to 50MB
                                  </p>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Option B: External Link */
                        <div className="mt-4 space-y-2">
                          <Label htmlFor="mag-url" className="text-xs font-semibold">
                            External Web URL <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="mag-url"
                            type="url"
                            value={editingMagazine.external_url || ""}
                            onChange={(e) =>
                              setEditingMagazine({
                                ...editingMagazine,
                                external_url: e.target.value,
                              })
                            }
                            placeholder="https://issuu.com/your-magazine or online reader link"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsMagModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSavingMags || isUploadingPdf}>
                      {isSavingMags ? (
                        <Loader2 size={16} className="animate-spin mr-1" />
                      ) : (
                        <Check size={16} className="mr-1" />
                      )}
                      <span>Save Magazine</span>
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}

          {/* Delete Magazine Confirmation */}
          {deleteTargetMag && (
            <ConfirmDeleteDialog
              open={Boolean(deleteTargetMag)}
              onOpenChange={(open) => !open && setDeleteTargetMag(null)}
              title="Delete Magazine"
              itemName={deleteTargetMag.title}
              onConfirm={async () => {
                if (deleteTargetMag.pdf_url) {
                  await deleteStoredMedia(deleteTargetMag.pdf_url).catch(() => {});
                }
                const updated = magList.filter((m) => m.id !== deleteTargetMag.id);
                await persistMagazines(updated);
                setDeleteTargetMag(null);
                toast.success("Magazine deleted.");
              }}
            />
          )}
        </TabsContent>

        {/* ================================================================= */}
        {/* SSF DA'WA TAB */}
        {/* ================================================================= */}
        <TabsContent value="ssf-dawa" className="space-y-6">
          {/* Da'wa Page Settings (Intro, descriptions, banner quote) */}
          <Panel className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <h3 className="font-display text-lg text-foreground">SSF Da'wa Page Settings</h3>
                <p className="text-xs text-muted-foreground">
                  Update unit introduction, mission statement paragraphs, and banner quote.
                </p>
              </div>
              <Button
                type="button"
                onClick={() => handleSaveSsfSettings()}
                disabled={isSavingSsfSettings}
                className="gap-2 rounded-xl"
              >
                {isSavingSsfSettings ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                <span>Save Da'wa Settings</span>
              </Button>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="ssf-title" className="text-xs font-semibold">
                    Page Title
                  </Label>
                  <Input
                    id="ssf-title"
                    value={ssfSettings.title || ""}
                    onChange={(e) => setSsfSettings({ ...ssfSettings, title: e.target.value })}
                    className="mt-1"
                    placeholder="SSF Darusuffa Da'wa"
                  />
                </div>

                <div>
                  <Label htmlFor="ssf-intro" className="text-xs font-semibold">
                    Intro Tagline
                  </Label>
                  <Input
                    id="ssf-intro"
                    value={ssfSettings.intro || ""}
                    onChange={(e) => setSsfSettings({ ...ssfSettings, intro: e.target.value })}
                    className="mt-1"
                    placeholder="Rooted in the values of truth, tolerance and wisdom."
                  />
                </div>

                <div>
                  <Label htmlFor="ssf-desc1" className="text-xs font-semibold">
                    Mission Paragraph 1
                  </Label>
                  <Textarea
                    id="ssf-desc1"
                    rows={3}
                    value={ssfSettings.description1 || ""}
                    onChange={(e) =>
                      setSsfSettings({ ...ssfSettings, description1: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="ssf-desc2" className="text-xs font-semibold">
                    Activities Paragraph 2
                  </Label>
                  <Textarea
                    id="ssf-desc2"
                    rows={3}
                    value={ssfSettings.description2 || ""}
                    onChange={(e) =>
                      setSsfSettings({ ...ssfSettings, description2: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="ssf-quote" className="text-xs font-semibold">
                    Banner Quote
                  </Label>
                  <Input
                    id="ssf-quote"
                    value={ssfSettings.quote || ""}
                    onChange={(e) => setSsfSettings({ ...ssfSettings, quote: e.target.value })}
                    className="mt-1"
                    placeholder="Invite to the way of your Lord with wisdom and beautiful preaching."
                  />
                </div>
              </div>

              {/* Banner Image */}
              <div>
                <ImageFieldManager
                  label="Banner Background Photo"
                  description="Spiritual or campus banner image displayed behind the quote."
                  currentImageUrl={ssfSettings.bannerImage}
                  storageFolder="ssf-dawa"
                  aspectRatio={16 / 9}
                  modalTitle="Crop SSF Da'wa Banner"
                  onSave={async (url) => {
                    const updated = { ...ssfSettings, bannerImage: url };
                    setSsfSettings(updated);
                    await handleSaveSsfSettings(updated);
                  }}
                />
              </div>
            </div>
          </Panel>

          {/* SSF Da'wa Events List */}
          <Panel className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <h3 className="font-display text-lg text-foreground">SSF Da'wa Events & Media</h3>
                <p className="text-xs text-muted-foreground">
                  Create events, upload single or multiple photos, manage dates, and publish to
                  public page.
                </p>
              </div>
              <Button
                type="button"
                onClick={() => {
                  setEditingSsfEvent({
                    id: `ssf-ev-${Date.now()}`,
                    event_name: "",
                    date: new Date().toISOString().split("T")[0],
                    description: "",
                    images: [],
                    published: true,
                    created_at: new Date().toISOString(),
                  });
                  setIsSsfEventModalOpen(true);
                }}
                className="gap-2 rounded-xl"
              >
                <Plus size={16} />
                <span>Add SSF Da'wa Event</span>
              </Button>
            </div>

            <div className="mt-6 space-y-4">
              {ssfEvents.map((ev, idx) => {
                const cover = ev.images && ev.images.length > 0 ? ev.images[0].image_url : null;
                const photoCount = ev.images ? ev.images.length : 0;

                return (
                  <div
                    key={ev.id}
                    className="flex flex-col gap-4 rounded-2xl border border-border bg-card/60 p-5 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Event Cover Photo Thumbnail */}
                      <div className="flex h-16 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/60">
                        {cover ? (
                          <img
                            src={cover}
                            alt={ev.event_name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Images size={20} className="text-muted-foreground" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="truncate font-display text-base font-semibold text-foreground">
                            {ev.event_name}
                          </h4>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                              ev.published
                                ? "bg-emerald-500/10 text-emerald-600"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {ev.published ? "Published" : "Draft"}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                            {photoCount} {photoCount === 1 ? "Photo" : "Photos"}
                          </span>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          {ev.date && (
                            <span className="flex items-center gap-1">
                              <Calendar size={12} className="text-primary" />
                              <span>{ev.date}</span>
                            </span>
                          )}
                          {ev.description && (
                            <span className="truncate max-w-[300px]">{ev.description}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      {/* Publish / Draft toggle */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const updated = ssfEvents.map((e) =>
                            e.id === ev.id ? { ...e, published: !e.published } : e,
                          );
                          persistSsfEvents(updated);
                          toast.success(
                            `Event is now ${!ev.published ? "published" : "unpublished"}.`,
                          );
                        }}
                        className={`h-9 px-2 text-xs ${
                          ev.published ? "text-emerald-600" : "text-muted-foreground"
                        }`}
                      >
                        {ev.published ? "Published" : "Draft"}
                      </Button>

                      {/* Reorder */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={idx === 0}
                        onClick={() => {
                          const updated = [...ssfEvents];
                          [updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]];
                          persistSsfEvents(updated);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <ArrowUp size={14} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={idx === ssfEvents.length - 1}
                        onClick={() => {
                          const updated = [...ssfEvents];
                          [updated[idx + 1], updated[idx]] = [updated[idx], updated[idx + 1]];
                          persistSsfEvents(updated);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <ArrowDown size={14} />
                      </Button>

                      {/* Edit */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingSsfEvent(ev);
                          setIsSsfEventModalOpen(true);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 size={14} />
                      </Button>

                      {/* Delete */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTargetEvent(ev)}
                        className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                );
              })}

              {ssfEvents.length === 0 && (
                <EmptyState
                  title="No SSF Da'wa events created yet"
                  description="Click 'Add SSF Da'wa Event' to publish meeting and programme galleries."
                />
              )}
            </div>
          </Panel>

          {/* Add/Edit SSF Da'wa Event Dialog */}
          {editingSsfEvent && (
            <Dialog open={isSsfEventModalOpen} onOpenChange={setIsSsfEventModalOpen}>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl">
                <form onSubmit={handleSaveSsfEventForm}>
                  <DialogHeader>
                    <DialogTitle className="font-display text-lg">
                      {ssfEvents.some((e) => e.id === editingSsfEvent.id)
                        ? "Edit SSF Da'wa Event"
                        : "Add SSF Da'wa Event"}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      Enter event details, date, description, and manage all photo uploads.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-5 py-4">
                    {/* Event Name */}
                    <div>
                      <Label htmlFor="ev-name" className="text-xs font-semibold">
                        Event Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="ev-name"
                        required
                        value={editingSsfEvent.event_name}
                        onChange={(e) =>
                          setEditingSsfEvent({ ...editingSsfEvent, event_name: e.target.value })
                        }
                        className="mt-1"
                        placeholder="e.g. Annual Da'wa Meet & Moral Study Circle"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Event Date */}
                      <div>
                        <Label htmlFor="ev-date" className="text-xs font-semibold">
                          Event Date (Optional)
                        </Label>
                        <Input
                          id="ev-date"
                          type="date"
                          value={editingSsfEvent.date || ""}
                          onChange={(e) =>
                            setEditingSsfEvent({ ...editingSsfEvent, date: e.target.value })
                          }
                          className="mt-1"
                        />
                      </div>

                      {/* Published Toggle */}
                      <div className="flex items-center justify-between rounded-xl border border-border p-3">
                        <div>
                          <Label className="text-xs font-semibold">Publish Event</Label>
                          <p className="text-[11px] text-muted-foreground">
                            {editingSsfEvent.published
                              ? "Visible on public SSF Da'wa page"
                              : "Saved as private draft"}
                          </p>
                        </div>
                        <Switch
                          checked={editingSsfEvent.published}
                          onCheckedChange={(checked) =>
                            setEditingSsfEvent({ ...editingSsfEvent, published: checked })
                          }
                        />
                      </div>
                    </div>

                    {/* Short Description */}
                    <div>
                      <Label htmlFor="ev-desc" className="text-xs font-semibold">
                        Short Description
                      </Label>
                      <Textarea
                        id="ev-desc"
                        rows={3}
                        value={editingSsfEvent.description || ""}
                        onChange={(e) =>
                          setEditingSsfEvent({ ...editingSsfEvent, description: e.target.value })
                        }
                        className="mt-1"
                        placeholder="Key discussions, moral topics, volunteer activities..."
                      />
                    </div>

                    {/* Event Images Section */}
                    <div className="rounded-2xl border border-border p-4 bg-muted/20">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                        <div>
                          <h5 className="font-display text-sm font-semibold text-foreground">
                            Event Photos & Gallery
                          </h5>
                          <p className="text-[11px] text-muted-foreground">
                            Upload single or multiple images. Each image opens in the crop/zoom
                            editor before saving.
                          </p>
                        </div>

                        {/* Hidden Multi-file input */}
                        <input
                          type="file"
                          ref={multiFileInputRef}
                          multiple
                          accept="image/*"
                          onChange={handleFilesSelected}
                          className="hidden"
                        />

                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (multiFileInputRef.current) {
                                multiFileInputRef.current.multiple = false;
                                multiFileInputRef.current.click();
                              }
                            }}
                            className="gap-1.5 rounded-xl text-xs"
                          >
                            <Upload size={14} />
                            <span>Upload One Image</span>
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            variant="default"
                            onClick={() => {
                              if (multiFileInputRef.current) {
                                multiFileInputRef.current.multiple = true;
                                multiFileInputRef.current.click();
                              }
                            }}
                            className="gap-1.5 rounded-xl text-xs"
                          >
                            <FolderPlus size={14} />
                            <span>Upload Multiple Images</span>
                          </Button>
                        </div>
                      </div>

                      {/* Uploaded Images Grid */}
                      <div className="mt-4">
                        {editingSsfEvent.images.length > 0 ? (
                          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                            {editingSsfEvent.images.map((img, imgIdx) => (
                              <div
                                key={img.id}
                                className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm"
                              >
                                <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                                  <img
                                    src={img.image_url}
                                    alt={img.caption || `Event photo ${imgIdx + 1}`}
                                    className="h-full w-full object-cover"
                                  />
                                  {imgIdx === 0 && (
                                    <span className="absolute left-2 top-2 rounded-md bg-background/90 px-2 py-0.5 text-[10px] font-semibold text-foreground shadow">
                                      Cover Photo
                                    </span>
                                  )}
                                </div>

                                <div className="p-2 space-y-1.5">
                                  <Input
                                    value={img.caption || ""}
                                    onChange={(e) => {
                                      const updatedImgs = editingSsfEvent.images.map((item) =>
                                        item.id === img.id
                                          ? { ...item, caption: e.target.value }
                                          : item,
                                      );
                                      setEditingSsfEvent({
                                        ...editingSsfEvent,
                                        images: updatedImgs,
                                      });
                                    }}
                                    placeholder="Optional caption..."
                                    className="h-7 text-xs"
                                  />

                                  <div className="flex items-center justify-between pt-1">
                                    <div className="flex items-center gap-1">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        disabled={imgIdx === 0}
                                        onClick={() => {
                                          const list = [...editingSsfEvent.images];
                                          [list[imgIdx - 1], list[imgIdx]] = [
                                            list[imgIdx],
                                            list[imgIdx - 1],
                                          ];
                                          setEditingSsfEvent({
                                            ...editingSsfEvent,
                                            images: list,
                                          });
                                        }}
                                        className="h-6 w-6 p-0"
                                      >
                                        <ArrowUp size={12} />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        disabled={imgIdx === editingSsfEvent.images.length - 1}
                                        onClick={() => {
                                          const list = [...editingSsfEvent.images];
                                          [list[imgIdx + 1], list[imgIdx]] = [
                                            list[imgIdx],
                                            list[imgIdx + 1],
                                          ];
                                          setEditingSsfEvent({
                                            ...editingSsfEvent,
                                            images: list,
                                          });
                                        }}
                                        className="h-6 w-6 p-0"
                                      >
                                        <ArrowDown size={12} />
                                      </Button>
                                    </div>

                                    <div className="flex items-center gap-1">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setReplacingImageId(img.id);
                                          if (multiFileInputRef.current) {
                                            multiFileInputRef.current.multiple = false;
                                            multiFileInputRef.current.click();
                                          }
                                        }}
                                        className="h-6 px-1.5 text-[11px]"
                                        title="Replace photo"
                                      >
                                        Replace
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          const list = editingSsfEvent.images.filter(
                                            (item) => item.id !== img.id,
                                          );
                                          setEditingSsfEvent({
                                            ...editingSsfEvent,
                                            images: list,
                                          });
                                        }}
                                        className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                                        title="Remove photo"
                                      >
                                        <Trash2 size={12} />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-border p-6 text-center">
                            <Images className="mx-auto h-8 w-8 text-muted-foreground/60" />
                            <p className="mt-2 text-xs font-medium text-foreground">
                              No photos added to this event yet
                            </p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              Use the buttons above to select and crop event photos.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsSsfEventModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSavingSsfEvents}>
                      {isSavingSsfEvents ? (
                        <Loader2 size={16} className="animate-spin mr-1" />
                      ) : (
                        <Check size={16} className="mr-1" />
                      )}
                      <span>Save SSF Da'wa Event</span>
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}

          {/* Reusable Image Crop Modal for SSF Da'wa Uploads */}
          {currentCropItem && (
            <ImageCropModal
              open={isCropModalOpen}
              imageSrc={currentCropItem.dataUrl}
              cropShape="rect"
              aspectRatio={16 / 10}
              title={`Adjust & Crop Image ${
                cropQueue.length > 0 ? `(1 of ${cropQueue.length + 1})` : ""
              }`}
              isProcessing={isUploadingCroppedImage}
              onConfirm={handleConfirmCroppedImage}
              onClose={handleCloseCropModal}
            />
          )}

          {/* Delete Event Confirmation */}
          {deleteTargetEvent && (
            <ConfirmDeleteDialog
              open={Boolean(deleteTargetEvent)}
              onOpenChange={(open) => !open && setDeleteTargetEvent(null)}
              title="Delete SSF Da'wa Event"
              itemName={deleteTargetEvent.event_name}
              onConfirm={async () => {
                const updated = ssfEvents.filter((e) => e.id !== deleteTargetEvent.id);
                await persistSsfEvents(updated);
                setDeleteTargetEvent(null);
                toast.success("SSF Da'wa event deleted.");
              }}
            />
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
