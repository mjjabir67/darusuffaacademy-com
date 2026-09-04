"use client";

import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle, Send } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { CONTACT } from "@/lib/site-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import students from "@/assets/students.jpg";

export const Route = createFileRoute("/admission")({
  head: () => ({
    meta: [
      { title: "Admission | Darusuffa Academy, Kolathur" },
      {
        name: "description",
        content:
          "Admission to Darusuffa Academy: integrated Dars with High School, Higher Secondary and Degree studies at Vadeesunnah, Kolathur. Contact the office to apply.",
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

type FormData = {
  studentName: string;
  parentName: string;
  phone: string;
  email: string;
  course: string;
  year: string;
  message: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

const INITIAL_DATA: FormData = {
  studentName: "",
  parentName: "",
  phone: "",
  email: "",
  course: "",
  year: "",
  message: "",
};

const COURSES = [
  { value: "high-school", label: "High School" },
  { value: "higher-secondary", label: "Higher Secondary" },
  { value: "degree", label: "Degree" },
  { value: "integrated-dars", label: "Integrated Dars" },
  { value: "other", label: "Other" },
];

const YEARS = [
  { value: "2025-26", label: "2025-26" },
  { value: "2026-27", label: "2026-27" },
  { value: "2027-28", label: "2027-28" },
];

function Admission() {
  const [form, setForm] = useState<FormData>(INITIAL_DATA);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const next: FormErrors = {};

    if (!form.studentName.trim()) {
      next.studentName = "Student name is required";
    }

    if (!form.parentName.trim()) {
      next.parentName = "Parent / guardian name is required";
    }

    if (!form.phone.trim()) {
      next.phone = "Phone number is required";
    } else if (!/^\+?[\d\s\-()]{8,}$/.test(form.phone.trim())) {
      next.phone = "Please enter a valid phone number";
    }

    if (!form.email.trim()) {
      next.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = "Please enter a valid email address";
    }

    if (!form.course) {
      next.course = "Please select a class / course";
    }

    if (!form.year) {
      next.year = "Please select a preferred admission year";
    }

    if (!form.message.trim()) {
      next.message = "Please enter your message or enquiry";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setSubmitting(true);

    // Placeholder for future database / notification integration.
    // The form data is ready to be sent to a server function or API.
    await new Promise((resolve) => setTimeout(resolve, 800));

    setSubmitting(false);
    setSubmitted(true);
    setForm(INITIAL_DATA);
  };

  const resetForm = () => {
    setSubmitted(false);
    setErrors({});
  };

  return (
    <PageShell
      eyebrow="Know more about"
      title="Admission"
      intro="We welcome students who aspire to gain both academic excellence and moral grounding through a unique curriculum that combines modern education with Islamic values."
    >
      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-2">
        <div className="space-y-5">
          <p className="leading-relaxed">
            Our campus, located in a serene and spiritually enriching environment, offers
            the perfect setting for holistic development. Interested candidates are
            encouraged to contact the office or visit our campus for detailed admission
            procedures and guidance. Join us in shaping a future rooted in knowledge,
            character and faith.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={`tel:${CONTACT.phones[0]?.replace(/\s/g, "")}`}
              className="rounded-full bg-primary px-6 py-3 font-display text-sm text-primary-foreground"
            >
              Call the office
            </a>
            <a
              href={`https://wa.me/${CONTACT.whatsapp.replace(/\D/g, "")}`}
              className="rounded-full border border-border px-6 py-3 font-display text-sm"
            >
              Apply on WhatsApp
            </a>
          </div>
        </div>
        <img
          src={students}
          alt="Students of Darusuffa Academy studying"
          loading="lazy"
          width={1200}
          height={900}
          className="rounded-3xl object-cover shadow-[var(--shadow-soft)]"
        />
      </section>

      <section className="bg-muted px-5 py-20">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2">
          <article className="card-soft p-8">
            <h2 className="font-display text-2xl">Integrated Education with Purpose</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Our institution nurtures students who are not only academically competent but
              also morally upright and spiritually guided. A well-structured curriculum
              integrates modern subjects with Islamic studies — Qur'an, Hadith, Fiqh,
              Islamic History and Ethics — creating a generation that excels in both
              worlds.
            </p>
          </article>
          <article className="card-soft p-8">
            <h2 className="font-display text-2xl">Learning Environment</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              The campus is peacefully situated in a serene and spiritually uplifting
              environment, ideal for focused learning, personal reflection and community
              life. Dedicated faculty, modern classrooms and co-curricular activities
              ensure the holistic development of every student.
            </p>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="font-display text-2xl">How to apply</h2>
        <ol className="mt-6 grid gap-5 md:grid-cols-3">
          {[
            "Contact the office by phone or WhatsApp to check the current intake.",
            "Visit the campus at Vadeesunnah, Kolathur with previous academic records.",
            "Attend the interaction with the faculty and complete the admission formalities.",
          ].map((step, i) => (
            <li key={step} className="card-soft p-7">
              <span className="font-display text-3xl text-secondary">0{i + 1}</span>
              <p className="mt-3 text-sm text-muted-foreground">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Admission Enquiry Section */}
      <section className="bg-surface-ink px-5 py-20">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <p className="eyebrow">Admission Enquiry</p>
            <h2 className="mt-3 font-display text-3xl text-ink-foreground sm:text-4xl">
              Send us your enquiry
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-ink-foreground/80">
              Fill in the form below and our admission office will reach out to you with
              the next steps.
            </p>
          </div>

          {submitted ? (
            <div className="card-soft p-10 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <CheckCircle size={32} />
              </div>
              <h3 className="mt-6 font-display text-2xl">Enquiry Submitted</h3>
              <p className="mx-auto mt-3 max-w-md text-muted-foreground">
                Thank you for your interest in Darusuffa Academy. Our team will review your
                enquiry and contact you shortly.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                className="mt-6 rounded-full px-6"
              >
                Submit another enquiry
              </Button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="card-soft space-y-6 p-8 font-enquiry md:p-10"
              noValidate
            >
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="studentName">
                    Student Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="studentName"
                    value={form.studentName}
                    onChange={(e) => updateField("studentName", e.target.value)}
                    placeholder="Enter student's full name"
                    aria-invalid={!!errors.studentName}
                    aria-describedby={errors.studentName ? "studentName-error" : undefined}
                  />
                  {errors.studentName && (
                    <p id="studentName-error" className="text-sm text-destructive">
                      {errors.studentName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parentName">
                    Parent / Guardian Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="parentName"
                    value={form.parentName}
                    onChange={(e) => updateField("parentName", e.target.value)}
                    placeholder="Enter parent or guardian name"
                    aria-invalid={!!errors.parentName}
                    aria-describedby={errors.parentName ? "parentName-error" : undefined}
                  />
                  {errors.parentName && (
                    <p id="parentName-error" className="text-sm text-destructive">
                      {errors.parentName}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Phone Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="+91 98765 43210"
                    aria-invalid={!!errors.phone}
                    aria-describedby={errors.phone ? "phone-error" : undefined}
                  />
                  {errors.phone && (
                    <p id="phone-error" className="text-sm text-destructive">
                      {errors.phone}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="parent@example.com"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                  />
                  {errors.email && (
                    <p id="email-error" className="text-sm text-destructive">
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="course">
                    Class / Course Interested In <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="course"
                    value={form.course}
                    onChange={(e) => updateField("course", e.target.value)}
                    aria-invalid={!!errors.course}
                    aria-describedby={errors.course ? "course-error" : undefined}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="" disabled>
                      Select a course
                    </option>
                    {COURSES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  {errors.course && (
                    <p id="course-error" className="text-sm text-destructive">
                      {errors.course}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">
                    Preferred Admission Year <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="year"
                    value={form.year}
                    onChange={(e) => updateField("year", e.target.value)}
                    aria-invalid={!!errors.year}
                    aria-describedby={errors.year ? "year-error" : undefined}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="" disabled>
                      Select a year
                    </option>
                    {YEARS.map((y) => (
                      <option key={y.value} value={y.value}>
                        {y.label}
                      </option>
                    ))}
                  </select>
                  {errors.year && (
                    <p id="year-error" className="text-sm text-destructive">
                      {errors.year}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">
                  Message / Enquiry <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="message"
                  value={form.message}
                  onChange={(e) => updateField("message", e.target.value)}
                  placeholder="Tell us about your enquiry, preferred timing to call, or any questions you have..."
                  rows={5}
                  aria-invalid={!!errors.message}
                  aria-describedby={errors.message ? "message-error" : undefined}
                />
                {errors.message && (
                  <p id="message-error" className="text-sm text-destructive">
                    {errors.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full py-6 text-base font-medium sm:w-auto sm:px-10"
              >
                {submitting ? (
                  "Submitting..."
                ) : (
                  <>
                    Submit Enquiry
                    <Send size={18} />
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </section>
    </PageShell>
  );
}
