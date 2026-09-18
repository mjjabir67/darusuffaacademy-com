"use client";

import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle,
  Send,
  Download,
  FileText,
  Check,
  Info,
  Phone,
  Mail,
  MessageCircle,
  Building2,
  MapPin,
  Sparkles,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import {
  useContactSettings,
  useAdmissionSettings,
  DEFAULT_ADMISSION,
  DEFAULT_FACILITIES,
  DEFAULT_ADMISSION_FIELDS,
  type AdmissionFormField,
} from "@/lib/cms";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateAdmissionPdf } from "@/lib/admissionPdf";
import students from "@/assets/students.jpg";

export const Route = createFileRoute("/admission")({
  head: () => ({
    meta: [
      { title: "Admission | Darusuffa Academy, Kolathur" },
      {
        name: "description",
        content:
          "Admission to Darusuffa Academy: integrated Dars with High School, Higher Secondary and Degree studies at Vadeesunnah, Kolathur. Apply online or download the official form.",
      },
      { property: "og:title", content: "Admission | Darusuffa Academy" },
      {
        property: "og:description",
        content:
          "Join a curriculum that combines modern education with Islamic values in a serene campus at Vadeesunnah, Kolathur.",
      },
    ],
  }),
  component: Admission,
});

type ApplicationFormValues = {
  class_to_join: string;
  student_name: string;
  father_name: string;
  address: string;
  place: string;
  district: string;
  phone: string;
  whatsapp: string;
  [key: string]: string;
};

const INITIAL_FORM_VALUES: ApplicationFormValues = {
  class_to_join: "",
  student_name: "",
  father_name: "",
  address: "",
  place: "",
  district: "",
  phone: "",
  whatsapp: "",
};

