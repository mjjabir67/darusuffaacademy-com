import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeading, Panel, StatCard, EmptyState } from "@/components/admin/ui";
import {
  formatDate,
  type Enquiry,
  type Post,
  type Announcement,
  type AdmissionApplication,
} from "@/lib/cms";
import { ArrowRight, Clock, UserCheck, FileText, Globe } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

interface SubmissionSummary {
  id: string;
  student_id: string;
  student_name: string;
  batch: string;
  title: string;
  work_type: string;
  description?: string;
  status: "Submitted" | "Under Review" | "Approved" | "Rejected";
  is_published: boolean;
  created_at: string;
}

function Dashboard() {
  const { data } = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: async () => {
      const [
        enquiriesRes,
        posts,
        announcements,
        gallery,
        courses,
        staffSettings,
        committeeSettings,
        admissionAppsRes,
        submissionsRes,
      ] = await Promise.all([
        supabase.from("enquiries").select("*").order("created_at", { ascending: false }),
        supabase.from("posts").select("*").order("created_at", { ascending: false }),
        supabase.from("announcements").select("*").order("created_at", { ascending: false }),
        supabase.from("gallery_images").select("id"),
        supabase.from("courses").select("id"),
        supabase.from("site_settings").select("value").eq("key", "staff_members").maybeSingle(),
        supabase.from("site_settings").select("value").eq("key", "committee_members").maybeSingle(),
        (async () => {
          try {
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData.session?.access_token;
            const res = await fetch("/api/admissions/applications", {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (res.ok) {
              const json = await res.json();
              if (Array.isArray(json.applications)) {
                return { data: { value: json.applications } };
              }
            }
          } catch {
            // fallback
          }
          return { data: { value: [] } };
        })(),
        (async () => {
          try {
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData.session?.access_token;
            const res = await fetch("/api/admin/submissions", {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (res.ok) {
              const json = await res.json();
              return (json.submissions || []) as SubmissionSummary[];
            }
          } catch {
            // fallback
          }
          return [];
        })(),
      ]);

      const staffVal = staffSettings.data?.value;
      const committeeVal = committeeSettings.data?.value;
      const staffCount = Array.isArray(staffVal) ? staffVal.length : 4; // default 4
      const committeeCount = Array.isArray(committeeVal) ? committeeVal.length : 0;

      // Ensure enquiries ONLY contains general enquiries, filtering out any legacy misclassified applications
      const allEnquiries = (enquiriesRes.data ?? []) as Enquiry[];
      const validEnquiries = allEnquiries.filter(
        (e) => !e.message?.includes("[ADMISSION APPLICATION]"),
      );

      const admissionApplications = Array.isArray(admissionAppsRes.data?.value)
        ? (admissionAppsRes.data?.value as AdmissionApplication[])
        : [];

      const submissions = (submissionsRes || []) as SubmissionSummary[];

      return {
        enquiries: validEnquiries,
        admissionApplications,
        submissions,
        posts: (posts.data ?? []) as Post[],
        announcements: (announcements.data ?? []) as Announcement[],
        galleryCount: gallery.data?.length ?? 0,
        courseCount: courses.data?.length ?? 0,
        staffCount,
        committeeCount,
      };
    },
  });

  const enquiries = data?.enquiries ?? [];
  const admissionApplications = data?.admissionApplications ?? [];
  const submissions = data?.submissions ?? [];
  const posts = data?.posts ?? [];
  const announcements = data?.announcements ?? [];
  const unreadEnquiries = enquiries.filter((e) => !e.is_read).length;
  const newApplications = admissionApplications.filter((a) => a.status === "New").length;
  const pendingSubmissions = submissions.filter((s) => s.status === "Submitted").length;
  const publishedSubmissions = submissions.filter((s) => s.is_published).length;

  return (
    <>
      <PageHeading
        title="Dashboard"
        description="An overview of everything happening on the Darusuffa Academy website."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Admission Applications" value={admissionApplications.length} />
        <StatCard label="New Applications" value={newApplications} />
        <StatCard label="Student Works" value={submissions.length} />
        <StatCard label="Pending Works Review" value={pendingSubmissions} />
        <StatCard label="Unread Enquiries" value={unreadEnquiries} />
        <StatCard label="News & Events" value={posts.length} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Student Works & Submissions Panel */}
        <Panel title="Recent Student Works & Submissions">
          {submissions.length === 0 ? (
            <EmptyState>No student works uploaded yet.</EmptyState>
          ) : (
            <ul className="space-y-3">
              {submissions.slice(0, 5).map((sub) => (
                <li
                  key={sub.id}
                  className="flex items-start justify-between gap-4 rounded-xl bg-muted p-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                        {sub.work_type}
                      </span>
                      <p className="truncate font-semibold text-foreground font-manjari text-sm">
                        {sub.title}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          sub.status === "Approved"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : sub.status === "Under Review"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : sub.status === "Rejected"
                                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        }`}
                      >
                        {sub.status}
                      </span>
                      {sub.is_published && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <Globe size={10} /> Published
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      By <strong className="text-foreground font-medium">{sub.student_name}</strong>{" "}
                      (Batch {sub.batch})
                    </p>
                    {sub.description && (
                      <p className="line-clamp-1 text-xs text-muted-foreground/90 mt-0.5 font-manjari">
                        {sub.description}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="whitespace-nowrap text-xs text-muted-foreground flex items-center gap-1">
                      <Clock size={12} />
                      {formatDate(sub.created_at)}
                    </span>
                    <Link
                      to="/admin/students"
                      search={{ tab: "submissions", submissionId: sub.id }}
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted transition"
                    >
                      Review
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/admin/students"
            search={{ tab: "submissions" }}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline underline-offset-4"
          >
            Manage all student works ({submissions.length}) <ArrowRight size={14} />
          </Link>
        </Panel>

        {/* Admission Applications Panel */}
        <Panel title="Recent Admission Applications">
          {admissionApplications.length === 0 ? (
            <EmptyState>No admission applications received yet.</EmptyState>
          ) : (
            <ul className="space-y-3">
              {admissionApplications.slice(0, 5).map((app) => (
                <li
                  key={app.id}
                  className="flex items-start justify-between gap-4 rounded-xl bg-muted p-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{app.student_name}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          app.status === "New"
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            : app.status === "Accepted"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : app.status === "Reviewing"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : "bg-muted-foreground/10 text-muted-foreground"
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Class: {app.class_to_join} · {app.phone}
                    </p>
                    {app.place && (
                      <p className="text-xs text-muted-foreground/80">
                        {app.place}, {app.district}
                      </p>
                    )}
                  </div>
                  <span className="whitespace-nowrap text-xs text-muted-foreground flex items-center gap-1">
                    <Clock size={12} />
                    {formatDate(app.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/admin/admission"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline underline-offset-4"
          >
            Manage all admission applications <ArrowRight size={14} />
          </Link>
        </Panel>

        {/* Enquiries Panel */}
        <Panel title="Recent General Enquiries">
          {enquiries.length === 0 ? (
            <EmptyState>No website enquiries yet.</EmptyState>
          ) : (
            <ul className="space-y-3">
              {enquiries.slice(0, 5).map((e) => (
                <li
                  key={e.id}
                  className="flex items-start justify-between gap-4 rounded-xl bg-muted p-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{e.student_name}</p>
                      {!e.is_read && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {e.course || "General Enquiry"} · {e.phone || e.email}
                    </p>
                    {e.message && (
                      <p className="line-clamp-1 text-xs text-muted-foreground/80 mt-0.5">
                        {e.message}
                      </p>
                    )}
                  </div>
                  <span className="whitespace-nowrap text-xs text-muted-foreground flex items-center gap-1">
                    <Clock size={12} />
                    {formatDate(e.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/admin/enquiries"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline underline-offset-4"
          >
            View all enquiries <ArrowRight size={14} />
          </Link>
        </Panel>

        <Panel title="Recent updates">
          {posts.length === 0 ? (
            <EmptyState>Nothing published yet.</EmptyState>
          ) : (
            <ul className="space-y-3">
              {posts.slice(0, 5).map((p) => (
                <li key={p.id} className="rounded-xl bg-muted p-4">
                  <p className="font-medium">{p.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {p.kind === "event" ? "Event" : "News"} · {p.published ? "Published" : "Draft"}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/admin/news"
            className="mt-4 inline-block text-sm text-primary underline underline-offset-4"
          >
            Manage news & events
          </Link>
        </Panel>
      </div>
    </>
  );
}
