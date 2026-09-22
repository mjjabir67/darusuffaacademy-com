import { useState, useEffect, useRef, useCallback } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  GraduationCap,
  PlusCircle,
  FileText,
  LogOut,
  Sparkles,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Eye,
  Trash2,
  Edit3,
  Loader2,
  Download,
  Calendar,
  Layers,
  ArrowLeft,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useStudentAuth, type StudentProfile } from "@/lib/student-auth";
import { uploadMedia, formatDate } from "@/lib/cms";
import logoWhite from "@/assets/darusuffa-logo-white.png";

export const Route = createFileRoute("/student")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Student Dashboard | Darusuffa Academy" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StudentDashboardPage,
});

export type StudentWorkType =
  "Speech" | "Poem" | "Article" | "Story" | "Essay" | "Drawing" | "Other";

const WORK_TYPES: StudentWorkType[] = [
  "Speech",
  "Poem",
  "Article",
  "Story",
  "Essay",
  "Drawing",
  "Other",
];

interface SubmissionItem {
  id: string;
  student_id: string;
  student_name: string;
  batch: string;
  title: string;
  work_type: StudentWorkType;
  description?: string;
  content?: string;
  media_url?: string;
  file_url?: string;
  file_name?: string;
  status: "Submitted" | "Under Review" | "Approved" | "Rejected";
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

function StatusBadge({ status }: { status: SubmissionItem["status"] }) {
  switch (status) {
    case "Approved":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
          <CheckCircle2 size={12} />
          Published on Academic
        </span>
      );
    case "Rejected":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-xs font-medium text-rose-400">
          <XCircle size={12} />
          Rejected
        </span>
      );
    case "Under Review":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400">
          <Clock size={12} />
          Under Review
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
          <CheckCircle2 size={12} />
          Published on Academic
        </span>
      );
  }
}

