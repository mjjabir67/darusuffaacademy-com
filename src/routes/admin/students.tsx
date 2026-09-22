import { useState, useMemo, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  UserPlus,
  GraduationCap,
  Search,
  Filter,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  KeyRound,
  FileText,
  Image as ImageIcon,
  Download,
  AlertCircle,
  Sparkles,
  Layers,
  RefreshCw,
  ExternalLink,
  Globe,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeading } from "@/components/admin/ui";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { formatDate } from "@/lib/cms";

export const Route = createFileRoute("/admin/students")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { tab?: "students" | "submissions"; submissionId?: string } => {
    return {
      tab:
        search.tab === "submissions"
          ? "submissions"
          : search.tab === "students"
            ? "students"
            : undefined,
      submissionId: typeof search.submissionId === "string" ? search.submissionId : undefined,
    };
  },
  component: AdminStudentsPage,
});

type StudentBatch = "G4" | "G5" | "G6" | "G7" | "G8" | "G9";
const BATCHES: StudentBatch[] = ["G4", "G5", "G6", "G7", "G8", "G9"];

type StudentWorkType = "Speech" | "Poem" | "Article" | "Story" | "Essay" | "Drawing" | "Other";

const WORK_TYPES: StudentWorkType[] = [
  "Speech",
  "Poem",
  "Article",
  "Story",
  "Essay",
  "Drawing",
  "Other",
];

interface Student {
  id: string;
  name: string;
  batch: StudentBatch;
  login_code: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface Submission {
  id: string;
  student_id: string;
  student_name: string;
  batch: StudentBatch;
  title: string;
  work_type: StudentWorkType;
  description?: string;
  content?: string;
  media_url?: string;
  file_url?: string;
  file_name?: string;
  status: "Submitted" | "Under Review" | "Approved" | "Rejected";
  is_published?: boolean;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

function StatusBadge({ status }: { status: Submission["status"] }) {
  switch (status) {
    case "Approved":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/70 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 size={12} />
          Approved
        </span>
      );
    case "Rejected":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-100 dark:border-rose-800 dark:bg-rose-950/70 px-2.5 py-0.5 text-xs font-semibold text-rose-800 dark:text-rose-300">
          <XCircle size={12} />
          Rejected
        </span>
      );
    case "Under Review":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-100 dark:border-amber-800 dark:bg-amber-950/70 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
          <Clock size={12} />
          Under Review
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-100 dark:border-blue-800 dark:bg-blue-950/70 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:text-blue-300">
          <Clock size={12} />
          Submitted
        </span>
      );
  }
}

async function getAdminToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || "";
}

