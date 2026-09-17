"use client";

import { useRef, useState } from "react";
import {
  Download,
  Upload,
  FileText,
  Trash2,
  ExternalLink,
  Sparkles,
  FileCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ConfirmDeleteDialog } from "@/components/admin/ConfirmDeleteDialog";
import { uploadMedia, deleteStoredMedia, type AdmissionSettings } from "@/lib/cms";
import { generateAdmissionPdf } from "@/lib/admissionPdf";
import { toast } from "sonner";

interface Props {
  form: AdmissionSettings;
  set: (patch: Partial<AdmissionSettings>) => void;
}

export function AdmissionDownloadFormTab({ form, set }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingForm, setUploadingForm] = useState(false);
  const [generatingTestPdf, setGeneratingTestPdf] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [isRemovingFile, setIsRemovingFile] = useState(false);

  const downloadSource = form.downloadSource || "generated";

  // Handle file upload to Supabase storage
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      toast.error("File is too large. Maximum size allowed is 25MB.");
      return;
    }

    setUploadingForm(true);

    try {
      const publicUrl = await uploadMedia(file, "admissions");

      let sizeLabel = "";
      if (file.size < 1024 * 1024) {
        sizeLabel = `${(file.size / 1024).toFixed(1)} KB`;
      } else {
        sizeLabel = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
      }

      set({
        formDownloadUrl: publicUrl,
        formFileName: file.name,
        formFileSize: sizeLabel,
        downloadSource: "uploaded",
        showDownloadForm: true,
      });

      toast.success("Admission form uploaded successfully! Don't forget to save changes.");
    } catch (err) {
      console.error("[Admin Admission] Upload failed:", err);
      toast.error("Failed to upload the admission form file. Please try again.");
    } finally {
      setUploadingForm(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Remove uploaded file
  const handleRemoveForm = async () => {
    setIsRemovingFile(true);
    const currentUrl = form.formDownloadUrl;

    try {
      if (currentUrl && currentUrl.includes("/admissions/")) {
        await deleteStoredMedia(currentUrl);
      }

      set({
        formDownloadUrl: "",
        formFileName: "",
        formFileSize: "",
        downloadSource: "generated",
      });

      setShowRemoveConfirm(false);
      toast.success("Uploaded file removed. System switched to Dynamic Auto-Generated PDF.");
    } catch (err) {
      console.error("[Admin Admission] Remove error:", err);
      toast.error("Failed to remove stored admission form.");
    } finally {
      setIsRemovingFile(false);
    }
  };

  // Test dynamic PDF generation
  const handleTestDownloadPdf = async () => {
    setGeneratingTestPdf(true);
    try {
      await generateAdmissionPdf(form);
      toast.success("Admission form PDF generated and downloaded successfully!");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setGeneratingTestPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Primary Toggle */}
      <Panel title="Admission Form Download Control">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-muted/40 p-4">
          <div className="space-y-1">
            <Label htmlFor="toggle-download" className="text-base font-semibold cursor-pointer">
              Enable Download Admission Form on Public Page
            </Label>
            <p className="text-xs sm:text-sm text-muted-foreground">
              When enabled, a prominent &quot;Download Admission Form&quot; button appears on the
              public Admission page. When disabled, the button is completely hidden.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                form.showDownloadForm
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {form.showDownloadForm ? "Publicly Visible" : "Hidden"}
            </span>
            <Switch
              id="toggle-download"
              checked={Boolean(form.showDownloadForm)}
              onCheckedChange={(checked) => set({ showDownloadForm: checked })}
            />
          </div>
        </div>

        {/* Source Mode: Generated vs Uploaded */}
        <div className="mt-6 space-y-4">
          <Label className="text-sm font-semibold">Choose Download Mechanism:</Label>

          <RadioGroup
            value={downloadSource}
            onValueChange={(val) => set({ downloadSource: val as "generated" | "uploaded" })}
            className="grid gap-4 sm:grid-cols-2"
          >
            {/* Option A: Dynamic Auto-Generated */}
            <label
              htmlFor="mode-generated"
              className={`relative flex flex-col justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                downloadSource === "generated"
                  ? "border-primary bg-primary/5 shadow-xs"
                  : "border-border bg-card hover:bg-muted/40"
              }`}
            >
              <div className="flex items-start gap-3">
                <RadioGroupItem value="generated" id="mode-generated" className="mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                    <Sparkles size={15} className="text-primary" />
                    Dynamic PDF Generator (Recommended)
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Automatically generates a printable PDF containing the latest institution info,
                    facilities, and configured application fields. Full Malayalam Unicode support
                    embedded.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTestDownloadPdf}
                  disabled={generatingTestPdf}
                  className="w-full text-xs rounded-lg gap-1.5"
                >
                  {generatingTestPdf ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Generating Test PDF...
                    </>
                  ) : (
                    <>
                      <Download size={13} />
                      Test &amp; Preview Generated PDF
                    </>
                  )}
                </Button>
              </div>
            </label>

            {/* Option B: Custom Uploaded */}
            <label
              htmlFor="mode-uploaded"
              className={`relative flex flex-col justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                downloadSource === "uploaded"
                  ? "border-primary bg-primary/5 shadow-xs"
                  : "border-border bg-card hover:bg-muted/40"
              }`}
            >
              <div className="flex items-start gap-3">
                <RadioGroupItem value="uploaded" id="mode-uploaded" className="mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                    <FileCheck size={15} className="text-primary" />
                    Custom Uploaded File
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Deliver a custom uploaded PDF or scanned admission document file stored on
                    Supabase storage.
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border/60 text-xs text-muted-foreground">
                {form.formDownloadUrl ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    ✓ Custom file active: {form.formFileName || "File uploaded"}
                  </span>
                ) : (
                  <span>No custom file uploaded yet (see uploader below)</span>
                )}
              </div>
            </label>
          </RadioGroup>
        </div>
      </Panel>

      {/* Upload Manual File Section */}
      <Panel title="Custom File Upload &amp; Management">
        <p className="text-xs text-muted-foreground mb-4">
          Upload an official admission form file (PDF, DOC, DOCX up to 25MB) to serve when
          &quot;Custom Uploaded File&quot; mode is active.
        </p>

        {form.formDownloadUrl ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                <FileText size={20} />
              </div>
              <div className="space-y-0.5">
                <div className="font-semibold text-sm text-foreground">
                  {form.formFileName || "Official Admission Form.pdf"}
                </div>
                {form.formFileSize && (
                  <div className="text-xs text-muted-foreground">{form.formFileSize}</div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={form.formDownloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
              >
                <ExternalLink size={13} />
                Preview File
              </a>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs rounded-lg"
              >
                Replace
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10 text-xs rounded-lg"
                onClick={() => setShowRemoveConfirm(true)}
              >
                <Trash2 size={13} className="mr-1" />
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/40 transition-colors"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
              <Upload size={22} />
            </div>
            <div className="font-medium text-sm text-foreground">
              Click to upload custom admission form file
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              PDF, Word Document (DOC, DOCX) up to 25MB
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileUpload}
          className="hidden"
        />
      </Panel>

      {/* Button & Copy Customization */}
      <Panel title="Button &amp; Description Copy">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="downloadButtonText" className="font-medium">
              Download Button Text
            </Label>
            <Input
              id="downloadButtonText"
              value={form.downloadButtonText || ""}
              onChange={(e) => set({ downloadButtonText: e.target.value })}
              placeholder="e.g. Download Admission Form"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="downloadDescription" className="font-medium">
              Download Callout Description
            </Label>
            <Textarea
              id="downloadDescription"
              value={form.downloadDescription || ""}
              onChange={(e) => set({ downloadDescription: e.target.value })}
              placeholder="e.g. Prefer to fill out the form manually? Download and print our official application form..."
              rows={2}
              className="rounded-xl"
            />
          </div>
        </div>
      </Panel>

      {/* Remove Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={showRemoveConfirm}
        onOpenChange={setShowRemoveConfirm}
        title="Remove Custom Admission Form File"
        description="Are you sure you want to remove the uploaded admission form file? The download system will automatically switch back to the Dynamic Auto-Generated PDF."
        onConfirm={handleRemoveForm}
      />
    </div>
  );
}