function StudentDashboardPage() {
  const navigate = useNavigate();
  const { token, student, loading, logout } = useStudentAuth(true);

  const [activeTab, setActiveTab] = useState<"overview" | "submit" | "works">("overview");
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [loadingWorks, setLoadingWorks] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [workType, setWorkType] = useState<StudentWorkType>("Article");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");

  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Detail view & edit modal
  const [viewItem, setViewItem] = useState<SubmissionItem | null>(null);
  const [editItem, setEditItem] = useState<SubmissionItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load submissions
  const loadSubmissions = useCallback(async () => {
    if (!token) return;
    setLoadingWorks(true);
    try {
      const res = await fetch("/api/student/submissions", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to load submissions");
      const data = await res.json();
      setSubmissions(data.submissions || []);
    } catch (err: unknown) {
      console.error("[loadSubmissions] Error:", err);
      toast.error("Could not load your works. Please try again.");
    } finally {
      setLoadingWorks(false);
    }
  }, [token]);

  useEffect(() => {
    if (token && student) {
      void loadSubmissions();
    }
  }, [token, student, loadSubmissions]);

  // Handle Image Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPG, PNG, WebP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image file is too large (max 10MB).");
      return;
    }

    setUploadingImage(true);
    try {
      const url = await uploadMedia(file, "student-works/images");
      setMediaUrl(url);
      toast.success("Image uploaded successfully!");
    } catch (err: unknown) {
      console.error("Image upload failed:", err);
      toast.error("Image upload failed. Please try again.");
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  // Handle Document Upload
  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error("File is too large (max 20MB).");
      return;
    }

    setUploadingDoc(true);
    try {
      const url = await uploadMedia(file, "student-works/files");
      setFileUrl(url);
      setFileName(file.name);
      toast.success(`Attached "${file.name}"`);
    } catch (err: unknown) {
      console.error("Document upload failed:", err);
      toast.error("File attachment failed. Please try again.");
    } finally {
      setUploadingDoc(false);
      if (docInputRef.current) docInputRef.current.value = "";
    }
  };

  // Submit Work Handler
  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a title for your work.");
      return;
    }

    // Require content or uploaded media/file
    if (!content.trim() && !mediaUrl && !fileUrl) {
      toast.error("Please provide writing text, an image, or a file for your submission.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/student/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          work_type: workType,
          description: description.trim(),
          content: content.trim(),
          media_url: mediaUrl,
          file_url: fileUrl,
          file_name: fileName,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Submission failed");
      }

      toast.success(
        "Your work is published and now live in the Student Works section on the Academic page!",
      );
      // Reset form
      setTitle("");
      setDescription("");
      setContent("");
      setMediaUrl("");
      setFileUrl("");
      setFileName("");

      // Refresh submissions and switch to My Works
      await loadSubmissions();
      setActiveTab("works");
    } catch (err: unknown) {
      console.error("Submit error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to submit work.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update existing work
  const handleUpdateWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/student/submissions", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: editItem.id,
          title: editItem.title,
          work_type: editItem.work_type,
          description: editItem.description,
          content: editItem.content,
          media_url: editItem.media_url,
          file_url: editItem.file_url,
          file_name: editItem.file_name,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Update failed");
      }

      toast.success("Submission updated successfully!");
      setEditItem(null);
      await loadSubmissions();
    } catch (err: unknown) {
      console.error("Update error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to update work.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete submission
  const handleDeleteSubmission = async () => {
    if (!deleteConfirmId || !token) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/student/submissions?id=${deleteConfirmId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Delete failed");
      }

      toast.success("Submission removed successfully.");
      setDeleteConfirmId(null);
      await loadSubmissions();
    } catch (err: unknown) {
      console.error("Delete error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to delete submission.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading || !student) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink font-enquiry text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-primary" />
          <p className="text-sm text-white/70">Loading Student Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink font-enquiry text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 transition hover:opacity-85">
              <img src={logoWhite} alt="Darusuffa Logo" className="h-8 w-auto object-contain" />
              <div className="hidden flex-col sm:flex">
                <span className="text-xs uppercase tracking-wider text-white/60">
                  Darusuffa Academy
                </span>
                <span className="font-bold text-white">Student Portal</span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary md:inline-flex md:items-center md:gap-1.5">
              <GraduationCap size={13} />
              <span>
                {student.name} • Batch {student.batch}
              </span>
            </div>

            <Button
              id="student-logout-btn"
              onClick={logout}
              variant="outline"
              size="sm"
              className="border-white/20 bg-white/5 text-white/90 hover:bg-white/10 hover:text-white"
            >
              <LogOut size={14} className="mr-1.5" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Welcome Banner Card */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-primary/20 via-white/5 to-white/5 p-6 shadow-xl backdrop-blur-sm sm:p-8">
          <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                <Sparkles size={12} />
                Student Portal
              </span>
              <h1 className="mt-2 text-2xl font-bold text-white sm:text-4xl">
                Welcome, {student.name}
              </h1>
              <p className="mt-1 text-sm text-white/70">
                Batch: <span className="font-semibold text-primary">{student.batch}</span> • Submit
                and track your speeches, poems, articles, essays, drawings and creative works.
              </p>
            </div>

            {/* Quick action buttons */}
            <div className="flex flex-wrap gap-2.5">
              <Button
                id="student-tab-submit-btn"
                onClick={() => setActiveTab("submit")}
                className={
                  activeTab === "submit"
                    ? "bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
                    : "border-white/20 bg-white/10 text-white hover:bg-white/20"
                }
              >
                <PlusCircle size={16} className="mr-1.5" />
                Submit Your Work
              </Button>
              <Button
                id="student-tab-works-btn"
                onClick={() => setActiveTab("works")}
                className={
                  activeTab === "works"
                    ? "bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
                    : "border-white/20 bg-white/10 text-white hover:bg-white/20"
                }
              >
                <Layers size={16} className="mr-1.5" />
                My Works ({submissions.length})
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="mt-6 flex border-b border-white/10">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "overview"
                ? "border-primary text-primary"
                : "border-transparent text-white/60 hover:text-white"
            }`}
          >
            <GraduationCap size={16} />
            <span>Dashboard Overview</span>
          </button>
          <button
            onClick={() => setActiveTab("submit")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "submit"
                ? "border-primary text-primary"
                : "border-transparent text-white/60 hover:text-white"
            }`}
          >
            <PlusCircle size={16} />
            <span>Submit Your Work</span>
          </button>
          <button
            onClick={() => setActiveTab("works")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "works"
                ? "border-primary text-primary"
                : "border-transparent text-white/60 hover:text-white"
            }`}
          >
            <FileText size={16} />
            <span>My Works</span>
            <Badge variant="secondary" className="ml-1 bg-white/10 text-white">
              {submissions.length}
            </Badge>
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="mt-6 space-y-6">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                <span className="text-2xl font-bold text-white sm:text-3xl">
                  {submissions.length}
                </span>
                <p className="mt-1 text-xs text-white/60">Total Works Submitted</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                <span className="text-2xl font-bold text-blue-400 sm:text-3xl">
                  {submissions.filter((s) => s.status === "Submitted").length}
                </span>
                <p className="mt-1 text-xs text-white/60">Pending Review</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                <span className="text-2xl font-bold text-amber-400 sm:text-3xl">
                  {submissions.filter((s) => s.status === "Under Review").length}
                </span>
                <p className="mt-1 text-xs text-white/60">Under Review</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                <span className="text-2xl font-bold text-emerald-400 sm:text-3xl">
                  {submissions.filter((s) => s.status === "Approved").length}
                </span>
                <p className="mt-1 text-xs text-white/60">Approved</p>
              </div>
            </div>

            {/* Profile & Guidance Section */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Profile Card */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <h3 className="font-semibold text-white">Student Profile</h3>
                <div className="mt-4 space-y-2.5 text-sm">
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-white/60">Name</span>
                    <span className="font-medium text-white">{student.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-white/60">Batch</span>
                    <span className="font-medium text-primary">Batch {student.batch}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-white/60">Status</span>
                    <span className="inline-flex items-center gap-1 font-medium text-emerald-400">
                      <CheckCircle2 size={13} /> Active Student
                    </span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-white/60">Academy</span>
                    <span className="font-medium text-white">Darusuffa Academy</span>
                  </div>
                </div>
              </div>

              {/* Instructions Card */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-5 md:col-span-2">
                <h3 className="font-semibold text-white">Submission Guidelines</h3>
                <ul className="mt-3 space-y-2 text-sm text-white/80">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>
                      <strong>Speeches, Poems, Articles, Stories & Essays:</strong> Enter or paste
                      your text content directly into the writing editor.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>
                      <strong>Drawings & Visual Art:</strong> Upload clear photos or scans of your
                      artwork (JPG, PNG, WebP up to 10MB).
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>
                      <strong>Review Process:</strong> Your works will be reviewed by the faculty
                      and editorial board. Approved pieces may be selected for publication.
                    </span>
                  </li>
                </ul>

                <div className="mt-5 flex gap-3">
                  <Button
                    onClick={() => setActiveTab("submit")}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <PlusCircle size={15} className="mr-1.5" />
                    Create New Submission
                  </Button>
                </div>
              </div>
            </div>

            {/* Recent Submissions Snippet */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">Recent Submissions</h3>
                {submissions.length > 0 && (
                  <button
                    onClick={() => setActiveTab("works")}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    View all ({submissions.length})
                  </button>
                )}
              </div>

              {submissions.length === 0 ? (
                <div className="mt-6 flex flex-col items-center justify-center py-8 text-center">
                  <FileText size={36} className="text-white/30" />
                  <p className="mt-2 text-sm text-white/70">No works submitted yet.</p>
                  <p className="text-xs text-white/50">
                    Share your speeches, poems, essays or drawings with Darusuffa Academy!
                  </p>
                  <Button
                    onClick={() => setActiveTab("submit")}
                    size="sm"
                    className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <PlusCircle size={14} className="mr-1.5" />
                    Submit Your First Work
                  </Button>
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {submissions.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="group flex flex-col justify-between rounded-lg border border-white/10 bg-white/5 p-3.5 transition hover:border-white/20 hover:bg-white/10"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="rounded bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white/80">
                            {item.work_type}
                          </span>
                          <StatusBadge status={item.status} />
                        </div>
                        <h4 className="mt-2 line-clamp-1 font-semibold text-white">{item.title}</h4>
                        {item.description && (
                          <p className="mt-1 line-clamp-2 text-xs text-white/60">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2 text-xs text-white/50">
                        <span>{formatDate(item.created_at)}</span>
                        <button
                          onClick={() => setViewItem(item)}
                          className="font-medium text-primary hover:underline"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: SUBMIT YOUR WORK */}
        {activeTab === "submit" && (
          <div className="mt-6 max-w-3xl">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl sm:p-8">
              <div className="border-b border-white/10 pb-4">
                <h2 className="text-xl font-bold text-white sm:text-2xl">Submit Your Work</h2>
                <p className="mt-1 text-sm text-white/70">
                  Share your creative and academic contributions. Submitting as{" "}
                  <strong className="text-primary">{student.name}</strong> (Batch {student.batch}).
                </p>
              </div>

              <form onSubmit={handleSubmitWork} className="mt-6 space-y-5">
                {/* Title */}
                <div className="space-y-1.5">
                  <Label htmlFor="work-title" className="text-sm font-medium text-white/90">
                    Work Title <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="work-title"
                    type="text"
                    placeholder="Enter the title of your work"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="border-white/20 bg-white/10 text-white placeholder:text-white/40 focus:border-primary"
                  />
                </div>

                {/* Work Type */}
                <div className="space-y-1.5">
                  <Label htmlFor="work-type" className="text-sm font-medium text-white/90">
                    Work Type <span className="text-red-400">*</span>
                  </Label>
                  <Select
                    value={workType}
                    onValueChange={(val: StudentWorkType) => setWorkType(val)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger
                      id="work-type"
                      className="border-white/20 bg-white/10 text-white focus:border-primary"
                    >
                      <SelectValue placeholder="Select work type" />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-ink text-white">
                      {WORK_TYPES.map((t) => (
                        <SelectItem key={t} value={t} className="cursor-pointer hover:bg-white/10">
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Description / Introduction (optional) */}
                <div className="space-y-1.5">
                  <Label htmlFor="work-desc" className="text-sm font-medium text-white/90">
                    Description / Introduction{" "}
                    <span className="text-xs text-white/50">(Optional)</span>
                  </Label>
                  <Input
                    id="work-desc"
                    type="text"
                    placeholder="Brief background or one-sentence summary"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isSubmitting}
                    className="border-white/20 bg-white/10 text-white placeholder:text-white/40 focus:border-primary"
                  />
                </div>

                {/* Content / Text Area */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="work-content" className="text-sm font-medium text-white/90">
                      Content / Text
                    </Label>
                    <span className="text-xs text-white/50">
                      {workType === "Drawing" ? "Optional for drawings" : "Paste or type your work"}
                    </span>
                  </div>
                  <Textarea
                    id="work-content"
                    rows={8}
                    placeholder={
                      workType === "Drawing"
                        ? "Notes about your drawing, medium used, or story behind it..."
                        : "Type or paste your complete writing here..."
                    }
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={isSubmitting}
                    className="border-white/20 bg-white/10 text-white placeholder:text-white/40 focus:border-primary"
                  />
                </div>

                {/* Image Upload for Drawings / Visual works */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <Label className="text-sm font-medium text-white/90">
                    Upload Image{" "}
                    <span className="text-xs text-white/50">(Drawings, artwork, calligraphy)</span>
                  </Label>

                  {mediaUrl ? (
                    <div className="mt-3 flex items-start gap-4">
                      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg border border-white/20 bg-black/40">
                        <img
                          src={mediaUrl}
                          alt="Uploaded work"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-xs text-emerald-400">✓ Image ready</span>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => imageInputRef.current?.click()}
                            disabled={uploadingImage}
                            className="border-white/20 bg-white/10 text-xs text-white hover:bg-white/20"
                          >
                            Replace
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => setMediaUrl("")}
                            className="text-xs"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="border-dashed border-white/30 bg-white/5 text-white/90 hover:bg-white/10 hover:text-white"
                      >
                        {uploadingImage ? (
                          <>
                            <Loader2 size={16} className="mr-2 animate-spin" />
                            Uploading Image...
                          </>
                        ) : (
                          <>
                            <ImageIcon size={16} className="mr-2" />
                            Choose Drawing / Photo (JPG, PNG, WebP)
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* File Attachment Upload */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <Label className="text-sm font-medium text-white/90">
                    Upload File{" "}
                    <span className="text-xs text-white/50">(PDF, DOC, speech script, etc.)</span>
                  </Label>

                  {fileUrl ? (
                    <div className="mt-3 flex items-center justify-between rounded-lg border border-white/20 bg-white/10 p-3">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText size={18} className="shrink-0 text-primary" />
                        <span className="truncate text-xs font-medium text-white">
                          {fileName || "Attached file"}
                        </span>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setFileUrl("");
                          setFileName("");
                        }}
                        className="text-xs text-red-400 hover:bg-red-500/20"
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <input
                        ref={docInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={handleDocUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => docInputRef.current?.click()}
                        disabled={uploadingDoc}
                        className="border-dashed border-white/30 bg-white/5 text-white/90 hover:bg-white/10 hover:text-white"
                      >
                        {uploadingDoc ? (
                          <>
                            <Loader2 size={16} className="mr-2 animate-spin" />
                            Uploading File...
                          </>
                        ) : (
                          <>
                            <Upload size={16} className="mr-2" />
                            Attach Document / PDF
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Submit Action */}
                <div className="flex items-center justify-end gap-3 pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("works")}
                    className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || uploadingImage || uploadingDoc}
                    className="bg-primary font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} className="mr-2" />
                        Submit Work
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: MY WORKS */}
        {activeTab === "works" && (
          <div className="mt-6 space-y-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-bold text-white sm:text-2xl">My Works</h2>
                <p className="text-sm text-white/60">
                  Track the review progress of your submissions ({submissions.length} total).
                </p>
              </div>
              <Button
                onClick={() => setActiveTab("submit")}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <PlusCircle size={16} className="mr-1.5" />
                Submit New Work
              </Button>
            </div>

            {loadingWorks ? (
              <div className="flex justify-center py-16">
                <Loader2 size={28} className="animate-spin text-primary" />
              </div>
            ) : submissions.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
                <FileText size={42} className="mx-auto text-white/30" />
                <h3 className="mt-3 text-lg font-semibold text-white">No works submitted yet</h3>
                <p className="mt-1 text-sm text-white/60">
                  You haven't submitted any speeches, poems, essays or drawings yet.
                </p>
                <Button
                  onClick={() => setActiveTab("submit")}
                  className="mt-5 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <PlusCircle size={16} className="mr-1.5" />
                  Submit Your First Work
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {submissions.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between overflow-hidden rounded-xl border border-white/10 bg-white/5 transition hover:border-white/20 hover:bg-white/10"
                  >
                    {/* Optional Thumbnail */}
                    {item.media_url && (
                      <div className="relative h-44 w-full overflow-hidden bg-black/40">
                        <img
                          src={item.media_url}
                          alt={item.title}
                          className="h-full w-full object-cover transition duration-300 hover:scale-105"
                        />
                        <span className="absolute left-2.5 top-2.5 rounded bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
                          {item.work_type}
                        </span>
                      </div>
                    )}

                    <div className="p-4">
                      {!item.media_url && (
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="rounded bg-white/10 px-2 py-0.5 text-xs font-medium text-white/80">
                            {item.work_type}
                          </span>
                          <StatusBadge status={item.status} />
                        </div>
                      )}

                      {item.media_url && (
                        <div className="mb-2 flex justify-end">
                          <StatusBadge status={item.status} />
                        </div>
                      )}

                      <h3 className="line-clamp-2 font-bold text-white">{item.title}</h3>

                      {item.description && (
                        <p className="mt-1.5 line-clamp-2 text-xs text-white/70">
                          {item.description}
                        </p>
                      )}

                      {item.content && (
                        <p className="mt-2 line-clamp-3 text-xs text-white/50">{item.content}</p>
                      )}

                      {item.file_name && (
                        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-primary">
                          <FileText size={13} />
                          <span className="truncate">{item.file_name}</span>
                        </div>
                      )}

                      {item.admin_notes && (
                        <div className="mt-3 rounded-lg border border-primary/20 bg-primary/10 p-2 text-xs text-primary">
                          <strong>Admin Feedback:</strong> {item.admin_notes}
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between border-t border-white/10 bg-black/20 px-4 py-2.5 text-xs">
                      <span className="text-white/50">{formatDate(item.created_at)}</span>

                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setViewItem(item)}
                          className="h-8 px-2 text-xs text-white/90 hover:bg-white/10 hover:text-white"
                        >
                          <Eye size={13} className="mr-1" />
                          View
                        </Button>

                        {/* Edit and Delete available only while "Submitted" or "Under Review" */}
                        {(item.status === "Submitted" || item.status === "Under Review") && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditItem(item)}
                              className="h-8 px-2 text-xs text-blue-400 hover:bg-blue-500/10"
                            >
                              <Edit3 size={13} className="mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeleteConfirmId(item.id)}
                              className="h-8 px-2 text-xs text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 size={13} />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* VIEW SUBMISSION MODAL */}
      <Dialog open={Boolean(viewItem)} onOpenChange={(open) => !open && setViewItem(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto border-white/10 bg-ink text-white font-enquiry">
          {viewItem && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/80">
                    {viewItem.work_type}
                  </span>
                  <StatusBadge status={viewItem.status} />
                </div>
                <DialogTitle className="mt-2 text-xl font-bold text-white">
                  {viewItem.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-white/60">
                  Submitted on {formatDate(viewItem.created_at)} • {viewItem.student_name} (Batch{" "}
                  {viewItem.batch})
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 space-y-4">
                {/* Description */}
                {viewItem.description && (
                  <div className="rounded-lg bg-white/5 p-3 text-sm italic text-white/80">
                    {viewItem.description}
                  </div>
                )}

                {/* Image display */}
                {viewItem.media_url && (
                  <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40">
                    <img
                      src={viewItem.media_url}
                      alt={viewItem.title}
                      className="max-h-96 w-full object-contain"
                    />
                  </div>
                )}

                {/* Content text */}
                {viewItem.content && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm leading-relaxed text-white/90 whitespace-pre-wrap">
                    {viewItem.content}
                  </div>
                )}

                {/* Attached file link */}
                {viewItem.file_url && (
                  <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText size={18} className="shrink-0 text-primary" />
                      <span className="truncate text-xs font-medium text-white">
                        {viewItem.file_name || "Download Attached File"}
                      </span>
                    </div>
                    <a
                      href={viewItem.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:bg-primary/90"
                    >
                      <Download size={13} />
                      Download
                    </a>
                  </div>
                )}

                {/* Admin notes */}
                {viewItem.admin_notes && (
                  <div className="rounded-lg border border-primary/20 bg-primary/10 p-3 text-xs text-primary">
                    <strong>Admin Review Notes:</strong> {viewItem.admin_notes}
                  </div>
                )}
              </div>

              <DialogFooter className="mt-4">
                <Button
                  onClick={() => setViewItem(null)}
                  variant="outline"
                  className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* EDIT SUBMISSION MODAL */}
      <Dialog open={Boolean(editItem)} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto border-white/10 bg-ink text-white font-enquiry">
          {editItem && (
            <form onSubmit={handleUpdateWork}>
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-white">Edit Submission</DialogTitle>
                <DialogDescription className="text-xs text-white/60">
                  Update your work while it is still under review.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs text-white/90">Work Title</Label>
                  <Input
                    value={editItem.title}
                    onChange={(e) => setEditItem({ ...editItem, title: e.target.value })}
                    required
                    className="border-white/20 bg-white/10 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-white/90">Work Type</Label>
                  <Select
                    value={editItem.work_type}
                    onValueChange={(val: StudentWorkType) =>
                      setEditItem({ ...editItem, work_type: val })
                    }
                  >
                    <SelectTrigger className="border-white/20 bg-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-ink text-white">
                      {WORK_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-white/90">Description</Label>
                  <Input
                    value={editItem.description || ""}
                    onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                    className="border-white/20 bg-white/10 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-white/90">Content / Writing Text</Label>
                  <Textarea
                    rows={6}
                    value={editItem.content || ""}
                    onChange={(e) => setEditItem({ ...editItem, content: e.target.value })}
                    className="border-white/20 bg-white/10 text-white"
                  />
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditItem(null)}
                  className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog
        open={Boolean(deleteConfirmId)}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <DialogContent className="border-white/10 bg-ink text-white font-enquiry">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">Delete Submission</DialogTitle>
            <DialogDescription className="text-xs text-white/60">
              Are you sure you want to delete this submitted work? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
              className="border-white/20 bg-white/10 text-white hover:bg-white/20"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSubmission}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
