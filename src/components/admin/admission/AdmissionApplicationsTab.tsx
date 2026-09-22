"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Filter,
  Eye,
  Trash2,
  Phone,
  MessageCircle,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Download,
  Loader2,
  User,
  MapPin,
  BookOpen,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDeleteDialog } from "@/components/admin/ConfirmDeleteDialog";
import type { AdmissionApplication, AdmissionApplicationStatus } from "@/lib/cms";

const STATUS_CONFIG: Record<
  AdmissionApplicationStatus,
  { label: string; bg: string; text: string; icon: typeof Clock }
> = {
  New: {
    label: "New",
    bg: "bg-blue-100 dark:bg-blue-950/70 border-blue-200 dark:border-blue-800",
    text: "text-blue-800 dark:text-blue-300",
    icon: Clock,
  },
  Reviewing: {
    label: "Reviewing",
    bg: "bg-amber-100 dark:bg-amber-950/70 border-amber-200 dark:border-amber-800",
    text: "text-amber-800 dark:text-amber-300",
    icon: AlertCircle,
  },
  Accepted: {
    label: "Accepted",
    bg: "bg-emerald-100 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-800",
    text: "text-emerald-800 dark:text-emerald-300",
    icon: CheckCircle2,
  },
  Rejected: {
    label: "Rejected",
    bg: "bg-rose-100 dark:bg-rose-950/70 border-rose-200 dark:border-rose-800",
    text: "text-rose-800 dark:text-rose-300",
    icon: XCircle,
  },
};

