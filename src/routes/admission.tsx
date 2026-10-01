"use client";

import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Download,
  FileText,
  Check,
  Info,
  Phone,
  Mail,
  MessageCircle,
  MapPin,
  Sparkles,
  Loader2,
  Calendar,
  Clock,
  Compass,
} from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import {
  useContactSettings,
  useAdmissionSettings,
  DEFAULT_ADMISSION,
  DEFAULT_FACILITIES,
} from "@/lib/cms";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { generateAdmissionPdf } from "@/lib/admissionPdf";
import { OnlineAdmissionDialog } from "@/components/site/OnlineAdmissionDialog";
import students from "@/assets/students.jpg";

export const Route = createFileRoute("/admission")({
  validateSearch: (search: Record<string, unknown>): { apply?: boolean } => {
    return {
      apply: search.apply === true || search.apply === "true",
    };
  },
  head: () => ({
    meta: [
      { title: "Admission | Darusuffa Academy, Kolathur" },
      {
        name: "description",
        content:
          "Admission to Darusuffa Academy: integrated Dars with High School, Higher Secondary and Degree studies at Vadeesunnah, Kolathur. Download the official admission form or contact the campus office.",
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

function Admission() {
  const search = Route.useSearch();
  const [isApplyOpen, setIsApplyOpen] = useState(Boolean(search?.apply));
  const CONTACT = useContactSettings();
  const ADMISSION = useAdmissionSettings() ?? DEFAULT_ADMISSION;

  // PDF download loading state
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const institutionName = ADMISSION.institutionName || "DARUSUFFA ACADEMY";
  const institutionSubtitle = ADMISSION.institutionSubtitle || "MUHYISUNNA INTEGRATED DARS";
  const institutionLocation = ADMISSION.institutionLocation || "Vadeesunnah, Kolathur, Malappuram";
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

  return (
    <PageShell
      eyebrow={ADMISSION.eyebrow || "Admission Information & Guidelines"}
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
              "Our campus, located in a serene and spiritually enriching environment, offers the perfect setting for holistic development. Interested candidates are encouraged to download the official admission form or contact our office directly for campus submission and verification."}
          </p>

          {/* ACTION BUTTONS */}
          <div className="mt-8 pt-6 border-t border-border/80 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {showDownload && (
              <Button
                type="button"
                variant="default"
                onClick={handleDownloadForm}
                disabled={downloadingPdf}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 font-display text-sm sm:text-base font-semibold text-primary-foreground shadow-md hover:opacity-95 transition-all active:scale-[0.98] h-auto"
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
            )}

            <a
              href={`tel:${contactPhone.replace(/\s/g, "")}`}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3.5 font-display text-sm font-semibold text-foreground hover:bg-muted transition-colors shadow-2xs"
            >
              <Phone size={15} className="text-primary" />
              {ADMISSION.callButtonText || "Call Admission Desk"}
            </a>

            <a
              href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-950/40 px-6 py-3.5 font-display text-sm font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors shadow-2xs"
            >
              <MessageCircle size={15} />
              {ADMISSION.whatsappButtonText || "Inquire on WhatsApp"}
            </a>
          </div>

          {/* Contact Details Footer Strip */}
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
            <span className="hidden sm:inline text-border">•</span>
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="text-primary" />
              <span>Office Hours: 9:00 AM – 4:30 PM</span>
            </div>
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

          <div className="pt-2 flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={() => setIsApplyOpen(true)}
              className="rounded-full gap-2 bg-primary text-primary-foreground font-semibold px-6 shadow-md hover:opacity-95"
            >
              <Sparkles size={16} />
              Apply Online Now
            </Button>

            {showDownload && (
              <Button
                type="button"
                variant="outline"
                onClick={handleDownloadForm}
                disabled={downloadingPdf}
                className="rounded-full gap-2 text-xs sm:text-sm"
              >
                <Download size={14} />
                Download Application Form
              </Button>
            )}
            <a
              href="#how-to-apply"
              className="inline-flex items-center gap-1.5 rounded-full bg-secondary/20 hover:bg-secondary/30 px-4 py-2 text-xs sm:text-sm font-medium text-foreground transition-colors"
            >
              <Compass size={14} />
              View Admission Steps
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
      <section id="how-to-apply" className="mx-auto max-w-6xl px-5 py-12 scroll-mt-10">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-8">
          <div>
            <span className="text-xs uppercase font-semibold tracking-wider text-primary">
              Admission Procedure
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mt-1">
              {ADMISSION.howToApplyTitle || "How to Apply for Admission"}
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
                "Download the official admission application form or collect it directly from the academy office.",
                "Fill out the physical form and attach the required academic records and documents.",
                "Visit the campus at Vadeesunnah, Kolathur for interaction with faculty and complete the admission formalities.",
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

        {/* Online Application Quick Action */}
        <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-display text-base font-bold text-foreground">
              Ready to submit your admission application?
            </h4>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Complete and submit your official application online directly from your phone or
              device.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => setIsApplyOpen(true)}
            className="rounded-full bg-primary font-semibold px-6 shrink-0 gap-2 shadow-sm"
          >
            <Sparkles size={16} />
            <span>Apply Online Now</span>
          </Button>
        </div>
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

      {/* 6. OFFICIAL ADMISSION FORM DOWNLOAD CTA */}
      {showDownload && (
        <section id="download-form" className="mx-auto max-w-5xl px-5 py-16">
          <div className="rounded-3xl border-2 border-primary/20 bg-gradient-to-r from-primary/5 via-card to-primary/5 p-6 sm:p-10 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <FileText size={24} />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-primary font-bold">
                      Official Application Form
                    </span>
                    <h3 className="font-display text-xl sm:text-2xl font-bold text-foreground">
                      Download Admission Form
                    </h3>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
                  {ADMISSION.downloadDescription ||
                    "Download and print our official application form, fill it out by hand, attach the necessary certificates, and submit it directly to the campus admission desk."}
                </p>
              </div>

              <div className="shrink-0 flex flex-wrap gap-3 items-center">
                <Button
                  type="button"
                  onClick={() => setIsApplyOpen(true)}
                  className="rounded-full bg-primary px-8 py-4 font-display text-sm font-semibold text-primary-foreground shadow-md hover:opacity-90 h-auto gap-2"
                >
                  <Sparkles size={18} />
                  <span>Apply Online Now</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDownloadForm}
                  disabled={downloadingPdf}
                  className="rounded-full px-6 py-4 font-display text-sm font-semibold border-border shadow-xs hover:bg-muted h-auto gap-2"
                >
                  {downloadingPdf ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Generating Form PDF...
                    </>
                  ) : (
                    <>
                      <Download size={18} />
                      {ADMISSION.downloadButtonText || "Download Form (PDF)"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 7. CAMPUS VISIT & DIRECT CONTACT INFO */}
      <section className="mx-auto max-w-5xl px-5 pb-20">
        <div className="card-soft rounded-3xl p-6 sm:p-10 border border-border bg-card">
          <div className="grid gap-8 md:grid-cols-2 items-center">
            <div className="space-y-4">
              <span className="text-xs uppercase font-semibold tracking-wider text-primary">
                Direct Submission &amp; Inquiry
              </span>
              <h3 className="font-display text-2xl font-bold text-foreground">
                Visit Campus or Contact Admission Desk
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                For seat availability, intake schedules, and campus tours, prospective students and
                parents are welcome to visit our administrative office during working hours.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3 text-sm">
                  <MapPin size={18} className="text-primary mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">Campus: </strong>
                    {CONTACT.address || "Vadeesunnah, Kolathur, Malappuram, Kerala"}
                  </span>
                </div>

                <div className="flex items-start gap-3 text-sm">
                  <Phone size={18} className="text-primary mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">Phone: </strong>
                    <a
                      href={`tel:${contactPhone.replace(/\s/g, "")}`}
                      className="hover:text-primary"
                    >
                      {contactPhone}
                    </a>
                  </span>
                </div>

                <div className="flex items-start gap-3 text-sm">
                  <Mail size={18} className="text-primary mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">Email: </strong>
                    <a href={`mailto:${contactEmail}`} className="hover:text-primary">
                      {contactEmail}
                    </a>
                  </span>
                </div>

                <div className="flex items-start gap-3 text-sm">
                  <Calendar size={18} className="text-primary mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">Office Days: </strong>
                    Monday to Saturday, 9:00 AM – 4:30 PM
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:p-8 space-y-4 text-center flex flex-col items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <MessageCircle size={28} />
              </div>
              <h4 className="font-display text-lg font-bold text-foreground">
                Need Guidance or Assistance?
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xs">
                Connect with our admission guidance coordinator directly on WhatsApp for instant
                assistance.
              </p>
              <a
                href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 font-display text-xs sm:text-sm font-semibold shadow-sm transition-colors"
              >
                <MessageCircle size={16} />
                Chat with Admission Coordinator
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Online Admission Application Modal */}
      <OnlineAdmissionDialog open={isApplyOpen} onOpenChange={setIsApplyOpen} />
    </PageShell>
  );
}
