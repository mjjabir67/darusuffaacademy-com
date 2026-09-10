import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeading, Panel, StatCard, EmptyState } from "@/components/admin/ui";
import { formatDate, type Enquiry, type Post, type Announcement } from "@/lib/cms";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const { data } = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: async () => {
      const [enquiries, posts, announcements, gallery, courses] = await Promise.all([
        supabase.from("enquiries").select("*").order("created_at", { ascending: false }),
        supabase.from("posts").select("*").order("created_at", { ascending: false }),
        supabase
          .from("announcements")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("gallery_images").select("id"),
        supabase.from("courses").select("id"),
      ]);
      return {
        enquiries: (enquiries.data ?? []) as Enquiry[],
        posts: (posts.data ?? []) as Post[],
        announcements: (announcements.data ?? []) as Announcement[],
        galleryCount: gallery.data?.length ?? 0,
        courseCount: courses.data?.length ?? 0,
      };
    },
  });

  const enquiries = data?.enquiries ?? [];
  const posts = data?.posts ?? [];
  const announcements = data?.announcements ?? [];
  const unread = enquiries.filter((e) => !e.is_read).length;

  return (
    <>
      <PageHeading
        title="Dashboard"
        description="An overview of everything happening on the Darusuffa Academy website."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Enquiries" value={enquiries.length} />
        <StatCard label="Unread enquiries" value={unread} />
        <StatCard label="News & events" value={posts.length} />
        <StatCard label="Gallery images" value={data?.galleryCount ?? 0} />
        <StatCard label="Courses" value={data?.courseCount ?? 0} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Recent enquiries">
          {enquiries.length === 0 ? (
            <EmptyState>No enquiries yet.</EmptyState>
          ) : (
            <ul className="space-y-3">
              {enquiries.slice(0, 5).map((e) => (
                <li
                  key={e.id}
                  className="flex items-start justify-between gap-4 rounded-xl bg-muted p-4"
                >
                  <div>
                    <p className="font-medium">{e.student_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {e.course} · {e.phone}
                    </p>
                  </div>
                  <span className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatDate(e.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/admin/enquiries"
            className="mt-4 inline-block text-sm text-primary underline underline-offset-4"
          >
            View all enquiries
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
                    {p.kind === "event" ? "Event" : "News"} ·{" "}
                    {p.published ? "Published" : "Draft"}
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

        <Panel title="Recent announcements" className="lg:col-span-2">
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
