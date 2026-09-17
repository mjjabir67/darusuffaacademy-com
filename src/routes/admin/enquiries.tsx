import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, CheckCircle, Mail, Phone, BookOpen, Calendar, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeading, Panel, EmptyState } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { formatDate, type Enquiry } from "@/lib/cms";
import { ConfirmDeleteDialog } from "@/components/admin/ConfirmDeleteDialog";

export const Route = createFileRoute("/admin/enquiries")({
  component: Enquiries,
});

function Enquiries() {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Enquiry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data } = useQuery({
    queryKey: ["admin", "enquiries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enquiries")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const allRows = (data ?? []) as Enquiry[];
      // Filter out any admission applications that may have entered the enquiries table previously
      const misclassified = allRows.filter((e) => e.message?.includes("[ADMISSION APPLICATION]"));
      if (misclassified.length > 0) {
        // Trigger background migration endpoint so they are safely moved to admission_applications
        (async () => {
          try {
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData.session?.access_token;
            await fetch("/api/admissions/applications", {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            queryClient.invalidateQueries({ queryKey: ["admin", "enquiries"] });
            queryClient.invalidateQueries({ queryKey: ["admin", "admission-applications"] });
          } catch {
            // ignore
          }
        })();
      }
      return allRows.filter((e) => !e.message?.includes("[ADMISSION APPLICATION]"));
    },
  });

  const enquiries = data ?? [];

  const update = async (id: string, patch: Partial<Enquiry>) => {
    const { error } = await supabase.from("enquiries").update(patch).eq("id", id);
    if (error) {
      toast.error("Could not update the enquiry: " + error.message);
      return;
    }
    toast.success("Enquiry status updated.");
    queryClient.invalidateQueries({ queryKey: ["admin", "enquiries"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from("enquiries").delete().eq("id", deleteTarget.id);

      if (error) {
        toast.error("Could not delete the enquiry: " + error.message);
        return;
      }
      toast.success("Enquiry deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ["admin", "enquiries"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
      setDeleteTarget(null);
    } catch (err) {
      console.error("[Enquiries] Delete error:", err);
      toast.error("An unexpected error occurred while deleting.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <PageHeading
        title="Enquiries"
        description="General questions and enquiries submitted by visitors through the website."
      />

      {enquiries.length === 0 ? (
        <EmptyState>No enquiries have been submitted yet.</EmptyState>
      ) : (
        <div className="space-y-4">
          {enquiries.map((e) => (
            <Panel key={e.id} className={e.is_read ? "" : "border-primary/40 shadow-xs"}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    {e.student_name}
                  </h3>
                  {e.parent_name && e.parent_name !== "N/A" ? (
                    <p className="text-sm text-muted-foreground">
                      Parent / guardian: {e.parent_name}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">General website enquiry</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {!e.is_read && (
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      New
                    </span>
                  )}
                  {e.is_contacted && (
                    <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground border border-border">
                      Contacted
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDate(e.created_at)}
                  </span>
                </div>
              </div>

              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <dt className="text-xs text-muted-foreground font-medium">Phone</dt>
                    <dd>
                      <a className="text-primary hover:underline" href={`tel:${e.phone}`}>
                        {e.phone}
                      </a>
                    </dd>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <dt className="text-xs text-muted-foreground font-medium">Email</dt>
                    <dd>
                      <a className="text-primary hover:underline" href={`mailto:${e.email}`}>
                        {e.email}
                      </a>
                    </dd>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <dt className="text-xs text-muted-foreground font-medium">Course</dt>
                    <dd className="font-medium text-foreground">{e.course}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <dt className="text-xs text-muted-foreground font-medium">Admission year</dt>
                    <dd className="font-medium text-foreground">{e.admission_year}</dd>
                  </div>
                </div>
              </dl>

              {e.message && (
                <div className="mt-4 rounded-xl bg-muted/60 p-4 text-sm text-foreground border border-border/50">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Message:</p>
                  <p className="whitespace-pre-wrap">{e.message}</p>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2 pt-2 border-t border-border/40">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full text-xs"
                  onClick={() => update(e.id, { is_read: !e.is_read })}
                >
                  Mark as {e.is_read ? "unread" : "read"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full text-xs"
                  onClick={() => update(e.id, { is_contacted: !e.is_contacted, is_read: true })}
                >
                  {e.is_contacted ? "Undo contacted" : "Mark as contacted"}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="rounded-full gap-1.5 text-xs"
                  onClick={() => setDeleteTarget(e)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            </Panel>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete Enquiry"
        itemName={deleteTarget?.student_name}
        description={`Are you sure you want to permanently delete the enquiry submitted by "${deleteTarget?.student_name}"? This action cannot be undone.`}
        onConfirm={executeDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}
