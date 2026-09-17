"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Building2,
  MapPin,
  Phone,
  Mail,
  Award,
  Check,
} from "lucide-react";
import { Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AdmissionSettings } from "@/lib/cms";

interface Props {
  form: AdmissionSettings;
  set: (patch: Partial<AdmissionSettings>) => void;
}

export function AdmissionInformationTab({ form, set }: Props) {
  const [newFacilityText, setNewFacilityText] = useState("");

  const facilities = form.facilities || [];

  const handleAddFacility = () => {
    if (!newFacilityText.trim()) return;
    set({ facilities: [...facilities, newFacilityText.trim()] });
    setNewFacilityText("");
  };

  const handleUpdateFacility = (index: number, val: string) => {
    const next = [...facilities];
    next[index] = val;
    set({ facilities: next });
  };

  const handleRemoveFacility = (index: number) => {
    set({ facilities: facilities.filter((_, i) => i !== index) });
  };

  const handleMoveFacility = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= facilities.length) return;
    const next = [...facilities];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    set({ facilities: next });
  };

  return (
    <div className="space-y-6">
      {/* Institution Information */}
      <Panel title="Institution Information">
        <p className="text-xs text-muted-foreground mb-4">
          This institution branding appears on the public admission page header, application
          options, and the downloadable official Admission PDF.
        </p>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="institutionName" className="flex items-center gap-1.5 font-medium">
              <Building2 size={14} className="text-primary" />
              Institution Name
            </Label>
            <Input
              id="institutionName"
              value={form.institutionName || ""}
              onChange={(e) => set({ institutionName: e.target.value })}
              placeholder="e.g. DARUSUFFA ACADEMY"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="institutionSubtitle" className="flex items-center gap-1.5 font-medium">
              <Award size={14} className="text-primary" />
              Dars / Institution Subtitle
            </Label>
            <Input
              id="institutionSubtitle"
              value={form.institutionSubtitle || ""}
              onChange={(e) => set({ institutionSubtitle: e.target.value })}
              placeholder="e.g. MUHYISUNNA INTEGRATED DARS"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="institutionLocation" className="flex items-center gap-1.5 font-medium">
              <MapPin size={14} className="text-primary" />
              Location &amp; Address
            </Label>
            <Input
              id="institutionLocation"
              value={form.institutionLocation || ""}
              onChange={(e) => set({ institutionLocation: e.target.value })}
              placeholder="e.g. Vadeesunna, Kolathur, Malappuram"
              className="rounded-xl"
            />
          </div>
        </div>
      </Panel>

      {/* Form & Session Information */}
      <Panel title="Form &amp; Session Information">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="formTitle" className="font-medium">
              Admission Form Title
            </Label>
            <Input
              id="formTitle"
              value={form.formTitle || ""}
              onChange={(e) => set({ formTitle: e.target.value })}
              placeholder="e.g. ADMISSION FORM-2025"
              className="rounded-xl"
            />
            <p className="text-xs text-muted-foreground">
              Displayed as banner title on the downloadable PDF and public application form.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="admissionYear" className="font-medium">
              Admission Year / Session
            </Label>
            <Input
              id="admissionYear"
              value={form.admissionYear || ""}
              onChange={(e) => set({ admissionYear: e.target.value })}
              placeholder="e.g. 2025 or 2025-26"
              className="rounded-xl"
            />
            <p className="text-xs text-muted-foreground">
              Used in the filename: Darusuffa_Academy_Admission_Form_[YEAR].pdf
            </p>
          </div>
        </div>
      </Panel>

      {/* Official Admission Contact Info */}
      <Panel title="Admission Office Contact">
        <p className="text-xs text-muted-foreground mb-4">
          Contact details displayed in the admission options, public page callouts, and PDF header.
        </p>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contactPhone" className="flex items-center gap-1.5 font-medium">
              <Phone size={14} className="text-primary" />
              Contact Phone Number
            </Label>
            <Input
              id="contactPhone"
              value={form.contactPhone || ""}
              onChange={(e) => set({ contactPhone: e.target.value })}
              placeholder="e.g. +91 99610 09313"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactEmail" className="flex items-center gap-1.5 font-medium">
              <Mail size={14} className="text-primary" />
              Contact Email Address
            </Label>
            <Input
              id="contactEmail"
              type="email"
              value={form.contactEmail || ""}
              onChange={(e) => set({ contactEmail: e.target.value })}
              placeholder="e.g. darusuffaacademymsa@gmail.com"
              className="rounded-xl"
            />
          </div>
        </div>
      </Panel>

      {/* Facilities & Offerings List */}
      <Panel title="Facilities &amp; Campus Highlights">
        <p className="text-xs text-muted-foreground mb-4">
          Manage the facility bullet points shown on the public admission page and embedded into the
          official downloadable admission PDF. You can edit existing items, add new ones in English
          or Malayalam, reorder, or delete them.
        </p>

        {/* Add new facility input */}
        <div className="flex gap-2 mb-5">
          <Input
            value={newFacilityText}
            onChange={(e) => setNewFacilityText(e.target.value)}
            placeholder="Add new facility / സൗകര്യം (e.g. Special training in Hifz, computer and library)..."
            className="rounded-xl"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddFacility();
              }
            }}
          />
          <Button
            type="button"
            onClick={handleAddFacility}
            disabled={!newFacilityText.trim()}
            className="rounded-xl shrink-0 gap-1.5"
          >
            <Plus size={16} />
            Add Facility
          </Button>
        </div>

        {/* Facility items list */}
        {facilities.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No facilities added yet. Click &quot;Add Facility&quot; above to list key features.
          </div>
        ) : (
          <div className="space-y-2.5">
            {facilities.map((fac, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-3 shadow-xs"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {idx + 1}
                </span>

                <Input
                  value={fac}
                  onChange={(e) => handleUpdateFacility(idx, e.target.value)}
                  className="h-9 rounded-lg border-muted font-sans text-sm flex-1"
                />

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => handleMoveFacility(idx, "up")}
                    disabled={idx === 0}
                    title="Move up"
                  >
                    <ArrowUp size={14} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => handleMoveFacility(idx, "down")}
                    disabled={idx === facilities.length - 1}
                    title="Move down"
                  >
                    <ArrowDown size={14} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemoveFacility(idx)}
                    title="Delete facility"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
