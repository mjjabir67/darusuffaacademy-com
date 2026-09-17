"use client";

import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  FileText,
  Download,
  CheckCircle2,
  Inbox,
  ArrowUp,
  ArrowDown,
  Info,
  FileCheck,
  Plus,
  Trash2,
  Loader2,
  Sliders,
  Sparkles,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeading, Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DEFAULT_ADMISSION,
  DEFAULT_FACILITIES,
  DEFAULT_ADMISSION_FIELDS,
  type AdmissionSettings,
  type AdmissionApplication,
} from "@/lib/cms";
import { AdmissionApplicationsTab } from "@/components/admin/admission/AdmissionApplicationsTab";
import { AdmissionInformationTab } from "@/components/admin/admission/AdmissionInformationTab";
import { AdmissionFormFieldsTab } from "@/components/admin/admission/AdmissionFormFieldsTab";
import { AdmissionDownloadFormTab } from "@/components/admin/admission/AdmissionDownloadFormTab";

export const Route = createFileRoute("/admin/admission")({
  component: AdmissionAdmin,
});

export default function AdmissionAdmin() {
  const queryClient = useQueryClient();

  const [form, setForm] = useState<AdmissionSettings>(DEFAULT_ADMISSION);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("applications");
  const [newStepText, setNewStepText] = useState("");
  const [newDocText, setNewDocText] = useState("");

  // Query submitted applications count for tab badge
  const { data: applications = [] } = useQuery<AdmissionApplication[]>({
    queryKey: ["admin", "admission-applications"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/admissions/applications");
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.applications)) return json.applications;
        }
      } catch {
        // fallback
      }
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "admission_applications")
        .maybeSingle();
      if (!data || !Array.isArray(data.value)) return [];
      return data.value as AdmissionApplication[];
    },
  });

  // Load current settings from site_settings table
  const { data, isLoading } = useQuery({
    queryKey: ["settings", "admission"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "admission")
        .maybeSingle();

      if (error) {
        console.warn("[Admin Admission] Fetch error:", error);
        return DEFAULT_ADMISSION;
      }

      if (!data || !data.value) return DEFAULT_ADMISSION;

      const raw = data.value as Partial<AdmissionSettings>;
      return {
        ...DEFAULT_ADMISSION,
        ...raw,
        facilities:
          Array.isArray(raw.facilities) && raw.facilities.length > 0
            ? raw.facilities
            : DEFAULT_FACILITIES,
        formFields:
          Array.isArray(raw.formFields) && raw.formFields.length > 0
            ? raw.formFields
            : DEFAULT_ADMISSION_FIELDS,
      } as AdmissionSettings;
    },
  });

  useEffect(() => {
    if (data) {
      setForm(data);
    }
  }, [data]);

  const set = (patch: Partial<AdmissionSettings>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  // Save changes to database
  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("site_settings")
        .upsert({ key: "admission", value: form }, { onConflict: "key" });

      if (error) {
        console.error("[Admin Admission] Save error:", error);
        toast.error("Could not save admission settings: " + error.message);
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["settings", "admission"] });
      toast.success("Admission settings saved successfully!");
    } catch (err) {
      console.error("[Admin Admission] Exception during save:", err);
      toast.error("An unexpected error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  // Steps management
  const addStep = () => {
    if (!newStepText.trim()) return;
    set({ steps: [...form.steps, newStepText.trim()] });
    setNewStepText("");
  };

  const removeStep = (index: number) => {
    set({ steps: form.steps.filter((_, i) => i !== index) });
  };

  const moveStep = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= form.steps.length) return;
    const newSteps = [...form.steps];
    const temp = newSteps[index];
    newSteps[index] = newSteps[targetIndex];
    newSteps[targetIndex] = temp;
    set({ steps: newSteps });
  };

  // Documents management
  const addDocument = () => {
    if (!newDocText.trim()) return;
    set({ requiredDocuments: [...form.requiredDocuments, newDocText.trim()] });
    setNewDocText("");
  };

  const removeDocument = (index: number) => {
    set({ requiredDocuments: form.requiredDocuments.filter((_, i) => i !== index) });
  };

  const newAppsCount = applications.filter((a) => a.status === "New").length;

  return (
    <>
      <PageHeading
        title="Admission Management"
        description="Comprehensive management for online applications, admission information, dynamic form fields, and downloadable PDF form."
        action={
          <div className="flex items-center gap-3">
            <Link
              to="/admission"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3.5 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              Public Page
            </Link>
            <Button onClick={handleSave} disabled={saving} className="rounded-xl px-5 gap-2">
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="py-20 text-center">
          <Loader2 size={32} className="mx-auto animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Loading admission configuration...</p>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="h-auto flex-wrap gap-1 bg-background p-1.5 border border-border rounded-xl">
            <TabsTrigger value="applications" className="gap-2 rounded-lg py-2">
              <Users size={16} />
              Applications
              {newAppsCount > 0 ? (
                <span className="ml-1 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  {newAppsCount} new
                </span>
              ) : applications.length > 0 ? (
                <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  {applications.length}
                </span>
              ) : null}
            </TabsTrigger>

            <TabsTrigger value="information" className="gap-2 rounded-lg py-2">
              <Info size={16} />
              Admission Information
            </TabsTrigger>

            <TabsTrigger value="application-form" className="gap-2 rounded-lg py-2">
              <Sliders size={16} />
              Application Form Fields
            </TabsTrigger>

            <TabsTrigger value="download-form" className="gap-2 rounded-lg py-2">
              <Download size={16} />
              Download Form (PDF)
            </TabsTrigger>

            <TabsTrigger value="page-content" className="gap-2 rounded-lg py-2">
              <FileText size={16} />
              Page Content &amp; Steps
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: APPLICATIONS */}
          <TabsContent value="applications" className="space-y-6 mt-0">
            <AdmissionApplicationsTab />
          </TabsContent>

          {/* TAB 2: ADMISSION INFORMATION */}
          <TabsContent value="information" className="space-y-6 mt-0">
            <AdmissionInformationTab form={form} set={set} />
          </TabsContent>

          {/* TAB 3: APPLICATION FORM FIELDS */}
          <TabsContent value="application-form" className="space-y-6 mt-0">
            <AdmissionFormFieldsTab form={form} set={set} />
          </TabsContent>

          {/* TAB 4: DOWNLOAD FORM */}
          <TabsContent value="download-form" className="space-y-6 mt-0">
            <AdmissionDownloadFormTab form={form} set={set} />
          </TabsContent>

          {/* TAB 5: PAGE CONTENT & STEPS */}
          <TabsContent value="page-content" className="space-y-6 mt-0">
            {/* Page Header Texts */}
            <Panel title="Header &amp; Overview Texts">
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="eyebrow">Eyebrow</Label>
                    <Input
                      id="eyebrow"
                      value={form.eyebrow}
                      onChange={(e) => set({ eyebrow: e.target.value })}
                      placeholder="e.g. Know more about"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Main Title</Label>
                    <Input
                      id="title"
                      value={form.title}
                      onChange={(e) => set({ title: e.target.value })}
                      placeholder="e.g. Admission"
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="intro">Introductory Paragraph</Label>
                  <Textarea
                    id="intro"
                    value={form.intro}
                    onChange={(e) => set({ intro: e.target.value })}
                    rows={3}
                    placeholder="Short introductory message displayed prominently below the title..."
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="overviewText">Campus Overview Text</Label>
                  <Textarea
                    id="overviewText"
                    value={form.overviewText}
                    onChange={(e) => set({ overviewText: e.target.value })}
                    rows={4}
                    placeholder="Detailed paragraph introducing the campus, peaceful learning atmosphere..."
                    className="rounded-xl"
                  />
                </div>
              </div>
            </Panel>

            {/* How to Apply Steps */}
            <Panel title="How to Apply Steps">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="howToApplyTitle">Section Heading</Label>
                  <Input
                    id="howToApplyTitle"
                    value={form.howToApplyTitle}
                    onChange={(e) => set({ howToApplyTitle: e.target.value })}
                    placeholder="e.g. How to apply"
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Steps List</Label>
                  <div className="space-y-2.5">
                    {form.steps.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 rounded-xl border border-border bg-card p-3 shadow-xs"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {idx + 1}
                        </span>
                        <span className="flex-1 text-sm text-foreground">{step}</span>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => moveStep(idx, "up")}
                            disabled={idx === 0}
                          >
                            <ArrowUp size={14} />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => moveStep(idx, "down")}
                            disabled={idx === form.steps.length - 1}
                          >
                            <ArrowDown size={14} />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                            onClick={() => removeStep(idx)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Input
                      value={newStepText}
                      onChange={(e) => setNewStepText(e.target.value)}
                      placeholder="Add another step description..."
                      className="rounded-xl"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addStep();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addStep}
                      disabled={!newStepText.trim()}
                      className="rounded-xl shrink-0 gap-1.5"
                    >
                      <Plus size={16} />
                      Add Step
                    </Button>
                  </div>
                </div>
              </div>
            </Panel>

            {/* Eligibility & Documents */}
            <Panel title="Eligibility &amp; Required Documents">
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="toggle-eligibility" className="text-base font-medium">
                      Show Eligibility Criteria Card
                    </Label>
                    <Switch
                      id="toggle-eligibility"
                      checked={form.showEligibility}
                      onCheckedChange={(checked) => set({ showEligibility: checked })}
                    />
                  </div>
                  {form.showEligibility && (
                    <div className="space-y-3 pl-2 border-l-2 border-primary/20">
                      <Input
                        value={form.eligibilityTitle}
                        onChange={(e) => set({ eligibilityTitle: e.target.value })}
                        placeholder="Eligibility card heading..."
                        className="rounded-xl"
                      />
                      <Textarea
                        value={form.eligibilityText}
                        onChange={(e) => set({ eligibilityText: e.target.value })}
                        rows={3}
                        placeholder="Eligibility requirements text..."
                        className="rounded-xl"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="toggle-documents" className="text-base font-medium">
                      Show Required Documents Card
                    </Label>
                    <Switch
                      id="toggle-documents"
                      checked={form.showRequiredDocuments}
                      onCheckedChange={(checked) => set({ showRequiredDocuments: checked })}
                    />
                  </div>

                  {form.showRequiredDocuments && (
                    <div className="space-y-3 pl-2 border-l-2 border-primary/20">
                      <Input
                        value={form.requiredDocumentsTitle}
                        onChange={(e) => set({ requiredDocumentsTitle: e.target.value })}
                        placeholder="Required documents heading..."
                        className="rounded-xl"
                      />

                      <div className="space-y-2">
                        {form.requiredDocuments.map((doc, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card p-2.5 text-sm"
                          >
                            <span>{doc}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 shrink-0"
                              onClick={() => removeDocument(idx)}
                            >
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <Input
                          value={newDocText}
                          onChange={(e) => setNewDocText(e.target.value)}
                          placeholder="e.g. Original Transfer Certificate (TC)..."
                          className="rounded-xl"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addDocument();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addDocument}
                          disabled={!newDocText.trim()}
                          className="rounded-xl shrink-0 gap-1.5"
                        >
                          <Plus size={16} />
                          Add Document
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Panel>
          </TabsContent>
        </Tabs>
      )}
    </>
  );
}
