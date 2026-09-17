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
import { ArrowRight, Clock } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

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
          return supabase
            .from("site_settings")
            .select("value")
            .eq("key", "admission_applications")
            .maybeSingle();
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

      return {
        enquiries: validEnquiries,
        admissionApplications,
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
  const posts = data?.posts ?? [];
  const announcements = data?.announcements ?? [];
  const unreadEnquiries = enquiries.filter((e) => !e.is_read).length;
  const newApplications = admissionApplications.filter((a) => a.status === "New").length;

  return (
    <>
      <PageHeading
        title="Dashboard"
        description="An overview of everything happening on the Darusuffa Academy website."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Admission Applications" value={admissionApplications.length} />
        <StatCard label="New Applications" value={newApplications} />
        <StatCard label="Enquiries" value={enquiries.length} />
        <StatCard label="Unread Enquiries" value={unreadEnquiries} />
        <StatCard label="News & Events" value={posts.length} />
        <StatCard label="Staff & Faculties" value={data?.staffCount ?? 4} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
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

        <Panel title="Recent announcements">
          {announcements.length === 0 ? (
            <EmptyState>No announcements yet.</EmptyState>
          ) : (
            <ul className="space-y-3">
              {announcements.slice(0, 4).map((a) => (
                <li key={a.id} className="rounded-xl bg-muted p-4">
                  <p className="font-medium">{a.title}</p>
                  <p className="text-sm text-muted-foreground">{a.body}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