function Admission() {
  const CONTACT = useContactSettings();
  const ADMISSION = useAdmissionSettings() ?? DEFAULT_ADMISSION;

  // Online Application Form State
  const [appValues, setAppValues] = useState<ApplicationFormValues>(INITIAL_FORM_VALUES);
  const [appErrors, setAppErrors] = useState<Record<string, string>>({});
  const [appSubmitting, setAppSubmitting] = useState(false);
  const [appSubmitted, setAppSubmitted] = useState(false);

  // PDF download loading state
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const institutionName = ADMISSION.institutionName || "DARUSUFFA ACADEMY";
  const institutionSubtitle = ADMISSION.institutionSubtitle || "MUHYISUNNA INTEGRATED DARS";
  const institutionLocation = ADMISSION.institutionLocation || "Vadeesunna, Kolathur, Malappuram";
  const contactPhone =
    ADMISSION.contactPhone ||
    ADMISSION.phoneOverride?.trim() ||
    CONTACT.phones[0] ||
    "+91 99610 09313";
  const contactEmail =
    ADMISSION.contactEmail || CONTACT.emails[0] || "darusuffaacademymsa@gmail.com";
  const whatsappNumber =
    ADMISSION.whatsappOverride?.trim() || CONTACT.whatsapp || "+91 70346 49996";

  const facilities =
    ADMISSION.facilities && ADMISSION.facilities.length > 0
      ? ADMISSION.facilities
      : DEFAULT_FACILITIES;

  const formFields =
    ADMISSION.formFields && ADMISSION.formFields.length > 0
      ? ADMISSION.formFields.filter((f) => f.visible !== false)
      : DEFAULT_ADMISSION_FIELDS;

  const showDownload = ADMISSION.showDownloadForm !== false;

  // Handle PDF Download
  const handleDownloadForm = async () => {
    if (ADMISSION.downloadSource === "uploaded" && ADMISSION.formDownloadUrl) {
      window.open(ADMISSION.formDownloadUrl, "_blank");
      return;
    }

    setDownloadingPdf(true);
    try {
      await generateAdmissionPdf(ADMISSION);
      toast.success("Official Admission Form PDF downloaded successfully!");
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error("Failed to generate admission form PDF. Please try again or contact the office.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Field change handler
  const handleFieldChange = (fieldId: string, val: string) => {
    setAppValues((prev) => ({ ...prev, [fieldId]: val }));
    if (appErrors[fieldId]) {
      setAppErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  // Validate Application Form
  const validateApplication = (): boolean => {
    const errs: Record<string, string> = {};

    // 1. Class to Join
    if (!appValues.class_to_join?.trim()) {
      errs.class_to_join = "Please select the class to join";
    }

    // 2. Student Name
    if (!appValues.student_name?.trim()) {
      errs.student_name = "Student name cannot be empty";
    } else if (appValues.student_name.trim().length < 2) {
      errs.student_name = "Please enter a valid student name";
    }

    // 3. Father Name
    if (!appValues.father_name?.trim()) {
      errs.father_name = "Father name cannot be empty";
    } else if (appValues.father_name.trim().length < 2) {
      errs.father_name = "Please enter a valid father name";
    }

    // 4. Address
    if (!appValues.address?.trim()) {
      errs.address = "Address cannot be empty";
    }

    // 5. Place
    if (!appValues.place?.trim()) {
      errs.place = "Place cannot be empty";
    }

    // 6. District
    if (!appValues.district?.trim()) {
      errs.district = "District cannot be empty";
    }

    // 7. Phone Number
    const phoneClean = appValues.phone?.replace(/[\s\-()]/g, "") || "";
    if (!phoneClean) {
      errs.phone = "Phone number is required";
    } else if (phoneClean.length < 8) {
      errs.phone = "Please enter a valid phone number (at least 8-10 digits)";
    }

    // 8. WhatsApp Number
    const waClean = appValues.whatsapp?.replace(/[\s\-()]/g, "") || "";
    if (!waClean) {
      errs.whatsapp = "WhatsApp number is required";
    } else if (waClean.length < 8) {
      errs.whatsapp = "Please enter a valid WhatsApp number";
    }

    // Dynamic custom fields validation
    formFields.forEach((field) => {
      const key = field.name || field.id;
      if (
        field.required &&
        ![
          "class_to_join",
          "student_name",
          "father_name",
          "address",
          "place",
          "district",
          "phone",
          "whatsapp",
        ].includes(key)
      ) {
        if (!appValues[key]?.trim()) {
          errs[key] = `${field.label} is required`;
        }
      }
    });

    setAppErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit Application Form
  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateApplication()) {
      toast.error("Please fill in all required fields correctly before submitting.");
      return;
    }

    setAppSubmitting(true);

    try {
      // Split base vs custom fields
      const {
        class_to_join,
        student_name,
        father_name,
        address,
        place,
        district,
        phone,
        whatsapp,
        ...customRest
      } = appValues;

      // 1. Submit to API endpoint
      const res = await fetch("/api/admissions/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_name: student_name.trim(),
          father_name: father_name.trim(),
          class_to_join: class_to_join.trim(),
          phone: phone.trim(),
          phone_number: phone.trim(),
          whatsapp: whatsapp.trim(),
          whatsapp_number: whatsapp.trim(),
          address: address.trim(),
          place: place.trim(),
          district: district.trim(),
          custom_fields: customRest,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(
          errorData?.message || "Failed to submit application. Please check details and try again.",
        );
      }

      const resData = await res.json();
      if (!resData.success) {
        throw new Error(resData.message || "Failed to submit application.");
      }

      setAppSubmitted(true);
      toast.success(
        "Application submitted successfully. Your application has been received by Darusuffa Academy.",
      );
    } catch (err: unknown) {
      console.error("Submission failed:", err);
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to submit application. Please check your connection and try again.",
      );
    } finally {
      setAppSubmitting(false);
    }
  };

  return (
    <PageShell
      eyebrow={ADMISSION.eyebrow || "Admission Information & Applications"}
      title={ADMISSION.title || "Admission"}
      intro={
        ADMISSION.intro ||
        "We welcome students who aspire to gain both academic excellence and moral grounding through a unique curriculum that combines modern education with Islamic values."
      }
    >
      {/* 1. TOP INSTITUTIONAL HEADER & ADMISSION INFORMATION */}
      <section className="mx-auto max-w-6xl px-5 pt-8 pb-12">
        <div className="rounded-3xl border border-primary/20 bg-gradient-to-b from-primary/5 via-background to-background p-6 sm:p-10 shadow-sm text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold tracking-wider uppercase text-primary mb-3">
            <Sparkles size={13} />
            ADMISSION {ADMISSION.admissionYear ? `— ${ADMISSION.admissionYear}` : ""}
          </div>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
            {institutionName}
          </h1>

          <div className="mt-2 font-display text-base sm:text-xl font-semibold text-primary">
            {institutionSubtitle}
          </div>

          <div className="mt-2 flex items-center justify-center gap-1.5 text-xs sm:text-sm text-muted-foreground font-medium">
            <MapPin size={14} className="text-primary" />
            <span>{institutionLocation}</span>
          </div>

          <p className="mx-auto mt-6 max-w-3xl text-sm sm:text-base leading-relaxed text-muted-foreground">
            {ADMISSION.overviewText ||
              "Our campus, located in a serene and spiritually enriching environment, offers the perfect setting for holistic development. Interested candidates are encouraged to apply online or download the official application form for direct campus submission."}
          </p>

          {/* APPLICATION OPTIONS */}
          <div className="mt-8 pt-6 border-t border-border/80 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <a
              href="#apply-online"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 font-display text-sm sm:text-base font-semibold text-primary-foreground shadow-md hover:opacity-95 transition-all active:scale-[0.98]"
            >
              Apply Online
              <ArrowRight size={17} />
            </a>

            {showDownload && (
              <Button
                type="button"
                variant="outline"
                onClick={handleDownloadForm}
                disabled={downloadingPdf}
                className="inline-flex items-center gap-2 rounded-full border-primary/40 bg-background px-6 py-3.5 font-display text-sm sm:text-base font-semibold text-primary hover:bg-primary/10 shadow-xs transition-all h-auto"
              >
                {downloadingPdf ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    {ADMISSION.downloadButtonText || "Download Admission Form"}
                  </>
                )}
              </Button>
            )}

            <a
              href={`tel:${contactPhone.replace(/\s/g, "")}`}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-3 font-display text-xs sm:text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Phone size={14} className="text-primary" />
              {ADMISSION.callButtonText || "Call Office"}
            </a>

            <a
              href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/40 px-5 py-3 font-display text-xs sm:text-sm font-medium text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
            >
              <MessageCircle size={14} />
              {ADMISSION.whatsappButtonText || "Apply on WhatsApp"}
            </a>
          </div>

          {/* Contact Us Details */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-muted-foreground pt-4 border-t border-border/40">
            <a
              href={`tel:${contactPhone.replace(/\s/g, "")}`}
              className="flex items-center gap-1.5 hover:text-primary transition-colors"
            >
              <Phone size={14} className="text-primary" />
              <span>
                Phone: <strong className="text-foreground">{contactPhone}</strong>
              </span>
            </a>
            <span className="hidden sm:inline text-border">•</span>
            <a
              href={`mailto:${contactEmail}`}
              className="flex items-center gap-1.5 hover:text-primary transition-colors"
            >
              <Mail size={14} className="text-primary" />
              <span>
                Email: <strong className="text-foreground">{contactEmail}</strong>
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* 2. FACILITIES & CAMPUS HIGHLIGHTS */}
      <section className="mx-auto max-w-6xl px-5 py-8">
        <div className="card-soft p-6 sm:p-10 border border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <span className="text-xs uppercase font-semibold tracking-wider text-primary">
                Campus Highlights
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mt-1">
                Facilities &amp; Offerings
              </h2>
            </div>
            <span className="text-xs font-mono text-muted-foreground bg-muted px-3 py-1 rounded-full w-fit">
              Darusuffa Academy
            </span>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {facilities.map((facility, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card/60 p-4 shadow-2xs hover:border-primary/40 transition-colors"
              >
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Check size={14} />
                </div>
                <p className="text-sm font-medium text-foreground leading-relaxed">{facility}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. VISUAL OVERVIEW & IMAGE */}
      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-2 items-center">
        <div className="space-y-5">
          <span className="text-xs uppercase font-semibold tracking-wider text-primary">
            Holistic Growth
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            {ADMISSION.card1Title || "Integrated Education with Purpose"}
          </h2>
          <p className="leading-relaxed text-muted-foreground text-sm sm:text-base">
            {ADMISSION.card1Description ||
              "Our institution nurtures students who are not only academically competent but also morally upright and spiritually guided. A well-structured curriculum integrates modern subjects with Islamic studies — Qur'an, Hadith, Fiqh, Islamic History and Ethics — creating a generation that excels in both worlds."}
          </p>
          <div className="pt-2">
            <a
              href="#apply-online"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              Start Online Application Form
              <ArrowRight size={15} />
            </a>
          </div>
        </div>

        <div className="relative">
          <img
            src={ADMISSION.admissionImage || students}
            alt="Students of Darusuffa Academy studying"
            loading="lazy"
            width={1200}
            height={900}
            className="rounded-3xl object-cover shadow-[var(--shadow-soft)] w-full aspect-[4/3]"
          />
          <div className="absolute -bottom-4 -left-4 rounded-2xl bg-card border border-border p-4 shadow-lg hidden sm:block max-w-xs">
            <div className="font-display text-sm font-semibold text-foreground">
              {institutionName}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Academic &amp; Moral Excellence
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW TO APPLY STEPS */}
      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-8">
          <div>
            <span className="text-xs uppercase font-semibold tracking-wider text-primary">
              Simple 3-Step Process
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mt-1">
              {ADMISSION.howToApplyTitle || "How to apply"}
            </h2>
          </div>
          {ADMISSION.admissionYear && (
            <span className="text-xs sm:text-sm font-mono text-primary bg-primary/10 px-3.5 py-1 rounded-full w-fit">
              Session {ADMISSION.admissionYear}
            </span>
          )}
        </div>

        <ol className="grid gap-6 md:grid-cols-3">
          {(ADMISSION.steps && ADMISSION.steps.length > 0
            ? ADMISSION.steps
            : [
                "Submit the online application form below or download the physical admission form.",
                "Visit the campus at Vadeesunnah, Kolathur with your previous academic records.",
                "Attend the interaction with the faculty and complete the admission formalities.",
              ]
          ).map((step, i) => (
            <li
              key={i}
              className="card-soft p-6 flex flex-col justify-between border border-border hover:border-primary/30 transition-colors"
            >
              <div>
                <span className="font-display text-3xl font-black text-secondary">0{i + 1}</span>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* 5. ELIGIBILITY & REQUIRED DOCUMENTS */}
      {(ADMISSION.showEligibility || ADMISSION.showRequiredDocuments) && (
        <section className="bg-muted/40 px-5 py-16 border-y border-border/60">
          <div className="mx-auto max-w-6xl space-y-8">
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Eligibility Criteria */}
              {ADMISSION.showEligibility && (
                <article className="card-soft p-8 space-y-4 border border-border">
                  <div className="flex items-center gap-2.5 text-primary">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                      <FileText size={18} />
                    </span>
                    <h3 className="font-display text-xl font-bold text-foreground">
                      {ADMISSION.eligibilityTitle || "Eligibility Criteria"}
                    </h3>
                  </div>
                  <p className="leading-relaxed text-sm text-muted-foreground whitespace-pre-line">
                    {ADMISSION.eligibilityText}
                  </p>
                </article>
              )}

              {/* Required Documents */}
              {ADMISSION.showRequiredDocuments && (
                <article className="card-soft p-8 space-y-4 border border-border">
                  <div className="flex items-center gap-2.5 text-primary">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                      <Check size={18} />
                    </span>
                    <h3 className="font-display text-xl font-bold text-foreground">
                      {ADMISSION.requiredDocumentsTitle || "Required Documents"}
                    </h3>
                  </div>
                  <ul className="space-y-2.5 pt-1">
                    {ADMISSION.requiredDocuments.map((doc, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 text-sm text-muted-foreground"
                      >
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-[10px] font-bold">
                          ✓
                        </span>
                        <span>{doc}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              )}
            </div>

            {/* Important Notes */}
            {ADMISSION.importantNotes && (
              <div className="rounded-2xl border border-border bg-background p-6 flex items-start gap-3.5 shadow-xs">
                <Info size={20} className="text-primary mt-0.5 shrink-0" />
                <div className="text-sm leading-relaxed text-muted-foreground">
                  <span className="font-semibold text-foreground">Important Information: </span>
                  {ADMISSION.importantNotes}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 6. MANUAL ADMISSION FORM DOWNLOAD CTA */}
      {showDownload && (
        <section id="download-form" className="mx-auto max-w-4xl px-5 py-12">
          <div className="rounded-3xl border-2 border-primary/20 bg-gradient-to-r from-primary/5 via-card to-primary/5 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <FileText size={24} />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-primary font-bold">
                      Official Document
                    </span>
                    <h3 className="font-display text-xl sm:text-2xl font-bold text-foreground">
                      Prefer a manual admission form?
                    </h3>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
                  {ADMISSION.downloadDescription ||
                    "Download and print our official application form, fill it out by hand, and submit it directly to the campus admission desk."}
                </p>
              </div>

              <div className="shrink-0">
                <Button
                  type="button"
                  onClick={handleDownloadForm}
                  disabled={downloadingPdf}
                  className="rounded-full bg-primary px-8 py-4 font-display text-sm font-semibold text-primary-foreground shadow-md hover:opacity-90 h-auto gap-2"
                >
                  {downloadingPdf ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Generating Form PDF...
                    </>
                  ) : (
                    <>
                      <Download size={18} />
                      {ADMISSION.downloadButtonText || "Download Admission Form"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 7. ONLINE ADMISSION APPLICATION FORM SECTION */}
      <section id="apply-online" className="surface-ink px-5 py-20 mt-6 scroll-mt-10">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <span className="eyebrow">{ADMISSION.formTitle || "ADMISSION FORM-2025"}</span>
            <h2 className="mt-3 font-display text-3xl text-ink-foreground sm:text-4xl font-bold">
              Online Admission Application
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-ink-foreground/80 text-sm sm:text-base">
              Submit your application directly to Darusuffa Academy. All fields marked with an
              asterisk (<span className="text-destructive font-bold">*</span>) are required.
            </p>
          </div>

          {appSubmitted ? (
            <div className="card-soft p-10 text-center border border-border shadow-lg">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <CheckCircle size={36} />
              </div>
              <h3 className="mt-6 font-display text-2xl font-bold text-foreground">
                Application Submitted Successfully
              </h3>
              <p className="mx-auto mt-3 max-w-lg text-base text-foreground font-medium">
                Application submitted successfully. Your application has been received by Darusuffa
                Academy.
              </p>
              <p className="mx-auto mt-2 max-w-md text-xs text-muted-foreground leading-relaxed">
                Our admission committee will review the details and contact you via phone or
                WhatsApp regarding the campus interview and verification.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setAppValues(INITIAL_FORM_VALUES);
                    setAppErrors({});
                    setAppSubmitted(false);
                  }}
                  className="rounded-full px-6"
                >
                  Submit Another Application
                </Button>
                {showDownload && (
                  <Button
                    type="button"
                    variant="default"
                    onClick={handleDownloadForm}
                    disabled={downloadingPdf}
                    className="rounded-full px-6 gap-2"
                  >
                    <Download size={15} />
                    Download Copy as PDF
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmitApplication}
              className="card-soft space-y-6 p-6 sm:p-10 font-enquiry text-foreground shadow-xl border border-border"
              noValidate
            >
              {/* Form Header Info Banner */}
              <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 text-xs text-muted-foreground flex items-center justify-between">
                <div>
                  <span className="font-semibold text-foreground">{institutionName}</span>
                  <div className="text-[11px]">
                    {institutionSubtitle} — {institutionLocation}
                  </div>
                </div>
                <span className="font-mono text-primary font-bold">
                  {ADMISSION.admissionYear || "2025"}
                </span>
              </div>

              {/* 1. Class to Join */}
              <div className="space-y-2">
                <Label htmlFor="class_to_join" className="text-sm font-semibold">
                  1. Class to Join <span className="text-destructive">*</span>
                </Label>
                {(() => {
                  const classField = formFields.find(
                    (f) => f.name === "class_to_join" || f.id === "class_to_join",
                  );
                  const options =
                    classField?.options && classField.options.length > 0
                      ? classField.options
                      : ["8th Class", "9th Class", "Plus One"];

                  return (
                    <select
                      id="class_to_join"
                      value={appValues.class_to_join}
                      onChange={(e) => handleFieldChange("class_to_join", e.target.value)}
                      className={`flex h-11 w-full rounded-xl border bg-background px-3.5 py-2 text-sm ring-offset-background transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                        appErrors.class_to_join
                          ? "border-destructive bg-destructive/5"
                          : "border-input"
                      }`}
                    >
                      <option value="">-- Select Class to Join --</option>
                      {options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  );
                })()}
                {appErrors.class_to_join && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle size={12} />
                    {appErrors.class_to_join}
                  </p>
                )}
              </div>

              {/* 2 & 3. Student Name & Father Name */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="student_name" className="text-sm font-semibold">
                    2. Name of Student <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="student_name"
                    value={appValues.student_name}
                    onChange={(e) => handleFieldChange("student_name", e.target.value)}
                    placeholder="Enter student's full name"
                    className={`rounded-xl h-11 ${
                      appErrors.student_name ? "border-destructive bg-destructive/5" : ""
                    }`}
                  />
                  {appErrors.student_name && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle size={12} />
                      {appErrors.student_name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="father_name" className="text-sm font-semibold">
                    3. Name of Father <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="father_name"
                    value={appValues.father_name}
                    onChange={(e) => handleFieldChange("father_name", e.target.value)}
                    placeholder="Enter father or guardian name"
                    className={`rounded-xl h-11 ${
                      appErrors.father_name ? "border-destructive bg-destructive/5" : ""
                    }`}
                  />
                  {appErrors.father_name && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle size={12} />
                      {appErrors.father_name}
                    </p>
                  )}
                </div>
              </div>

              {/* 4. Complete Address */}
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-semibold">
                  4. Address <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="address"
                  value={appValues.address}
                  onChange={(e) => handleFieldChange("address", e.target.value)}
                  placeholder="Permanent house name, street, post office and PIN..."
                  rows={3}
                  className={`rounded-xl ${
                    appErrors.address ? "border-destructive bg-destructive/5" : ""
                  }`}
                />
                {appErrors.address && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle size={12} />
                    {appErrors.address}
                  </p>
                )}
              </div>

              {/* 5 & 6. Place & District */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="place" className="text-sm font-semibold">
                    5. Place <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="place"
                    value={appValues.place}
                    onChange={(e) => handleFieldChange("place", e.target.value)}
                    placeholder="e.g. Kolathur or Perinthalmanna"
                    className={`rounded-xl h-11 ${
                      appErrors.place ? "border-destructive bg-destructive/5" : ""
                    }`}
                  />
                  {appErrors.place && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle size={12} />
                      {appErrors.place}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="district" className="text-sm font-semibold">
                    6. District <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="district"
                    value={appValues.district}
                    onChange={(e) => handleFieldChange("district", e.target.value)}
                    placeholder="e.g. Malappuram"
                    className={`rounded-xl h-11 ${
                      appErrors.district ? "border-destructive bg-destructive/5" : ""
                    }`}
                  />
                  {appErrors.district && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle size={12} />
                      {appErrors.district}
                    </p>
                  )}
                </div>
              </div>

              {/* 7 & 8. Phone Number & WhatsApp Number */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-semibold">
                    7. Phone Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={appValues.phone}
                    onChange={(e) => handleFieldChange("phone", e.target.value)}
                    placeholder="+91 98765 43210"
                    className={`rounded-xl h-11 font-mono ${
                      appErrors.phone ? "border-destructive bg-destructive/5" : ""
                    }`}
                  />
                  {appErrors.phone && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle size={12} />
                      {appErrors.phone}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp" className="text-sm font-semibold">
                    8. WhatsApp Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    value={appValues.whatsapp}
                    onChange={(e) => handleFieldChange("whatsapp", e.target.value)}
                    placeholder="+91 98765 43210"
                    className={`rounded-xl h-11 font-mono ${
                      appErrors.whatsapp ? "border-destructive bg-destructive/5" : ""
                    }`}
                  />
                  {appErrors.whatsapp && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle size={12} />
                      {appErrors.whatsapp}
                    </p>
                  )}
                </div>
              </div>

              {/* Dynamic Additional Fields if configured in admin */}
              {formFields
                .filter(
                  (f) =>
                    ![
                      "class_to_join",
                      "student_name",
                      "father_name",
                      "address",
                      "place",
                      "district",
                      "phone",
                      "whatsapp",
                    ].includes(f.name || f.id),
                )
                .map((field) => {
                  const key = field.name || field.id;
                  return (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={key} className="text-sm font-semibold">
                        {field.label}{" "}
                        {field.required && <span className="text-destructive">*</span>}
                      </Label>

                      {field.type === "select" ? (
                        <select
                          id={key}
                          value={appValues[key] || ""}
                          onChange={(e) => handleFieldChange(key, e.target.value)}
                          className="flex h-11 w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm focus:ring-2 focus:ring-primary"
                        >
                          <option value="">-- Select {field.label} --</option>
                          {(field.options || []).map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : field.type === "textarea" ? (
                        <Textarea
                          id={key}
                          value={appValues[key] || ""}
                          onChange={(e) => handleFieldChange(key, e.target.value)}
                          rows={3}
                          className="rounded-xl"
                        />
                      ) : (
                        <Input
                          id={key}
                          type={field.type === "phone" ? "tel" : "text"}
                          value={appValues[key] || ""}
                          onChange={(e) => handleFieldChange(key, e.target.value)}
                          className="rounded-xl h-11"
                        />
                      )}

                      {appErrors[key] && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle size={12} />
                          {appErrors[key]}
                        </p>
                      )}
                    </div>
                  );
                })}

              {/* Submit Application Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={appSubmitting}
                  className="w-full rounded-full py-6 text-base font-semibold shadow-md sm:w-auto sm:px-12 gap-2"
                >
                  {appSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Submitting Application...
                    </>
                  ) : (
                    <>
                      SUBMIT APPLICATION
                      <Send size={18} />
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </section>
    </PageShell>
  );
}