function AdminStudentsPage() {
  const queryClient = useQueryClient();
  const searchParams = Route.useSearch();
  const [activeTab, setActiveTab] = useState<"students" | "submissions">(
    searchParams.tab || "students",
  );

  // Filter states for students
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedBatchFilter, setSelectedBatchFilter] = useState<string>("All");

  // Filter states for submissions
  const [submissionSearch, setSubmissionSearch] = useState("");
  const [submissionBatchFilter, setSubmissionBatchFilter] = useState<string>("All");
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState<string>("All");
  const [submissionTypeFilter, setSubmissionTypeFilter] = useState<string>("All");
  const [submissionPublishFilter, setSubmissionPublishFilter] = useState<
    "All" | "Published" | "Unpublished"
  >("All");

  // Show/hide codes toggle
  const [revealCodes, setRevealCodes] = useState(false);

  // Student Dialogs
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentBatch, setNewStudentBatch] = useState<StudentBatch>("G4");
  const [newStudentCode, setNewStudentCode] = useState("");

  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [editStudentCode, setEditStudentCode] = useState("");
  const [deleteStudentId, setDeleteStudentId] = useState<string | null>(null);

  // Submission Dialogs
  const [viewSubmission, setViewSubmission] = useState<Submission | null>(null);
  const [editSubmissionStatus, setEditSubmissionStatus] =
    useState<Submission["status"]>("Submitted");
  const [editSubmissionPublished, setEditSubmissionPublished] = useState(false);
  const [editSubmissionNotes, setEditSubmissionNotes] = useState("");
  const [deleteSubmissionId, setDeleteSubmissionId] = useState<string | null>(null);

  // Queries
  const {
    data: students = [],
    isLoading: loadingStudents,
    refetch: refetchStudents,
  } = useQuery<Student[]>({
    queryKey: ["admin", "students"],
    queryFn: async () => {
      const token = await getAdminToken();
      const res = await fetch("/api/admin/students", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch students");
      const data = await res.json();
      return data.students || [];
    },
    refetchInterval: 5000,
  });

  const {
    data: submissions = [],
    isLoading: loadingSubmissions,
    refetch: refetchSubmissions,
  } = useQuery<Submission[]>({
    queryKey: ["admin", "submissions"],
    queryFn: async () => {
      const token = await getAdminToken();
      const res = await fetch("/api/admin/submissions", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch submissions");
      const data = await res.json();
      return data.submissions || [];
    },
    refetchInterval: 5000,
  });

  // Handle URL param tab or submissionId
  useEffect(() => {
    if (searchParams.tab) {
      setActiveTab(searchParams.tab);
    }
    if (searchParams.submissionId && submissions.length > 0) {
      const found = submissions.find((s) => s.id === searchParams.submissionId);
      if (found) {
        setViewSubmission(found);
        setEditSubmissionStatus(found.status);
        setEditSubmissionPublished(found.is_published);
        setEditSubmissionNotes(found.admin_notes || "");
      }
    }
  }, [searchParams.tab, searchParams.submissionId, submissions]);

  // Create Student Mutation
  const createStudentMutation = useMutation({
    mutationFn: async (payload: { name: string; batch: StudentBatch; login_code: string }) => {
      const token = await getAdminToken();
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to create student");
      return data.student;
    },
    onSuccess: () => {
      toast.success("Student added successfully!");
      setIsAddStudentOpen(false);
      setNewStudentName("");
      setNewStudentCode("");
      queryClient.invalidateQueries({ queryKey: ["admin", "students"] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Error creating student");
    },
  });

  // Update Student Mutation
  const updateStudentMutation = useMutation({
    mutationFn: async (payload: {
      id: string;
      name?: string;
      batch?: StudentBatch;
      login_code?: string;
      active?: boolean;
    }) => {
      const token = await getAdminToken();
      const res = await fetch("/api/admin/students", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to update student");
      return data.student;
    },
    onSuccess: () => {
      toast.success("Student updated successfully!");
      setEditStudent(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "students"] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Error updating student");
    },
  });

  // Delete Student Mutation
  const deleteStudentMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getAdminToken();
      const res = await fetch(`/api/admin/students?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to delete student");
      return true;
    },
    onSuccess: () => {
      toast.success("Student deleted successfully.");
      setDeleteStudentId(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "students"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "submissions"] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Error deleting student");
    },
  });

  // Update Submission Status & Notes Mutation
  const updateSubmissionMutation = useMutation({
    mutationFn: async (payload: {
      id: string;
      status?: Submission["status"];
      is_published?: boolean;
      admin_notes?: string;
    }) => {
      const token = await getAdminToken();
      const res = await fetch("/api/admin/submissions", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to update submission");
      return data.submission;
    },
    onSuccess: (updatedSub) => {
      toast.success("Submission updated successfully!");
      if (viewSubmission && viewSubmission.id === updatedSub.id) {
        setViewSubmission(updatedSub);
        setEditSubmissionPublished(Boolean(updatedSub.is_published));
        setEditSubmissionStatus(updatedSub.status);
      }
      queryClient.invalidateQueries({ queryKey: ["admin", "submissions"] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Error updating submission");
    },
  });

  // Delete Submission Mutation
  const deleteSubmissionMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getAdminToken();
      const res = await fetch(`/api/admin/submissions?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to delete submission");
      return true;
    },
    onSuccess: () => {
      toast.success("Submission removed.");
      setDeleteSubmissionId(null);
      if (viewSubmission) setViewSubmission(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "submissions"] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Error deleting submission");
    },
  });

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(studentSearch.toLowerCase().trim()) ||
        s.batch.toLowerCase().includes(studentSearch.toLowerCase().trim()) ||
        s.login_code.includes(studentSearch.trim());
      const matchesBatch = selectedBatchFilter === "All" || s.batch === selectedBatchFilter;
      return matchesSearch && matchesBatch;
    });
  }, [students, studentSearch, selectedBatchFilter]);

  // Filtered Submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      const q = submissionSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.title.toLowerCase().includes(q) ||
        s.student_name.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q)) ||
        (s.content && s.content.toLowerCase().includes(q));

      const matchesBatch = submissionBatchFilter === "All" || s.batch === submissionBatchFilter;
      const matchesStatus = submissionStatusFilter === "All" || s.status === submissionStatusFilter;
      const matchesType = submissionTypeFilter === "All" || s.work_type === submissionTypeFilter;
      const matchesPublish =
        submissionPublishFilter === "All" ||
        (submissionPublishFilter === "Published" && s.is_published) ||
        (submissionPublishFilter === "Unpublished" && !s.is_published);

      return matchesSearch && matchesBatch && matchesStatus && matchesType && matchesPublish;
    });
  }, [
    submissions,
    submissionSearch,
    submissionBatchFilter,
    submissionStatusFilter,
    submissionTypeFilter,
    submissionPublishFilter,
  ]);

  // Quick stats
  const pendingCount = submissions.filter((s) => s.status === "Submitted").length;
  const underReviewCount = submissions.filter((s) => s.status === "Under Review").length;
  const approvedCount = submissions.filter((s) => s.status === "Approved").length;
  const publishedCount = submissions.filter((s) => s.is_published).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeading
        title="Students & Works"
        description="Manage student directory, 3-digit login credentials, and review submitted creative works."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <Button
              id="admin-add-student-btn"
              onClick={() => setIsAddStudentOpen(true)}
              className="rounded-xl shadow-xs"
            >
              <UserPlus size={16} className="mr-1.5" />
              Add New Student
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetchStudents();
                refetchSubmissions();
              }}
              className="rounded-xl bg-card border-border text-foreground hover:bg-muted"
            >
              <RefreshCw size={14} className="mr-1.5" />
              Refresh
            </Button>
          </div>
        }
      />

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs uppercase font-semibold tracking-wider">Total Students</span>
            <Users size={18} className="text-primary" />
          </div>
          <div className="mt-2 font-display text-2xl font-bold text-foreground sm:text-3xl">
            {students.length}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Across Batches G4 - G9</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs uppercase font-semibold tracking-wider">Pending Review</span>
            <Clock size={18} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2 font-display text-2xl font-bold text-blue-600 dark:text-blue-400 sm:text-3xl">
            {pendingCount}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Awaiting faculty review</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs uppercase font-semibold tracking-wider">Under Review</span>
            <Clock size={18} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-2 font-display text-2xl font-bold text-amber-600 dark:text-amber-400 sm:text-3xl">
            {underReviewCount}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">In active assessment</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs uppercase font-semibold tracking-wider">Approved Works</span>
            <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 font-display text-2xl font-bold text-emerald-600 dark:text-emerald-400 sm:text-3xl">
            {approvedCount}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Published or approved</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("students")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
            activeTab === "students"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <GraduationCap size={16} />
          <span>Student Directory ({students.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("submissions")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
            activeTab === "submissions"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText size={16} />
          <span>Student Submissions ({submissions.length})</span>
          {pendingCount > 0 && (
            <Badge className="ml-1 bg-blue-600 text-white hover:bg-blue-700">
              {pendingCount} new
            </Badge>
          )}
        </button>
      </div>

      {/* TAB 1: STUDENT DIRECTORY */}
      {activeTab === "students" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-1 flex-wrap items-center gap-3">
              <div className="relative min-w-[220px] max-w-sm flex-1">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  placeholder="Search by student name or code..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="rounded-xl border-input bg-card pl-9 text-foreground placeholder:text-muted-foreground shadow-xs"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Batch:</span>
                <Select value={selectedBatchFilter} onValueChange={setSelectedBatchFilter}>
                  <SelectTrigger className="w-[120px] rounded-xl border-input bg-card text-foreground shadow-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-border bg-popover text-popover-foreground">
                    <SelectItem value="All">All Batches</SelectItem>
                    {BATCHES.map((b) => (
                      <SelectItem key={b} value={b}>
                        Batch {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRevealCodes(!revealCodes)}
                className="rounded-xl border-border bg-card text-xs font-medium text-foreground hover:bg-muted shadow-xs"
              >
                {revealCodes ? (
                  <>
                    <EyeOff size={13} className="mr-1.5 text-amber-600 dark:text-amber-400" />
                    Hide Login Codes
                  </>
                ) : (
                  <>
                    <Eye size={13} className="mr-1.5 text-primary" />
                    Show Login Codes
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-foreground font-enquiry">
                <thead className="border-b border-border bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3.5">Student Name</th>
                    <th className="px-4 py-3.5">Batch</th>
                    <th className="px-4 py-3.5">Login Code</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Works Submitted</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loadingStudents ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                        Loading student records...
                      </td>
                    </tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                        No students match your search or filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s) => {
                      const studentWorks = submissions.filter((w) => w.student_id === s.id);
                      return (
                        <tr key={s.id} className="transition-colors hover:bg-muted/40">
                          <td className="px-5 py-4 font-semibold text-foreground font-sans text-base">
                            {s.name}
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                              Batch {s.batch}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            {revealCodes ? (
                              <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-2.5 py-1 rounded-lg">
                                <KeyRound size={12} />
                                {s.login_code}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground bg-muted/60 px-2 py-1 rounded-lg">
                                <Lock size={11} />
                                •••
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <button
                              onClick={() =>
                                updateStudentMutation.mutate({
                                  id: s.id,
                                  active: !s.active,
                                })
                              }
                              className="inline-flex items-center gap-1.5 transition hover:opacity-80"
                              title="Click to toggle active status"
                            >
                              {s.active ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/70 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                                  <CheckCircle2 size={12} /> Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800/70 px-2.5 py-0.5 text-xs font-semibold text-zinc-700 dark:text-zinc-400">
                                  <XCircle size={12} /> Disabled
                                </span>
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-4 text-muted-foreground">
                            {studentWorks.length > 0 ? (
                              <button
                                onClick={() => {
                                  setActiveTab("submissions");
                                  setSubmissionSearch(s.name);
                                }}
                                className="font-semibold text-primary hover:underline"
                              >
                                {studentWorks.length} work{studentWorks.length > 1 ? "s" : ""}
                              </button>
                            ) : (
                              <span className="text-muted-foreground/70">0 works</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditStudent(s);
                                  setEditStudentCode(s.login_code);
                                }}
                                className="h-8 px-2 text-foreground hover:bg-muted"
                                title="Edit Student"
                              >
                                <Edit size={14} />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeleteStudentId(s.id)}
                                className="h-8 px-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                title="Delete Student"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STUDENT SUBMISSIONS */}
      {activeTab === "submissions" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div className="flex flex-1 flex-wrap items-center gap-3">
              <div className="relative min-w-[220px] max-w-sm flex-1">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  placeholder="Search by title, student, or text..."
                  value={submissionSearch}
                  onChange={(e) => setSubmissionSearch(e.target.value)}
                  className="rounded-xl border-input bg-card pl-9 text-foreground placeholder:text-muted-foreground shadow-xs font-manjari"
                />
              </div>

              {/* Batch Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Batch:</span>
                <Select value={submissionBatchFilter} onValueChange={setSubmissionBatchFilter}>
                  <SelectTrigger className="w-[100px] rounded-xl border-input bg-card text-foreground shadow-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-border bg-popover text-popover-foreground">
                    <SelectItem value="All">All</SelectItem>
                    {BATCHES.map((b) => (
                      <SelectItem key={b} value={b}>
                        Batch {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Status:</span>
                <Select value={submissionStatusFilter} onValueChange={setSubmissionStatusFilter}>
                  <SelectTrigger className="w-[130px] rounded-xl border-input bg-card text-foreground shadow-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-border bg-popover text-popover-foreground">
                    <SelectItem value="All">All Statuses</SelectItem>
                    <SelectItem value="Submitted">Submitted</SelectItem>
                    <SelectItem value="Under Review">Under Review</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Type Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Type:</span>
                <Select value={submissionTypeFilter} onValueChange={setSubmissionTypeFilter}>
                  <SelectTrigger className="w-[120px] rounded-xl border-input bg-card text-foreground shadow-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-border bg-popover text-popover-foreground">
                    <SelectItem value="All">All Types</SelectItem>
                    {WORK_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Publish Visibility Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Visibility:</span>
                <Select
                  value={submissionPublishFilter}
                  onValueChange={(val: "All" | "Published" | "Unpublished") =>
                    setSubmissionPublishFilter(val)
                  }
                >
                  <SelectTrigger className="w-[160px] rounded-xl border-input bg-card text-foreground shadow-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-border bg-popover text-popover-foreground">
                    <SelectItem value="All">All Visibility ({submissions.length})</SelectItem>
                    <SelectItem value="Published">
                      Published on Academic ({publishedCount})
                    </SelectItem>
                    <SelectItem value="Unpublished">
                      Unpublished ({submissions.length - publishedCount})
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Submissions Grid */}
          {loadingSubmissions ? (
            <div className="py-16 text-center text-muted-foreground">
              Loading student submissions...
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/60 p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <FileText size={24} />
              </div>
              <h3 className="mt-4 font-display text-base font-semibold text-foreground">
                No submissions found
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                No submissions match the selected search and filter criteria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition hover:border-primary/40 hover:shadow-sm"
                >
                  {/* Image preview if any */}
                  {sub.media_url && (
                    <div className="relative h-44 w-full overflow-hidden bg-muted/60">
                      <img
                        src={sub.media_url}
                        alt={sub.title}
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute left-3 top-3 rounded-md bg-black/70 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-xs">
                        {sub.work_type}
                      </span>
                    </div>
                  )}

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">
                            {sub.work_type}
                          </span>
                          <StatusBadge status={sub.status} />
                        </div>

                        {sub.is_published ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/70 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                            <Globe size={11} />
                            Live on Academic
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                            Private
                          </span>
                        )}
                      </div>

                      <h3 className="line-clamp-2 font-display text-base font-bold text-foreground font-manjari">
                        {sub.title}
                      </h3>

                      <div className="mt-1 text-xs text-muted-foreground">
                        By{" "}
                        <strong className="text-foreground font-semibold">
                          {sub.student_name}
                        </strong>{" "}
                        (Batch {sub.batch})
                      </div>

                      {sub.description && (
                        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground leading-relaxed font-manjari">
                          {sub.description}
                        </p>
                      )}

                      {sub.content && (
                        <p className="mt-1.5 line-clamp-3 text-xs text-foreground/80 leading-relaxed font-manjari">
                          {sub.content}
                        </p>
                      )}

                      {sub.file_name && (
                        <div className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-primary">
                          <FileText size={13} />
                          <span className="truncate">{sub.file_name}</span>
                        </div>
                      )}

                      {sub.admin_notes && (
                        <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-2.5 text-xs text-primary font-enquiry">
                          <strong className="font-semibold">Faculty Note:</strong> {sub.admin_notes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-3 text-xs">
                    <span className="text-muted-foreground">{formatDate(sub.created_at)}</span>

                    <div className="flex items-center gap-1.5">
                      {sub.is_published ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            updateSubmissionMutation.mutate({
                              id: sub.id,
                              is_published: false,
                            });
                          }}
                          disabled={updateSubmissionMutation.isPending}
                          className="h-8 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 px-2.5 text-xs font-semibold text-amber-800 dark:text-amber-300 hover:bg-amber-100"
                          title="Unpublish from public Academic page"
                        >
                          Unpublish
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            updateSubmissionMutation.mutate({
                              id: sub.id,
                              is_published: true,
                              status: "Approved",
                            });
                          }}
                          disabled={updateSubmissionMutation.isPending}
                          className="h-8 border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40 px-2.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
                          title="Publish to public Academic page"
                        >
                          <Globe size={11} className="mr-1" />
                          Publish
                        </Button>
                      )}

                      <Button
                        size="sm"
                        onClick={() => {
                          setViewSubmission(sub);
                          setEditSubmissionStatus(sub.status);
                          setEditSubmissionPublished(Boolean(sub.is_published));
                          setEditSubmissionNotes(sub.admin_notes || "");
                        }}
                        className="h-8 px-2.5 text-xs rounded-lg"
                      >
                        <Eye size={13} className="mr-1" />
                        Review
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteSubmissionId(sub.id)}
                        className="h-8 px-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        title="Delete submission"
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DIALOG: ADD NEW STUDENT */}
      <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
        <DialogContent className="border-border bg-card text-foreground rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold text-foreground">
              Add New Student
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Register a student for the portal with their Name, Batch, and 3-digit Login Code.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-3 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Student Name</Label>
              <Input
                placeholder="Full student name"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                className="rounded-xl border-input bg-background text-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Batch</Label>
              <Select
                value={newStudentBatch}
                onValueChange={(val: StudentBatch) => setNewStudentBatch(val)}
              >
                <SelectTrigger className="rounded-xl border-input bg-background text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-border bg-popover text-popover-foreground">
                  {BATCHES.map((b) => (
                    <SelectItem key={b} value={b}>
                      Batch {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground">
                  Login Code (3 Digits)
                </Label>
                <span className="text-xs text-muted-foreground">e.g. 143</span>
              </div>
              <Input
                maxLength={3}
                placeholder="143"
                value={newStudentCode}
                onChange={(e) => setNewStudentCode(e.target.value.replace(/\D/g, "").slice(0, 3))}
                className="font-mono text-center tracking-widest rounded-xl border-input bg-background text-foreground text-lg font-bold"
              />
            </div>
          </div>

          <DialogFooter className="mt-6 flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsAddStudentOpen(false)}
              className="rounded-xl border-border text-foreground hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!newStudentName.trim()) {
                  toast.error("Please enter student name");
                  return;
                }
                if (!newStudentCode || newStudentCode.length !== 3) {
                  toast.error("Login code must be exactly 3 digits");
                  return;
                }
                createStudentMutation.mutate({
                  name: newStudentName.trim(),
                  batch: newStudentBatch,
                  login_code: newStudentCode,
                });
              }}
              disabled={createStudentMutation.isPending}
              className="rounded-xl"
            >
              {createStudentMutation.isPending ? "Adding..." : "Add Student"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: EDIT STUDENT */}
      <Dialog open={Boolean(editStudent)} onOpenChange={(open) => !open && setEditStudent(null)}>
        <DialogContent className="border-border bg-card text-foreground rounded-2xl sm:max-w-md">
          {editStudent && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl font-bold text-foreground">
                  Edit Student: {editStudent.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Update student information, batch, or reset their 3-digit login code.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-3 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Student Name</Label>
                  <Input
                    value={editStudent.name}
                    onChange={(e) => setEditStudent({ ...editStudent, name: e.target.value })}
                    className="rounded-xl border-input bg-background text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Batch</Label>
                  <Select
                    value={editStudent.batch}
                    onValueChange={(val: StudentBatch) =>
                      setEditStudent({ ...editStudent, batch: val })
                    }
                  >
                    <SelectTrigger className="rounded-xl border-input bg-background text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-popover text-popover-foreground">
                      {BATCHES.map((b) => (
                        <SelectItem key={b} value={b}>
                          Batch {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-foreground">
                      Login Code (3 Digits)
                    </Label>
                    <span className="text-xs text-muted-foreground">Current or new 3 digits</span>
                  </div>
                  <Input
                    maxLength={3}
                    value={editStudentCode}
                    onChange={(e) =>
                      setEditStudentCode(e.target.value.replace(/\D/g, "").slice(0, 3))
                    }
                    className="font-mono text-center tracking-widest rounded-xl border-input bg-background text-foreground text-lg font-bold"
                  />
                </div>

                <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-3.5">
                  <div>
                    <Label className="text-xs font-semibold text-foreground">Active Status</Label>
                    <p className="text-xs text-muted-foreground">
                      Allow student to login to portal
                    </p>
                  </div>
                  <Switch
                    checked={editStudent.active}
                    onCheckedChange={(checked) =>
                      setEditStudent({ ...editStudent, active: checked })
                    }
                  />
                </div>
              </div>

              <DialogFooter className="mt-6 flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditStudent(null)}
                  className="rounded-xl border-border text-foreground hover:bg-muted"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!editStudent.name.trim()) {
                      toast.error("Please enter student name");
                      return;
                    }
                    if (editStudentCode && editStudentCode.length !== 3) {
                      toast.error("Login code must be exactly 3 digits");
                      return;
                    }
                    updateStudentMutation.mutate({
                      id: editStudent.id,
                      name: editStudent.name.trim(),
                      batch: editStudent.batch,
                      login_code: editStudentCode,
                      active: editStudent.active,
                    });
                  }}
                  disabled={updateStudentMutation.isPending}
                  className="rounded-xl"
                >
                  {updateStudentMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* DIALOG: REVIEW & MANAGE SUBMISSION */}
      <Dialog
        open={Boolean(viewSubmission)}
        onOpenChange={(open) => !open && setViewSubmission(null)}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-border bg-card text-foreground rounded-2xl">
          {viewSubmission && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-md bg-muted px-2.5 py-0.5 text-xs font-semibold text-foreground">
                    {viewSubmission.work_type}
                  </span>
                  <StatusBadge status={viewSubmission.status} />
                </div>
                <DialogTitle className="mt-2 font-display text-xl font-bold text-foreground font-manjari">
                  {viewSubmission.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  By {viewSubmission.student_name} (Batch {viewSubmission.batch}) • Submitted on{" "}
                  {formatDate(viewSubmission.created_at)}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 space-y-4">
                {/* Description */}
                {viewSubmission.description && (
                  <div className="rounded-xl bg-muted/40 p-3.5 text-sm italic text-foreground/90 font-manjari border border-border">
                    {viewSubmission.description}
                  </div>
                )}

                {/* Image */}
                {viewSubmission.media_url && (
                  <div className="overflow-hidden rounded-2xl border border-border bg-muted/40">
                    <img
                      src={viewSubmission.media_url}
                      alt={viewSubmission.title}
                      className="max-h-96 w-full object-contain"
                    />
                  </div>
                )}

                {/* Content / Writing */}
                {viewSubmission.content && (
                  <div className="rounded-2xl border border-border bg-background p-4 text-sm leading-relaxed text-foreground whitespace-pre-wrap font-manjari">
                    {viewSubmission.content}
                  </div>
                )}

                {/* File Attachment */}
                {viewSubmission.file_url && (
                  <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-3.5">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText size={18} className="shrink-0 text-primary" />
                      <span className="truncate text-xs font-medium text-foreground">
                        {viewSubmission.file_name || "Attached File"}
                      </span>
                    </div>
                    <a
                      href={viewSubmission.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
                    >
                      <Download size={13} />
                      Download
                    </a>
                  </div>
                )}

                {/* Faculty Review Section */}
                <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-primary">
                    Review Decision & Faculty Feedback
                  </h4>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">Change Status</Label>
                    <Select
                      value={editSubmissionStatus}
                      onValueChange={(val: Submission["status"]) => setEditSubmissionStatus(val)}
                    >
                      <SelectTrigger className="rounded-xl border-input bg-background text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-border bg-popover text-popover-foreground">
                        <SelectItem value="Submitted">Submitted (Pending)</SelectItem>
                        <SelectItem value="Under Review">Under Review</SelectItem>
                        <SelectItem value="Approved">Approved</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Publish on Academic Page Control */}
                  <div className="flex items-center justify-between rounded-xl border border-border bg-background p-3.5">
                    <div className="space-y-0.5 pr-3">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <Globe
                          size={14}
                          className={
                            editSubmissionPublished
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-muted-foreground"
                          }
                        />
                        <span>Publish on Public Academic Page</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {editSubmissionPublished
                          ? "Visible to public visitors in the Student Works section on the Academic page."
                          : "Private: Hidden from the public Academic page (only visible to faculty & student)."}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        const next = !editSubmissionPublished;
                        setEditSubmissionPublished(next);
                        if (next && editSubmissionStatus !== "Approved") {
                          setEditSubmissionStatus("Approved");
                        }
                      }}
                      className={`h-8 shrink-0 px-3 text-xs font-semibold rounded-lg transition ${
                        editSubmissionPublished
                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                          : "border border-border bg-muted text-foreground hover:bg-muted/80"
                      }`}
                    >
                      {editSubmissionPublished ? "Published (Live)" : "Set Published"}
                    </Button>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">
                      Faculty Notes / Feedback
                    </Label>
                    <Textarea
                      rows={3}
                      placeholder="Add notes or feedback visible to the student..."
                      value={editSubmissionNotes}
                      onChange={(e) => setEditSubmissionNotes(e.target.value)}
                      className="rounded-xl border-input bg-background text-foreground placeholder:text-muted-foreground font-manjari"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-6 flex items-center justify-between sm:justify-between">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteSubmissionId(viewSubmission.id)}
                  className="rounded-xl bg-rose-600 text-white hover:bg-rose-700"
                >
                  <Trash2 size={14} className="mr-1" />
                  Delete Submission
                </Button>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setViewSubmission(null)}
                    className="rounded-xl border-border text-foreground hover:bg-muted"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      updateSubmissionMutation.mutate({
                        id: viewSubmission.id,
                        status: editSubmissionStatus,
                        is_published: editSubmissionPublished,
                        admin_notes: editSubmissionNotes,
                      });
                    }}
                    disabled={updateSubmissionMutation.isPending}
                    className="rounded-xl"
                  >
                    {updateSubmissionMutation.isPending ? "Saving..." : "Save Review"}
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* DELETE STUDENT CONFIRMATION */}
      <Dialog
        open={Boolean(deleteStudentId)}
        onOpenChange={(open) => !open && setDeleteStudentId(null)}
      >
        <DialogContent className="border-border bg-card text-foreground rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold text-foreground">
              Delete Student
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to delete this student and all their submitted works? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteStudentId(null)}
              className="rounded-xl border-border text-foreground hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteStudentId && deleteStudentMutation.mutate(deleteStudentId)}
              disabled={deleteStudentMutation.isPending}
              className="rounded-xl bg-rose-600 text-white hover:bg-rose-700"
            >
              {deleteStudentMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE SUBMISSION CONFIRMATION */}
      <Dialog
        open={Boolean(deleteSubmissionId)}
        onOpenChange={(open) => !open && setDeleteSubmissionId(null)}
      >
        <DialogContent className="border-border bg-card text-foreground rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold text-foreground">
              Delete Submission
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to permanently delete this submission?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteSubmissionId(null)}
              className="rounded-xl border-border text-foreground hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteSubmissionId && deleteSubmissionMutation.mutate(deleteSubmissionId)
              }
              disabled={deleteSubmissionMutation.isPending}
              className="rounded-xl bg-rose-600 text-white hover:bg-rose-700"
            >
              {deleteSubmissionMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
