import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  GraduationCap,
  Sparkles,
  AlertCircle,
  Loader2,
  ChevronLeft,
  CheckCircle2,
  User,
  KeyRound,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logoWhite from "@/assets/darusuffa-logo-white.png";
import {
  setStudentSession,
  getStoredStudentToken,
  STUDENT_BATCHES,
  type StudentBatch,
} from "@/lib/student-auth";

export const Route = createFileRoute("/student-login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Student Portal Login | Darusuffa Academy" },
      {
        name: "description",
        content: "Login to the Darusuffa Academy Student Portal to submit and manage your works.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Student Portal | Darusuffa Academy" },
      {
        property: "og:description",
        content: "Login to submit and manage your creative and academic works.",
      },
    ],
  }),
  component: StudentLoginPage,
});

interface BatchStudent {
  id: string;
  name: string;
  batch: StudentBatch;
}

function StudentLoginPage() {
  const navigate = useNavigate();

  // Multi-step state: 1 = Batch, 2 = Student Name, 3 = Login Code
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Selected values
  const [selectedBatch, setSelectedBatch] = useState<StudentBatch | "">("");
  const [selectedStudent, setSelectedStudent] = useState<BatchStudent | null>(null);
  const [loginCode, setLoginCode] = useState("");

  // Roster fetching
  const [studentsList, setStudentsList] = useState<BatchStudent[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [nameSearch, setNameSearch] = useState("");

  // Submitting
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // If already logged in, redirect directly to dashboard
  useEffect(() => {
    const token = getStoredStudentToken();
    if (token) {
      navigate({ to: "/student" });
    }
  }, [navigate]);

  // Fetch students whenever selectedBatch changes
  useEffect(() => {
    if (!selectedBatch) {
      setStudentsList([]);
      return;
    }

    let isMounted = true;
    setLoadingStudents(true);
    setError(null);

    fetch(`/api/public/students?batch=${selectedBatch}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          if (Array.isArray(data.students)) {
            setStudentsList(data.students);
          } else {
            setStudentsList([]);
          }
          setLoadingStudents(false);
        }
      })
      .catch((err) => {
        console.error("[Student Login] Failed to load batch roster:", err);
        if (isMounted) {
          setStudentsList([]);
          setLoadingStudents(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedBatch]);

  // Filter students based on search inside step 2
  const filteredStudents = studentsList.filter((s) =>
    s.name.toLowerCase().includes(nameSearch.toLowerCase().trim()),
  );

  // Handlers for steps
  const handleSelectBatch = (batch: StudentBatch) => {
    setSelectedBatch(batch);
    setSelectedStudent(null);
    setLoginCode("");
    setError(null);
    setNameSearch("");
    setStep(2);
  };

  const handleSelectStudent = (student: BatchStudent) => {
    setSelectedStudent(student);
    setLoginCode("");
    setError(null);
    setStep(3);
  };

  const handleBackToBatch = () => {
    setError(null);
    setStep(1);
  };

  const handleBackToStudent = () => {
    setError(null);
    setLoginCode("");
    setStep(2);
  };

  // Step 3 submission
  const handleSubmitLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    if (!selectedBatch || !selectedStudent) {
      setError("Please select your batch and name first.");
      setStep(1);
      return;
    }

    const cleanCode = loginCode.trim();
    if (!cleanCode || cleanCode.length !== 3 || !/^\d{3}$/.test(cleanCode)) {
      setError("Invalid login code. Please check and try again.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/student/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          name: selectedStudent.name,
          batch: selectedBatch,
          loginCode: cleanCode,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Invalid login code. Please check and try again.");
        setLoginCode("");
        return;
      }

      // Successful login
      setStudentSession(data.token, data.student);
      navigate({ to: "/student" });
    } catch (err: unknown) {
      console.error("[Student Login] Request error:", err);
      setError("Invalid login code. Please check and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-ink px-4 py-12 font-enquiry sm:px-6">
      <Link
        to="/"
        className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-ink/70 px-4 py-2 text-sm text-white/90 backdrop-blur-sm transition-colors hover:border-primary/40 hover:bg-white/10 hover:text-white sm:left-6 sm:top-6"
      >
        <ArrowLeft size={16} />
        <span>Back to Home</span>
      </Link>

      <div className="w-full max-w-lg">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-md sm:p-8">
          {/* Header */}
          <div className="flex flex-col items-center text-center">
            <img
              src={logoWhite}
              alt="Darusuffa Academy Logo"
              className="h-14 w-auto object-contain drop-shadow"
            />
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <GraduationCap size={14} />
              <span>Student Portal</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Student Portal Login</h1>
            <p className="mt-1 text-sm text-white/70">
              {step === 1 && "Step 1: Select your batch to begin"}
              {step === 2 && `Step 2: Select your name in Batch ${selectedBatch}`}
              {step === 3 && "Step 3: Enter your 3-digit login code"}
            </p>
          </div>

          {/* Step Indicator */}
          <div className="mt-6 flex items-center justify-between border-y border-white/10 py-3 text-xs">
            {/* Step 1 indicator */}
            <button
              type="button"
              onClick={() => step > 1 && setStep(1)}
              disabled={step === 1}
              className={`flex items-center gap-1.5 transition ${
                step === 1
                  ? "font-semibold text-primary"
                  : step > 1
                    ? "cursor-pointer text-white/80 hover:text-white"
                    : "text-white/40"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                  step === 1
                    ? "bg-primary text-primary-foreground"
                    : step > 1
                      ? "bg-emerald-500 text-white"
                      : "bg-white/10 text-white/50"
                }`}
              >
                {step > 1 ? "✓" : "1"}
              </span>
              <span>1. Batch {selectedBatch ? `(${selectedBatch})` : ""}</span>
            </button>

            <span className="text-white/20">→</span>

            {/* Step 2 indicator */}
            <button
              type="button"
              onClick={() => step === 3 && setStep(2)}
              disabled={step <= 2}
              className={`flex items-center gap-1.5 transition ${
                step === 2
                  ? "font-semibold text-primary"
                  : step === 3
                    ? "cursor-pointer text-white/80 hover:text-white"
                    : "text-white/40"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                  step === 2
                    ? "bg-primary text-primary-foreground"
                    : step === 3
                      ? "bg-emerald-500 text-white"
                      : "bg-white/10 text-white/50"
                }`}
              >
                {step === 3 ? "✓" : "2"}
              </span>
              <span>2. Student</span>
            </button>

            <span className="text-white/20">→</span>

            {/* Step 3 indicator */}
            <div
              className={`flex items-center gap-1.5 ${
                step === 3 ? "font-semibold text-primary" : "text-white/40"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                  step === 3 ? "bg-primary text-primary-foreground" : "bg-white/10 text-white/50"
                }`}
              >
                3
              </span>
              <span>3. Code</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-sm text-red-200"
            >
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: SELECT YOUR BATCH */}
          {step === 1 && (
            <div className="mt-6 space-y-4">
              <div className="text-center sm:text-left">
                <Label className="text-sm font-semibold text-white/90">Select Your Batch</Label>
                <p className="mt-0.5 text-xs text-white/60">
                  Choose your enrolled batch to view your name list.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {STUDENT_BATCHES.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => handleSelectBatch(b)}
                    className="group flex flex-col items-center justify-center rounded-xl border border-white/15 bg-white/5 p-4 text-center transition-all hover:border-primary/50 hover:bg-primary/10 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/40 active:scale-[0.98]"
                  >
                    <span className="text-xs uppercase tracking-wider text-white/50 group-hover:text-primary">
                      Batch
                    </span>
                    <span className="mt-1 font-display text-2xl font-bold text-white group-hover:text-primary">
                      {b}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: SELECT YOUR NAME */}
          {step === 2 && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-semibold text-white/90">Select Your Name</Label>
                  <p className="mt-0.5 text-xs text-white/60">
                    Enrolled students in{" "}
                    <strong className="text-white">Batch {selectedBatch}</strong>
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToBatch}
                  className="h-8 text-xs text-white/70 hover:bg-white/10 hover:text-white"
                >
                  <ChevronLeft size={14} className="mr-0.5" />
                  Change Batch
                </Button>
              </div>

              {/* Quick Search */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-3 text-white/40" />
                <Input
                  type="text"
                  placeholder="Filter name..."
                  value={nameSearch}
                  onChange={(e) => setNameSearch(e.target.value)}
                  className="h-9 border-white/20 bg-white/10 pl-8 text-xs text-white placeholder:text-white/40 focus-visible:border-primary focus-visible:ring-primary/30"
                />
              </div>

              {/* Student List */}
              <div className="max-h-64 space-y-1.5 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-2">
                {loadingStudents ? (
                  <div className="flex items-center justify-center py-8 text-sm text-white/50">
                    <Loader2 size={16} className="mr-2 animate-spin text-primary" />
                    Loading students for Batch {selectedBatch}...
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="py-8 text-center text-xs text-white/50">
                    No students found matching &ldquo;{nameSearch}&rdquo;.
                  </div>
                ) : (
                  filteredStudents.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => handleSelectStudent(st)}
                      className="group flex w-full items-center justify-between rounded-lg border border-transparent px-3 py-2.5 text-left text-sm text-white/90 transition hover:border-primary/40 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-1 focus:ring-primary/40"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/70 group-hover:bg-primary/20 group-hover:text-primary">
                          <User size={13} />
                        </div>
                        <span className="font-medium">{st.name}</span>
                      </div>
                      <ArrowRight
                        size={14}
                        className="text-white/30 transition group-hover:translate-x-0.5 group-hover:text-primary"
                      />
                    </button>
                  ))
                )}
              </div>

              <div className="flex justify-between pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBackToBatch}
                  className="border-white/20 bg-white/10 text-xs text-white hover:bg-white/20"
                >
                  <ChevronLeft size={14} className="mr-1" />
                  Back
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: ENTER 3-DIGIT LOGIN CODE */}
          {step === 3 && selectedStudent && (
            <form onSubmit={handleSubmitLogin} className="mt-6 space-y-5">
              {/* Chosen Identity Card */}
              <div className="flex items-center justify-between rounded-xl border border-white/15 bg-white/5 p-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary">
                    <User size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{selectedStudent.name}</div>
                    <div className="text-xs text-white/60">Batch {selectedBatch}</div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToStudent}
                  className="h-8 text-xs text-white/70 hover:bg-white/10 hover:text-white"
                >
                  Change
                </Button>
              </div>

              {/* Login Code Input */}
              <div className="space-y-2 text-center">
                <Label
                  htmlFor="student-code-input"
                  className="block text-sm font-semibold text-white/90"
                >
                  Enter Login Code
                </Label>
                <p className="text-xs text-white/60">
                  Enter your private 3-digit access code provided by academy faculty.
                </p>
                <div className="mx-auto max-w-[200px] pt-1">
                  <Input
                    id="student-code-input"
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={3}
                    autoFocus
                    placeholder="•••"
                    value={loginCode}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 3);
                      setLoginCode(digits);
                      if (error) setError(null);
                    }}
                    disabled={submitting}
                    required
                    className="h-14 text-center font-mono text-2xl tracking-[0.4em] border-white/25 bg-white/10 text-white placeholder:tracking-normal placeholder:text-white/30 focus-visible:border-primary focus-visible:ring-primary/40"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackToStudent}
                  disabled={submitting}
                  className="h-11 border-white/20 bg-white/10 px-4 text-white hover:bg-white/20"
                >
                  <ChevronLeft size={16} className="mr-1" />
                  Back
                </Button>

                <Button
                  id="student-step-login-submit"
                  type="submit"
                  disabled={submitting || loginCode.length !== 3}
                  className="h-11 flex-1 bg-primary font-medium text-primary-foreground transition-all hover:bg-primary/90"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <KeyRound size={16} className="mr-2" />
                      Login to Student Dashboard
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Footer note */}
          <div className="mt-8 border-t border-white/10 pt-4 text-center text-xs text-white/50">
            For login code assistance, please contact the academy administration.
          </div>
        </div>
      </div>
    </div>
  );
}
