"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  Loader2,
  GraduationCap,
  Sparkles,
  Phone,
  MessageCircle,
  Copy,
  Check,
  Download,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { submitAdmissionApplication } from "@/lib/admissions";
import { useAdmissionSettings, DEFAULT_ADMISSION } from "@/lib/cms";
import { jsPDF } from "jspdf";

interface OnlineAdmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultClass?: string;
}

const DEFAULT_COURSES = [
  "High School (Integrated Dars)",
  "Higher Secondary (Science)",
  "Higher Secondary (Humanities)",
  "Degree (Undergraduate + Dars)",
  "Doura Facility for Hafiz",
  "General Integrated Dars",
];

export function OnlineAdmissionDialog({
  open,
  onOpenChange,
  defaultClass,
}: OnlineAdmissionDialogProps) {
  const ADMISSION = useAdmissionSettings() ?? DEFAULT_ADMISSION;
  const currentYear = ADMISSION.admissionYear || new Date().getFullYear().toString();

  // Form states
  const [studentName, setStudentName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [classToJoin, setClassToJoin] = useState(defaultClass || DEFAULT_COURSES[0]);
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [place, setPlace] = useState("");
  const [district, setDistrict] = useState("Malappuram");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [downloadingSummary, setDownloadingSummary] = useState(false);

  // Sync whatsapp with phone if whatsapp was blank or matched previous phone
  const handlePhoneChange = (val: string) => {
    setPhone(val);
    if (!whatsapp || whatsapp === phone) {
      setWhatsapp(val);
    }
  };

  const handleReset = () => {
    setStudentName("");
    setFatherName("");
    setClassToJoin(defaultClass || DEFAULT_COURSES[0]);
    setPhone("");
    setWhatsapp("");
    setPlace("");
    setDistrict("Malappuram");
    setAddress("");
    setEmail("");
    setNotes("");
    setSubmittedId(null);
    setCopiedId(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanStudentName = studentName.trim();
    const cleanFatherName = fatherName.trim();
    const cleanPhone = phone.trim();
    const cleanWhatsapp = (whatsapp.trim() || cleanPhone).trim();
    const cleanPlace = place.trim();
    const cleanDistrict = district.trim();
    const cleanAddress = address.trim();

    if (!cleanStudentName) {
      toast.error("Please enter the student's full name.");
      return;
    }
    if (!cleanFatherName) {
      toast.error("Please enter father / guardian name.");
      return;
    }
    if (!cleanPhone || cleanPhone.replace(/\D/g, "").length < 10) {
      toast.error("Please enter a valid 10-digit phone number.");
      return;
    }
    if (!cleanPlace) {
      toast.error("Please enter place / town.");
      return;
    }
    if (!cleanDistrict) {
      toast.error("Please enter district.");
      return;
    }
    if (!cleanAddress) {
      toast.error("Please enter full address.");
      return;
    }

    setSubmitting(true);

    try {
      const result = await submitAdmissionApplication(
        {
          student_name: cleanStudentName,
          father_name: cleanFatherName,
          class_to_join: classToJoin,
          phone: cleanPhone,
          whatsapp: cleanWhatsapp,
          place: cleanPlace,
          district: cleanDistrict,
          address: cleanAddress,
          email: email.trim(),
          notes: notes.trim(),
        },
        currentYear,
      );

      if (result.success) {
        setSubmittedId(result.applicationId);
        toast.success("Application submitted successfully!");
      } else {
        toast.error(result.message || "Failed to submit application.");
      }
    } catch (err: unknown) {
      console.error("Admission submission error:", err);
      toast.error(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while submitting. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyId = () => {
    if (!submittedId) return;
    navigator.clipboard.writeText(submittedId);
    setCopiedId(true);
    toast.success("Application ID copied to clipboard!");
    setTimeout(() => setCopiedId(false), 3000);
  };

  const handleDownloadReceipt = () => {
    if (!submittedId) return;
    setDownloadingSummary(true);
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Header Banner
      doc.setFillColor(15, 30, 20); // Dark Green
      doc.rect(0, 0, 210, 40, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("DARUSUFFA ACADEMY", 105, 16, { align: "center" });

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("MUHYISUNNA INTEGRATED DARS - Vadeesunnah, Kolathur, Malappuram", 105, 24, {
        align: "center",
      });
      doc.text("Official Online Admission Application Acknowledgement", 105, 32, {
        align: "center",
      });

      // Application Info Card
      doc.setFillColor(245, 248, 245);
      doc.roundedRect(15, 50, 180, 25, 3, 3, "F");
      doc.setDrawColor(34, 197, 94);
      doc.roundedRect(15, 50, 180, 25, 3, 3, "D");

      doc.setTextColor(20, 80, 40);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("APPLICATION ID:", 25, 61);
      doc.setFontSize(14);
      doc.text(submittedId, 75, 61);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      doc.text(
        `Submitted On: ${new Date().toLocaleDateString("en-IN")} (Session ${currentYear})`,
        25,
        69,
      );
      doc.text("Status: Application Received", 130, 69);

      // Student & Guardian Details Table
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Applicant Details", 15, 87);

      const items = [
        ["Student Full Name", studentName],
        ["Father / Guardian", fatherName],
        ["Class / Course to Join", classToJoin],
        ["Primary Contact Phone", phone],
        ["WhatsApp Number", whatsapp || phone],
        ["Place / Town", place],
        ["District", district],
        ["Residential Address", address],
        ["Email Address", email || "Not provided"],
      ];

      let currentY = 95;
      items.forEach(([label, value]) => {
        doc.setFillColor(250, 250, 250);
        doc.rect(15, currentY - 5, 65, 9, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(70, 70, 70);
        doc.text(label, 18, currentY + 1);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(20, 20, 20);
        doc.text(String(value), 85, currentY + 1);

        doc.setDrawColor(230, 230, 230);
        doc.line(15, currentY + 4, 195, currentY + 4);
        currentY += 10;
      });

      // Next Steps & Office Contact
      currentY += 8;
      doc.setFillColor(240, 245, 255);
      doc.roundedRect(15, currentY, 180, 36, 3, 3, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(30, 58, 138);
      doc.text("Next Steps for Admission Interaction:", 20, currentY + 8);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(50, 50, 50);
      doc.text(
        "1. Please preserve this Application ID for all future admission correspondence.",
        20,
        currentY + 16,
      );
      doc.text(
        "2. The Darusuffa admissions office will verify details and contact you via Phone/WhatsApp.",
        20,
        currentY + 23,
      );
      doc.text(
        "3. Admissions Desk Helpline: +91 99610 09313 | WhatsApp: +91 70346 49996",
        20,
        currentY + 30,
      );

      // Footer
      doc.setFontSize(8.5);
      doc.setTextColor(140, 140, 140);
      doc.text(
        "Darusuffa Academy - Vadeesunnah, Kolathur PO, Malappuram, Kerala - darusuffa.org",
        105,
        285,
        {
          align: "center",
        },
      );

      doc.save(`Darusuffa_Admission_${submittedId}.pdf`);
      toast.success("Admission receipt downloaded!");
    } catch (err) {
      console.error("PDF receipt error:", err);
      toast.error("Failed to generate PDF receipt.");
    } finally {
      setDownloadingSummary(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleReset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 rounded-3xl border-border bg-card">
        {/* Header */}
        <div className="bg-primary/10 border-b border-border/80 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <GraduationCap size={22} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                <Sparkles size={13} />
                <span>Session {currentYear}</span>
              </div>
              <DialogTitle className="font-display text-xl font-bold text-foreground">
                Apply for Admission Online
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Submit your preliminary application to Darusuffa Academy directly from your device.
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {submittedId ? (
            /* SUCCESS STATE */
            <div className="space-y-6 text-center py-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                <CheckCircle2 size={36} />
              </div>

              <div className="space-y-2">
                <h3 className="font-display text-2xl font-bold text-foreground">
                  Application Received!
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                  Your admission application has been registered with Darusuffa Academy. Our
                  admissions coordinator will reach out to you shortly.
                </p>
              </div>

              {/* Application ID Card */}
              <div className="mx-auto max-w-md rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5 p-5 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Your Official Application Number
                </span>
                <div className="flex items-center justify-center gap-2">
                  <span className="font-mono text-2xl font-black text-foreground tracking-wide">
                    {submittedId}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Copy Application ID"
                  >
                    {copiedId ? (
                      <Check size={18} className="text-emerald-600" />
                    ) : (
                      <Copy size={18} />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Please keep this number safe for future reference and campus interaction.
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Button
                  type="button"
                  onClick={handleDownloadReceipt}
                  disabled={downloadingSummary}
                  className="rounded-full gap-2 bg-primary px-6"
                >
                  {downloadingSummary ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Download size={16} />
                  )}
                  <span>Download Application Receipt (PDF)</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    handleReset();
                    onOpenChange(false);
                  }}
                  className="rounded-full px-6"
                >
                  Done &amp; Close
                </Button>
              </div>
            </div>
          ) : (
            /* APPLICATION FORM */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Student Name */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="stu-name" className="text-xs font-semibold">
                    Student Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="stu-name"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Enter student's official name"
                    required
                  />
                </div>

                {/* Father / Guardian Name */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="father-name" className="text-xs font-semibold">
                    Father / Guardian Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="father-name"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    placeholder="Father / Guardian full name"
                    required
                  />
                </div>

                {/* Class to Join */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="class-join" className="text-xs font-semibold">
                    Course / Class to Join <span className="text-destructive">*</span>
                  </Label>
                  <Select value={classToJoin} onValueChange={setClassToJoin}>
                    <SelectTrigger id="class-join">
                      <SelectValue placeholder="Select course/class" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEFAULT_COURSES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Primary Phone */}
                <div className="space-y-1.5">
                  <Label htmlFor="phone-num" className="text-xs font-semibold">
                    Contact Phone Number <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Phone
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      id="phone-num"
                      type="tel"
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="+91 98471 00000"
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="space-y-1.5">
                  <Label htmlFor="wa-num" className="text-xs font-semibold">
                    WhatsApp Number <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <MessageCircle
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      id="wa-num"
                      type="tel"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="+91 98471 00000"
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                {/* Place / Town */}
                <div className="space-y-1.5">
                  <Label htmlFor="place" className="text-xs font-semibold">
                    Place / Town / Village <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="place"
                    value={place}
                    onChange={(e) => setPlace(e.target.value)}
                    placeholder="e.g. Kolathur, Vengara, Kondotty"
                    required
                  />
                </div>

                {/* District */}
                <div className="space-y-1.5">
                  <Label htmlFor="district" className="text-xs font-semibold">
                    District <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="district"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="e.g. Malappuram, Kozhikode, Palakkad"
                    required
                  />
                </div>

                {/* Full Address */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="address" className="text-xs font-semibold">
                    Full Residential Address <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="address"
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House name, street, post office, PIN code"
                    required
                  />
                </div>

                {/* Email (Optional) */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold">
                    Email Address{" "}
                    <span className="text-muted-foreground font-normal">(Optional)</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="applicant@example.com"
                  />
                </div>

                {/* Additional notes / Remarks */}
                <div className="space-y-1.5">
                  <Label htmlFor="notes" className="text-xs font-semibold">
                    Previous School / Remarks{" "}
                    <span className="text-muted-foreground font-normal">(Optional)</span>
                  </Label>
                  <Input
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Previous school or special remarks"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-border/80 bg-muted/30 p-3 text-xs text-muted-foreground flex items-start gap-2.5">
                <AlertCircle size={15} className="mt-0.5 text-primary shrink-0" />
                <span>
                  After submitting, our admissions office will review your application and contact
                  you regarding document verification and campus visit.
                </span>
              </div>

              <DialogFooter className="pt-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={submitting}
                  className="rounded-full"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-primary px-8 font-semibold gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Submitting Application...</span>
                    </>
                  ) : (
                    <span>Submit Application</span>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