export function AdmissionApplicationsTab() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedApp, setSelectedApp] = useState<AdmissionApplication | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Fetch real-time applications from server API
  const {
    data: applications = [],
    isLoading,
    refetch,
  } = useQuery<AdmissionApplication[]>({
    queryKey: ["admin", "admission-applications"],
    queryFn: async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;

        const res = await fetch("/api/admissions/applications", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.applications)) {
            return json.applications;
          }
        }
      } catch (err) {
        console.warn("Failed to fetch applications:", err);
      }
      return [];
    },
    refetchInterval: 5000,
  });

  const handleStatusChange = async (appId: string, newStatus: AdmissionApplicationStatus) => {
    setUpdatingStatus(appId);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      // 1. Try API PATCH
      try {
        await fetch("/api/admissions/applications", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ id: appId, status: newStatus }),
        });
      } catch (patchErr) {
        console.warn("API status patch error:", patchErr);
      }

      // 2. Also ensure direct Supabase site_settings updated
      try {
        const nextList = applications.map((a) =>
          a.id === appId ? { ...a, status: newStatus } : a,
        );
        await supabase
          .from("site_settings")
          .upsert({ key: "admission_applications", value: nextList }, { onConflict: "key" });
      } catch {
        // non-blocking
      }

      if (selectedApp && selectedApp.id === appId) {
        setSelectedApp({ ...selectedApp, status: newStatus });
      }

      await queryClient.invalidateQueries({ queryKey: ["admin", "admission-applications"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "new-applications-count"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
      toast.success(`Application marked as "${newStatus}"`);
    } catch (err) {
      console.error("Status update error:", err);
      toast.error("Failed to update status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDeleteApplication = async () => {
    if (!deleteTargetId) return;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      try {
        await fetch("/api/admissions/applications", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ id: deleteTargetId }),
        });
      } catch (delErr) {
        console.warn("API delete error:", delErr);
      }

      try {
        const nextList = applications.filter((a) => a.id !== deleteTargetId);
        await supabase
          .from("site_settings")
          .upsert({ key: "admission_applications", value: nextList }, { onConflict: "key" });
      } catch {
        // non-blocking
      }

      if (selectedApp?.id === deleteTargetId) {
        setSelectedApp(null);
      }
      setDeleteTargetId(null);
      await queryClient.invalidateQueries({ queryKey: ["admin", "admission-applications"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "new-applications-count"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
      toast.success("Application deleted");
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete application");
    }
  };

  // Filter applications
  const filtered = applications.filter((app) => {
    const matchesStatus = statusFilter === "ALL" || app.status === statusFilter;
    if (!matchesStatus) return false;

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      app.student_name?.toLowerCase().includes(term) ||
      app.father_name?.toLowerCase().includes(term) ||
      app.class_to_join?.toLowerCase().includes(term) ||
      app.phone?.toLowerCase().includes(term) ||
      app.whatsapp?.toLowerCase().includes(term) ||
      app.place?.toLowerCase().includes(term) ||
      app.district?.toLowerCase().includes(term)
    );
  });

  const counts = {
    all: applications.length,
    New: applications.filter((a) => a.status === "New").length,
    Reviewing: applications.filter((a) => a.status === "Reviewing").length,
    Accepted: applications.filter((a) => a.status === "Accepted").length,
    Rejected: applications.filter((a) => a.status === "Rejected").length,
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Metrics */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <button
          type="button"
          onClick={() => setStatusFilter("ALL")}
          className={`rounded-xl border p-4 text-left transition-all ${
            statusFilter === "ALL"
              ? "border-primary bg-primary/5 ring-2 ring-primary/20"
              : "border-border bg-card hover:bg-muted/50"
          }`}
        >
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Total Applications
          </div>
          <div className="mt-1 font-display text-2xl font-bold text-foreground">{counts.all}</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("New")}
          className={`rounded-xl border p-4 text-left transition-all ${
            statusFilter === "New"
              ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/20"
              : "border-border bg-card hover:bg-muted/50"
          }`}
        >
          <div className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wider flex items-center justify-between">
            <span>New</span>
            <Clock size={14} />
          </div>
          <div className="mt-1 font-display text-2xl font-bold text-blue-600 dark:text-blue-400">
            {counts.New}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("Reviewing")}
          className={`rounded-xl border p-4 text-left transition-all ${
            statusFilter === "Reviewing"
              ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 ring-2 ring-amber-500/20"
              : "border-border bg-card hover:bg-muted/50"
          }`}
        >
          <div className="text-xs text-amber-600 dark:text-amber-400 font-medium uppercase tracking-wider flex items-center justify-between">
            <span>Reviewing</span>
            <AlertCircle size={14} />
          </div>
          <div className="mt-1 font-display text-2xl font-bold text-amber-600 dark:text-amber-400">
            {counts.Reviewing}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("Accepted")}
          className={`rounded-xl border p-4 text-left transition-all ${
            statusFilter === "Accepted"
              ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20"
              : "border-border bg-card hover:bg-muted/50"
          }`}
        >
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wider flex items-center justify-between">
            <span>Accepted</span>
            <CheckCircle2 size={14} />
          </div>
          <div className="mt-1 font-display text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {counts.Accepted}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("Rejected")}
          className={`rounded-xl border p-4 text-left transition-all ${
            statusFilter === "Rejected"
              ? "border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 ring-2 ring-rose-500/20"
              : "border-border bg-card hover:bg-muted/50"
          }`}
        >
          <div className="text-xs text-rose-600 dark:text-rose-400 font-medium uppercase tracking-wider flex items-center justify-between">
            <span>Rejected</span>
            <XCircle size={14} />
          </div>
          <div className="mt-1 font-display text-2xl font-bold text-rose-600 dark:text-rose-400">
            {counts.Rejected}
          </div>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student, father, class, phone, or place..."
            className="pl-9 rounded-xl bg-background"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] rounded-xl bg-background">
              <Filter size={14} className="mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses ({counts.all})</SelectItem>
              <SelectItem value="New">New ({counts.New})</SelectItem>
              <SelectItem value="Reviewing">Reviewing ({counts.Reviewing})</SelectItem>
              <SelectItem value="Accepted">Accepted ({counts.Accepted})</SelectItem>
              <SelectItem value="Rejected">Rejected ({counts.Rejected})</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="rounded-xl h-10 px-3"
            title="Refresh list"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Applications Table / Cards */}
      {isLoading ? (
        <div className="py-20 text-center">
          <Loader2 size={32} className="mx-auto animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Loading submitted applications...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <BookOpen size={24} />
          </div>
          <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
            {searchTerm || statusFilter !== "ALL"
              ? "No applications match your filter"
              : "No admission applications received yet"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
            {searchTerm || statusFilter !== "ALL"
              ? "Try clearing the search query or status filter to see other applications."
              : "When students or parents submit the online application form on the website, their full details will appear here."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3.5">Student &amp; Father</th>
                  <th className="px-4 py-3.5">Class to Join</th>
                  <th className="px-4 py-3.5">Contact Numbers</th>
                  <th className="px-4 py-3.5">Location</th>
                  <th className="px-4 py-3.5">Submission Date</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-enquiry">
                {filtered.map((app) => {
                  const statusConf = STATUS_CONFIG[app.status || "New"] || STATUS_CONFIG.New;
                  const dateStr = app.created_at
                    ? new Date(app.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—";

                  return (
                    <tr
                      key={app.id}
                      className="hover:bg-muted/40 transition-colors cursor-pointer"
                      onClick={() => setSelectedApp(app)}
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold text-foreground font-sans text-base">
                          {app.student_name}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <span>Father: {app.father_name || "—"}</span>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span className="inline-flex items-center rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                          {app.class_to_join}
                        </span>
                      </td>

                      <td className="px-4 py-4 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-foreground font-mono">
                          <Phone size={12} className="text-primary shrink-0" />
                          <span>{app.phone}</span>
                        </div>
                        {app.whatsapp && (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-mono">
                            <MessageCircle size={12} className="shrink-0" />
                            <span>{app.whatsapp}</span>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-4 text-xs text-muted-foreground">
                        <div className="font-medium text-foreground">{app.place || "—"}</div>
                        <div>{app.district || "—"}</div>
                      </td>

                      <td className="px-4 py-4 text-xs text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          <span>{dateStr}</span>
                        </div>
                      </td>

                      <td
                        className="px-4 py-4 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Select
                          value={app.status || "New"}
                          onValueChange={(val) =>
                            handleStatusChange(app.id, val as AdmissionApplicationStatus)
                          }
                          disabled={updatingStatus === app.id}
                        >
                          <SelectTrigger
                            className={`h-8 w-[125px] rounded-lg border text-xs font-medium ${statusConf.bg} ${statusConf.text}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="New">New</SelectItem>
                            <SelectItem value="Reviewing">Reviewing</SelectItem>
                            <SelectItem value="Accepted">Accepted</SelectItem>
                            <SelectItem value="Rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>

                      <td
                        className="px-4 py-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => setSelectedApp(app)}
                            title="View complete application details"
                          >
                            <Eye size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteTargetId(app.id)}
                            title="Delete application"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FULL DETAILS MODAL */}
      <Dialog open={!!selectedApp} onOpenChange={(open) => !open && setSelectedApp(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto font-enquiry">
          {selectedApp && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between pr-6">
                  <div>
                    <span className="text-xs uppercase font-semibold tracking-wider text-primary">
                      Application Details
                    </span>
                    <DialogTitle className="font-display text-2xl mt-1 text-foreground">
                      {selectedApp.student_name}
                    </DialogTitle>
                  </div>
                  <Badge
                    variant="outline"
                    className={`px-3 py-1 text-xs font-semibold ${
                      STATUS_CONFIG[selectedApp.status || "New"].bg
                    } ${STATUS_CONFIG[selectedApp.status || "New"].text}`}
                  >
                    {selectedApp.status || "New"}
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-muted-foreground">
                  Submitted on{" "}
                  {selectedApp.created_at
                    ? new Date(selectedApp.created_at).toLocaleString("en-IN")
                    : "—"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 pt-4 border-t border-border">
                {/* Status Switcher inside modal */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/50 border border-border">
                  <div className="text-sm font-medium text-foreground">
                    Change Application Status:
                  </div>
                  <div className="flex items-center gap-2">
                    {(
                      ["New", "Reviewing", "Accepted", "Rejected"] as AdmissionApplicationStatus[]
                    ).map((st) => (
                      <Button
                        key={st}
                        size="sm"
                        variant={selectedApp.status === st ? "default" : "outline"}
                        className="h-8 text-xs rounded-lg"
                        onClick={() => handleStatusChange(selectedApp.id, st)}
                        disabled={updatingStatus === selectedApp.id}
                      >
                        {st}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Grid details */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1 p-3.5 rounded-xl border border-border bg-card">
                    <div className="text-xs font-medium text-muted-foreground">Student Name</div>
                    <div className="text-base font-semibold text-foreground font-sans">
                      {selectedApp.student_name}
                    </div>
                  </div>

                  <div className="space-y-1 p-3.5 rounded-xl border border-border bg-card">
                    <div className="text-xs font-medium text-muted-foreground">Father Name</div>
                    <div className="text-base font-semibold text-foreground font-sans">
                      {selectedApp.father_name}
                    </div>
                  </div>

                  <div className="space-y-1 p-3.5 rounded-xl border border-border bg-card">
                    <div className="text-xs font-medium text-muted-foreground">Class to Join</div>
                    <div className="text-base font-semibold text-primary">
                      {selectedApp.class_to_join}
                    </div>
                  </div>

                  <div className="space-y-1 p-3.5 rounded-xl border border-border bg-card">
                    <div className="text-xs font-medium text-muted-foreground">Location</div>
                    <div className="text-base font-medium text-foreground">
                      {selectedApp.place}, {selectedApp.district}
                    </div>
                  </div>
                </div>

                {/* Contact info & quick actions */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-muted-foreground">Phone Number</div>
                      <div className="text-sm font-semibold font-mono text-foreground mt-0.5">
                        {selectedApp.phone}
                      </div>
                    </div>
                    <a
                      href={`tel:${selectedApp.phone.replace(/\s/g, "")}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium px-3 py-1.5 transition-colors"
                    >
                      <Phone size={13} />
                      Call
                    </a>
                  </div>

                  <div className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-muted-foreground">
                        WhatsApp Number
                      </div>
                      <div className="text-sm font-semibold font-mono text-foreground mt-0.5">
                        {selectedApp.whatsapp || selectedApp.phone}
                      </div>
                    </div>
                    <a
                      href={`https://wa.me/${(selectedApp.whatsapp || selectedApp.phone).replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-medium px-3 py-1.5 transition-colors"
                    >
                      <MessageCircle size={13} />
                      WhatsApp
                    </a>
                  </div>
                </div>

                {/* Full Address */}
                <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
                  <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <MapPin size={13} className="text-primary" />
                    Complete Address
                  </div>
                  <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-sans">
                    {selectedApp.address || "—"}
                  </div>
                </div>

                {/* Custom fields if any */}
                {selectedApp.custom_fields && Object.keys(selectedApp.custom_fields).length > 0 && (
                  <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                    <div className="text-xs font-semibold uppercase text-muted-foreground">
                      Additional Form Fields
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 text-xs">
                      {Object.entries(selectedApp.custom_fields).map(([k, v]) => (
                        <div key={k} className="border-b border-border/50 pb-1.5">
                          <span className="text-muted-foreground capitalize">
                            {k.replace(/_/g, " ")}:
                          </span>{" "}
                          <span className="font-medium text-foreground">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Modal Footer Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      setDeleteTargetId(selectedApp.id);
                    }}
                  >
                    <Trash2 size={15} className="mr-1.5" />
                    Delete Application
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.print()}
                      className="rounded-xl"
                    >
                      Print Details
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setSelectedApp(null)}
                      className="rounded-xl"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDeleteDialog
        open={!!deleteTargetId}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
        title="Delete Admission Application"
        description="Are you sure you want to delete this submitted application? This action cannot be undone."
        onConfirm={handleDeleteApplication}
      />
    </div>
  );
}
