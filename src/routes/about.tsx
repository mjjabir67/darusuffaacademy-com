import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageShell } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useContactSettings } from "@/lib/cms";
import {
  Send,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Loader2,
  ArrowRight,
  MessageSquare,
} from "lucide-react";
import campus from "@/assets/campus.jpg";
import heroBooks from "@/assets/hero-books.jpg";
import quranDark from "@/assets/quran-dark.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Know Us | Darusuffa Academy, Vadeesunnah Kolathur" },
      {
        name: "description",
        content:
          "Darusuffa Academy is an Islamic integrated educational centre run by Irshadiyya Kolathur, blending High School, Higher Secondary and Degree studies with Qur'an, Hadith and Fiqh.",
      },
      { property: "og:title", content: "Know Us | Darusuffa Academy" },
      {
        property: "og:description",
        content:
          "Founded in 2018 at Vadeesunnah, Kolathur — academic excellence and spiritual growth under Irshadiyya Kolathur.",
      },
    ],
  }),
  component: About,
});

function About() {
  const CONTACT = useContactSettings();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) {
      newErrors.name = "Please enter your name";
    }
    if (!form.phone.trim() && !form.email.trim()) {
      newErrors.phone = "Please provide at least a phone number or email";
    }
    if (!form.message.trim()) {
      newErrors.message = "Please enter your message or question";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const { error } = await supabase.from("enquiries").insert({
        student_name: form.name.trim(),
        parent_name: "",
        phone: form.phone.trim(),
        email: form.email.trim() || "not-provided@darusuffa.org",
        course: "General Enquiry",
        admission_year: new Date().getFullYear().toString(),
        message: form.message.trim(),
        is_read: false,
        is_contacted: false,
      });

      if (error) throw error;

      setSubmitted(true);
      toast.success("Enquiry submitted successfully! We will contact you soon.");
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (err) {
      console.error("[About] Enquiry submission error:", err);
      toast.error("Failed to send enquiry. Please try again or call us directly.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell
      eyebrow="About the institution"
      title="Know Us"
      intro="Muhyissunna Student's Association — Vadeesunnah, Kolathur"
    >
      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-[1.2fr_1fr]">
        <div className="space-y-5 text-base leading-relaxed">
          <h2 className="font-display text-2xl">Darusuffa Academy</h2>
          <p>
            is an Islamic integrated educational center run by <strong>Irshadiyya Kolathur</strong>,
            committed to academic excellence and spiritual growth. We offer a comprehensive
            curriculum for High School, Higher Secondary (Humanities) and Degree students, blending
            modern education with the timeless guidance of Islamic teachings.
          </p>
          <p>
            Through a balanced approach that combines subjects like languages, social sciences and
            humanities with Qur'anic studies, Hadith, Fiqh and moral instruction, we aim to shape
            individuals who are intellectually competent, ethically grounded and spiritually
            conscious.
          </p>
          <p>
            Our goal is to nurture future leaders who uphold Islamic values while contributing
            positively to society and the world at large.
          </p>
        </div>

        <div>
          <img
            src={campus}
            alt="Darusuffa Academy building at Vadeesunnah"
            loading="lazy"
            width={1200}
            height={900}
            className="rounded-3xl object-cover shadow-[var(--shadow-soft)]"
          />
          <Link
            to="/contact"
            className="mt-4 inline-block text-sm text-primary underline underline-offset-4"
          >
            Find us
          </Link>
        </div>
      </section>

      <section className="bg-muted px-5 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
          <p className="text-lg leading-relaxed">
            The institution located at Vadeesunnah in Kolathur was inaugurated by Hon. Indian Grand
            Mufti Sheikh Aboobacker Ahmad in the presence of Sheikh Abdul Azeez Khalid Al Athwiyya,
            E Sulaiman Musliyar, Ponmala Abdul Qadir Musliyar and Dr. K T Jaleel (Hon. Minister of
            Kerala) on 13<sup>th</sup> April 2018.
          </p>
          <img
            src={heroBooks}
            alt="Classical Islamic texts in the academy library"
            loading="lazy"
            width={1920}
            height={1088}
            className="rounded-3xl object-cover shadow-[var(--shadow-soft)]"
          />
        </div>
      </section>

      <section className="relative overflow-hidden" id="chairman">
        <img
          src={quranDark}
          alt=""
          aria-hidden
          loading="lazy"
          width={1920}
          height={1200}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[oklch(0.18_0.014_60)]/88" />
        <div className="relative mx-auto max-w-4xl px-5 py-24 text-center text-ink-foreground">
          <p className="font-display text-2xl leading-snug sm:text-3xl">
            Hearts are enlightened with faith, minds are shaped with knowledge, and lives are guided
            by the light of the Qur'an and Sunnah.
          </p>
          <div className="mt-14">
            <p className="eyebrow text-sand">Chairman's Address</p>
            <p className="mt-5 text-ink-foreground/85">
              In 2018, under the patronage of Kolathur Irshadiyya, a new chapter began with the
              founding of Darussuffa Academy at Vadi Sunnah. What began as a modest gathering of
              seekers has grown into an integrated centre where the classical Dars tradition and
              modern academics walk together. May Allah accept this effort and make our students a
              means of good for the ummah.
            </p>
            <p className="mt-6 font-display text-lg">Sayyid Murthala Shihab Saqafi Thiroorkkad</p>
            <p className="text-sm text-ink-foreground/70">Chairman</p>
          </div>
        </div>
      </section>

      {/* General Website Enquiry Section */}
      <section className="bg-background px-5 py-24 border-t border-border" id="enquiry">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr] items-start">
            <div>
              <span className="eyebrow text-primary">GET IN TOUCH</span>
              <h2 className="mt-2 font-display text-3xl font-bold text-foreground sm:text-4xl">
                Have Questions? Send an Enquiry
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Have general questions regarding Darusuffa Academy, student life, our integrated
                curriculum, or campus visits? Reach out to our administrative team anytime.
              </p>

              <div className="mt-8 space-y-4 text-sm">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Phone size={18} />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Phone Assistance</div>
                    <a
                      href={`tel:${(CONTACT.phones?.[0] || "+91 99610 09313").replace(/\s/g, "")}`}
                      className="text-primary hover:underline"
                    >
                      {CONTACT.phones?.[0] || "+91 99610 09313"}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Mail size={18} />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Email Inquiries</div>
                    <a
                      href={`mailto:${CONTACT.email || "darusuffaacademymsa@gmail.com"}`}
                      className="text-primary hover:underline"
                    >
                      {CONTACT.email || "darusuffaacademymsa@gmail.com"}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Campus Location</div>
                    <span>{CONTACT.address || "Vadeesunnah, Kolathur, Malappuram, Kerala"}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 rounded-2xl bg-muted/60 p-5 border border-border">
                <div className="flex items-center gap-2 font-medium text-foreground text-sm">
                  <MessageSquare size={16} className="text-primary" />
                  Looking for Admission Application?
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  To apply online for student admission or download the official registration form,
                  please visit our dedicated Admission section.
                </p>
                <Link
                  to="/admission"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  Go to Admission Page <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            <div className="card-soft rounded-3xl border border-border p-6 sm:p-10 shadow-[var(--shadow-soft)] bg-card">
              {submitted ? (
                <div className="py-8 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="mt-4 font-display text-xl font-bold text-foreground">
                    Enquiry Received
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                    Thank you for reaching out to Darusuffa Academy. Your general enquiry has been
                    forwarded to our administrative office. We will get back to you shortly.
                  </p>
                  <Button
                    onClick={() => setSubmitted(false)}
                    variant="outline"
                    className="mt-6 rounded-full px-6"
                  >
                    Submit Another Enquiry
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <h3 className="font-display text-xl font-semibold text-foreground">
                      Send Us a Message
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Fill in your details below and we will get back to you promptly.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Your Full Name <span className="text-destructive">*</span>
                    </label>
                    <Input
                      placeholder="e.g. Muhammed Rashid"
                      value={form.name}
                      onChange={(e) => {
                        setForm((p) => ({ ...p, name: e.target.value }));
                        if (errors.name) setErrors((p) => ({ ...p, name: "" }));
                      }}
                      className="rounded-xl h-11"
                    />
                    {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">
                        Phone Number <span className="text-destructive">*</span>
                      </label>
                      <Input
                        type="tel"
                        placeholder="e.g. +91 98765 43210"
                        value={form.phone}
                        onChange={(e) => {
                          setForm((p) => ({ ...p, phone: e.target.value }));
                          if (errors.phone) setErrors((p) => ({ ...p, phone: "" }));
                        }}
                        className="rounded-xl h-11"
                      />
                      {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">
                        Email Address (Optional)
                      </label>
                      <Input
                        type="email"
                        placeholder="e.g. name@example.com"
                        value={form.email}
                        onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                        className="rounded-xl h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Your Message or Questions <span className="text-destructive">*</span>
                    </label>
                    <Textarea
                      placeholder="Please write your questions, campus visit requests, or academic enquiries here..."
                      rows={4}
                      value={form.message}
                      onChange={(e) => {
                        setForm((p) => ({ ...p, message: e.target.value }));
                        if (errors.message) setErrors((p) => ({ ...p, message: "" }));
                      }}
                      className="rounded-xl resize-none"
                    />
                    {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-xl h-11 font-medium tracking-wide shadow-sm"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin mr-2" />
                        Submitting Enquiry...
                      </>
                    ) : (
                      <>
                        Send General Enquiry
                        <Send size={16} className="ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
