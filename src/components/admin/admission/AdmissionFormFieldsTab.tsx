"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Asterisk,
  CheckCircle,
  HelpCircle,
  RotateCcw,
} from "lucide-react";
import { Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DEFAULT_ADMISSION_FIELDS,
  type AdmissionSettings,
  type AdmissionFormField,
  type AdmissionFormFieldType,
} from "@/lib/cms";
import { toast } from "sonner";

interface Props {
  form: AdmissionSettings;
  set: (patch: Partial<AdmissionSettings>) => void;
}

export function AdmissionFormFieldsTab({ form, set }: Props) {
  const fields =
    form.formFields && form.formFields.length > 0 ? form.formFields : DEFAULT_ADMISSION_FIELDS;

  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<AdmissionFormFieldType>("text");
  const [newRequired, setNewRequired] = useState(false);
  const [newOptionsStr, setNewOptionsStr] = useState("");

  const handleAddField = () => {
    if (!newLabel.trim()) return;

    const rawId =
      "field_" +
      newLabel
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_")
        .slice(0, 30) +
      "_" +
      Date.now();
    const options =
      newType === "select"
        ? newOptionsStr
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;

    const newField: AdmissionFormField = {
      id: rawId,
      name: rawId,
      label: newLabel.trim(),
      type: newType,
      required: newRequired,
      options: options && options.length > 0 ? options : ["Option 1", "Option 2"],
      visible: true,
      order: fields.length + 1,
    };

    set({ formFields: [...fields, newField] });
    setNewLabel("");
    setNewOptionsStr("");
    setNewRequired(false);
    toast.success(`Field "${newField.label}" added`);
  };

  const handleUpdateField = (index: number, patch: Partial<AdmissionFormField>) => {
    const next = [...fields];
    next[index] = { ...next[index], ...patch };
    set({ formFields: next });
  };

  const handleRemoveField = (index: number) => {
    const target = fields[index];
    set({ formFields: fields.filter((_, i) => i !== index) });
    toast.info(`Field "${target.label}" removed`);
  };

  const handleMoveField = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= fields.length) return;
    const next = [...fields];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    // re-index order
    const ordered = next.map((f, i) => ({ ...f, order: i + 1 }));
    set({ formFields: ordered });
  };

  const handleResetToDefault = () => {
    set({ formFields: DEFAULT_ADMISSION_FIELDS });
    toast.success("Form fields reset to standard default fields");
  };

  return (
    <div className="space-y-6">
      <Panel
        title="Application Form Fields Configuration"
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetToDefault}
            className="rounded-xl gap-1.5 text-xs"
          >
            <RotateCcw size={13} />
            Reset to Standard Fields
          </Button>
        }
      >
        <p className="text-xs text-muted-foreground mb-6">
          Configure the form fields presented to applicants on the public Admission page and
          formatted into the downloadable admission PDF. You can toggle field visibility, mark
          fields as required or optional, reorder fields, or customize selection choices.
        </p>

        {/* Existing Fields List */}
        <div className="space-y-3">
          {fields.map((field, idx) => {
            return (
              <div
                key={field.id || idx}
                className={`rounded-xl border transition-all p-4 ${
                  field.visible !== false
                    ? "border-border bg-card shadow-xs"
                    : "border-dashed border-border/70 bg-muted/30 opacity-70"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {idx + 1}
                    </span>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-sm font-sans">
                          {field.label}
                        </span>
                        {field.required && (
                          <span className="inline-flex items-center rounded-md bg-rose-100 dark:bg-rose-950 px-1.5 py-0.5 text-[10px] font-medium text-rose-700 dark:text-rose-300">
                            Required
                          </span>
                        )}
                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-mono text-muted-foreground capitalize">
                          {field.type}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Field Key:{" "}
                        <code className="font-mono text-[11px]">{field.name || field.id}</code>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Toggles */}
                  <div className="flex items-center flex-wrap gap-3">
                    {/* Required toggle */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Label htmlFor={`req-${field.id}`} className="text-xs cursor-pointer">
                        Required
                      </Label>
                      <Switch
                        id={`req-${field.id}`}
                        checked={field.required}
                        onCheckedChange={(checked) => handleUpdateField(idx, { required: checked })}
                      />
                    </div>

                    {/* Visibility toggle */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Label htmlFor={`vis-${field.id}`} className="text-xs cursor-pointer">
                        {field.visible !== false ? "Visible" : "Hidden"}
                      </Label>
                      <Switch
                        id={`vis-${field.id}`}
                        checked={field.visible !== false}
                        onCheckedChange={(checked) => handleUpdateField(idx, { visible: checked })}
                      />
                    </div>

                    {/* Reordering */}
                    <div className="flex items-center gap-1 border-l border-border pl-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleMoveField(idx, "up")}
                        disabled={idx === 0}
                        title="Move up"
                      >
                        <ArrowUp size={13} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleMoveField(idx, "down")}
                        disabled={idx === fields.length - 1}
                        title="Move down"
                      >
                        <ArrowDown size={13} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveField(idx)}
                        title="Delete field"
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Editable Options for Select fields */}
                {field.type === "select" && (
                  <div className="mt-3 pt-3 border-t border-border/60">
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      Options (comma-separated):
                    </Label>
                    <Input
                      value={(field.options || []).join(", ")}
                      onChange={(e) =>
                        handleUpdateField(idx, {
                          options: e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder="e.g. 8th Class, 9th Class, Plus One"
                      className="h-8 text-xs rounded-lg font-sans"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add New Custom Field Form */}
        <div className="mt-8 rounded-xl border border-border bg-muted/30 p-5 space-y-4">
          <div className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
            <Plus size={16} className="text-primary" />
            Add a New Field to the Application Form
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-1">
              <Label className="text-xs font-medium">Field Label / Question</Label>
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g. Previous School or Blood Group"
                className="rounded-xl h-9 text-sm"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-1">
              <Label className="text-xs font-medium">Input Type</Label>
              <Select
                value={newType}
                onValueChange={(val) => setNewType(val as AdmissionFormFieldType)}
              >
                <SelectTrigger className="rounded-xl h-9 text-sm bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Single-line Text</SelectItem>
                  <SelectItem value="textarea">Multi-line Textarea</SelectItem>
                  <SelectItem value="phone">Phone Number</SelectItem>
                  <SelectItem value="select">Dropdown / Selection</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:col-span-1 flex flex-col justify-end">
              <div className="flex items-center gap-2 pb-1.5">
                <Switch
                  id="new-req-toggle"
                  checked={newRequired}
                  onCheckedChange={setNewRequired}
                />
                <Label htmlFor="new-req-toggle" className="text-xs cursor-pointer font-medium">
                  Mark as Required
                </Label>
              </div>
            </div>

            {newType === "select" && (
              <div className="space-y-1.5 sm:col-span-3">
                <Label className="text-xs font-medium">Dropdown Options (comma-separated)</Label>
                <Input
                  value={newOptionsStr}
                  onChange={(e) => setNewOptionsStr(e.target.value)}
                  placeholder="e.g. Option A, Option B, Option C"
                  className="rounded-xl h-9 text-sm"
                />
              </div>
            )}
          </div>

          <Button
            type="button"
            onClick={handleAddField}
            disabled={!newLabel.trim()}
            className="rounded-xl gap-1.5 text-xs h-9 px-4"
          >
            <Plus size={14} />
            Add Field
          </Button>
        </div>
      </Panel>
    </div>
  );
}
