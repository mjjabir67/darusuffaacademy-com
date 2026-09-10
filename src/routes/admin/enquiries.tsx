import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeading, Panel, EmptyState } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { formatDate, type Enquiry } from "@/lib/cms";

export const Route = createFileRoute("/admin/enquiries")({
  component: Enquiries,
});

function Enquiries() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin", "enquiries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enquiries")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Enquiry[];
    },
  });

  const enquiries = data ?? [];

  const update = async (id: string, patch: Partial<Enquiry>) => {
    const { error } = await supabase.from("enquiries").update(patch).eq("id", id);
    if (error) return toast.error("Could not update the enquiry.");
    queryClient.invalidateQueries({ queryKey: ["admin"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this enquiry permanently?")) return;
    const { error } = await supabase.from("enquiries").delete().eq("id", id);
    if (error) return toast.error("Could not delete the enquiry.");
    toast.success("Enquiry deleted.");
    queryClient.invalidateQueries({ queryKey: ["admin"] });
  };

  return (
    <>
      <PageHeading
        title="Admission Enquiries"
        description="Every enquiry submitted through the admission page arrives here."
      />

      {enquiries.length === 0 ? (
        <EmptyState>No enquiries have been submitted yet.</EmptyState>
      ) : (
        <div className="space-y-4">
          {enquiries.map((e) => (
            <Panel key={e.id} className={e.is_read ? "" : "border-primary/40"}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-lg">{e.student_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Parent / guardian: {e.parent_name}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!e.is_read && (
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                      New
                    </span>
                  )}
                  {e.is_contacted && (
                    <span className="rounded-full bg-secondary/15 px-3 py-1 text-xs text-secondary">
                      Contacted
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatDate(e.created_at)}
                  </span>
                </div>
              </div>

              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd>
                    <a className="text-primary" href={`tel:${e.phone}`}>
                      {e.phone}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Email</dt>
                  <dd>
                    <a className="text-primary" href={`mailto:${e.email}`}>
                      {e.email}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Course</dt>
                  <dd>{e.course}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Admission year</dt>
                  <dd>{e.admission_year}</dd>
                </div>
              </dl>

              <p className="mt-4 rounded-xl bg-muted p-4 text-sm">{e.message}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => update(e.id, { is_read: !e.is_read })}
                >
                  Mark as {e.is_read ? "unread" : "read"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => update(e.id, { is_contacted: !e.is_contacted, is_read: true })}
                >
                  {e.is_contacted ? "Undo contacted" : "Mark as contacted"}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="rounded-full"
                  onClick={() => remove(e.id)}
                >
                  Delete
                </Button>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}
