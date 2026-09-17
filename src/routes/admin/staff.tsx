import { useState, useRef, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Users,
  UserPlus,
  Upload,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  Loader2,
  Check,
  X,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeading, Panel, EmptyState } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ConfirmDeleteDialog } from "@/components/admin/ConfirmDeleteDialog";
import {
  uploadMedia,
  deleteStoredMedia,
  DEFAULT_STAFF,
  DEFAULT_COMMITTEE,
  type StaffMember,
  type CommitteeMember,
} from "@/lib/cms";

export const Route = createFileRoute("/admin/staff")({
  component: StaffAdmin,
});

function StaffAdmin() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"staff" | "committee">("staff");

  // Staff state
  const [staffList, setStaffList] = useState<StaffMember[]>(DEFAULT_STAFF);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [staffPhotoPreview, setStaffPhotoPreview] = useState<string | null>(null);
  const [uploadingStaffPhoto, setUploadingStaffPhoto] = useState(false);
  const staffFileInputRef = useRef<HTMLInputElement>(null);

  // Committee state
  const [committeeList, setCommitteeList] = useState<CommitteeMember[]>(DEFAULT_COMMITTEE);
  const [editingCommittee, setEditingCommittee] = useState<CommitteeMember | null>(null);
  const [committeePhotoPreview, setCommitteePhotoPreview] = useState<string | null>(null);
  const [uploadingCommitteePhoto, setUploadingCommitteePhoto] = useState(false);
  const committeeFileInputRef = useRef<HTMLInputElement>(null);

  // Global saving indicators
  const [isSavingStaff, setIsSavingStaff] = useState(false);
  const [isSavingCommittee, setIsSavingCommittee] = useState(false);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "staff" | "committee";
    item: StaffMember | CommitteeMember;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch staff settings
  const { data: staffData, isLoading: isLoadingStaff } = useQuery({
    queryKey: ["settings", "staff_members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "staff_members")
        .maybeSingle();

      if (error || !data || !data.value) {
        return DEFAULT_STAFF;
      }
      const val = data.value as StaffMember[];
      return Array.isArray(val) && val.length > 0 ? val : DEFAULT_STAFF;
    },
  });

  // Fetch committee settings
  const { data: committeeData, isLoading: isLoadingCommittee } = useQuery({
    queryKey: ["settings", "committee_members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "committee_members")
        .maybeSingle();

      if (error || !data || !data.value) {
        return DEFAULT_COMMITTEE;
      }
      const val = data.value as CommitteeMember[];
      return Array.isArray(val) ? val : DEFAULT_COMMITTEE;
    },
  });

  useEffect(() => {
    if (staffData) {
      setStaffList([...staffData].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)));
    }
  }, [staffData]);

  useEffect(() => {
    if (committeeData) {
      setCommitteeList(
        [...committeeData].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
      );
    }
  }, [committeeData]);

  // Save Staff List
  const persistStaffList = async (updated: StaffMember[]) => {
    setIsSavingStaff(true);
    const sorted = updated.map((item, index) => ({
      ...item,
      sort_order: index + 1,
    }));
    setStaffList(sorted);

    try {
      const { error } = await supabase.from("site_settings").upsert(
        {
          key: "staff_members",
          value: sorted,
        },
        { onConflict: "key" },
      );

      if (error) {
        toast.error("Failed to save staff changes: " + error.message);
        return false;
      }

      toast.success("Staff members updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["settings", "staff_members"] });
      return true;
    } catch (err) {
      console.error("[StaffAdmin] Save staff error:", err);
      toast.error("Error saving staff members.");
      return false;
    } finally {
      setIsSavingStaff(false);
    }
  };

  // Save Committee List
  const persistCommitteeList = async (updated: CommitteeMember[]) => {
    setIsSavingCommittee(true);
    const sorted = updated.map((item, index) => ({
      ...item,
      sort_order: index + 1,
    }));
    setCommitteeList(sorted);

    try {
      const { error } = await supabase.from("site_settings").upsert(
        {
          key: "committee_members",
          value: sorted,
        },
        { onConflict: "key" },
      );

      if (error) {
        toast.error("Failed to save committee changes: " + error.message);
        return false;
      }

      toast.success("Committee members updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["settings", "committee_members"] });
      return true;
    } catch (err) {
      console.error("[StaffAdmin] Save committee error:", err);
      toast.error("Error saving committee members.");
      return false;
    } finally {
      setIsSavingCommittee(false);
    }
  };

  // Staff Handlers
  const handleStartAddStaff = () => {
    const newItem: StaffMember = {
      id: crypto.randomUUID(),
      name: "",
      role: "",
      photo_url: null,
      sort_order: staffList.length + 1,
    };
    setEditingStaff(newItem);
    setStaffPhotoPreview(null);
  };

  const handleStartEditStaff = (member: StaffMember) => {
    setEditingStaff({ ...member });
    setStaffPhotoPreview(member.photo_url || null);
  };

  const handleStaffPhotoSelect = async (file: File) => {
    if (!file) return;

    // Validate type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type.toLowerCase())) {
      toast.error("Please upload a valid image file (JPG, PNG, WebP).");
      return;
    }

    // Validate size (max 8MB)
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image is too large. Please select an image under 8MB.");
      return;
    }

    setUploadingStaffPhoto(true);
    try {
      const url = await uploadMedia(file, "staff");
      if (url) {
        setStaffPhotoPreview(url);
        if (editingStaff) {
          setEditingStaff({ ...editingStaff, photo_url: url });
        }
        toast.success("Photo uploaded successfully.");
      } else {
        toast.error("Upload failed. Could not retrieve photo URL.");
      }
    } catch (err) {
      console.error("[StaffAdmin] Photo upload error:", err);
      toast.error("Failed to upload staff photo.");
    } finally {
      setUploadingStaffPhoto(false);
    }
  };

  const handleRemoveStaffPhoto = async () => {
    if (!editingStaff) return;
    const oldUrl = editingStaff.photo_url;
    setEditingStaff({ ...editingStaff, photo_url: null });
    setStaffPhotoPreview(null);
    if (oldUrl) {
      void deleteStoredMedia(oldUrl);
    }
    toast.info("Photo removed.");
  };

  const handleSaveStaffItem = async () => {
    if (!editingStaff) return;
    if (!editingStaff.name.trim()) {
      toast.error("Staff name is required.");
      return;
    }

    const trimmedItem: StaffMember = {
      ...editingStaff,
      name: editingStaff.name.trim(),
      role: editingStaff.role.trim() || "Faculty",
      photo_url: staffPhotoPreview || editingStaff.photo_url || null,
    };

    const existingIndex = staffList.findIndex((s) => s.id === trimmedItem.id);
    let updated: StaffMember[];
    if (existingIndex >= 0) {
      updated = [...staffList];
      updated[existingIndex] = trimmedItem;
    } else {
      updated = [...staffList, trimmedItem];
    }

    const ok = await persistStaffList(updated);
    if (ok) {
      setEditingStaff(null);
      setStaffPhotoPreview(null);
    }
  };

  const handleMoveStaff = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= staffList.length) return;

    const updated = [...staffList];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    await persistStaffList(updated);
  };

  // Committee Handlers
  const handleStartAddCommittee = () => {
    const newItem: CommitteeMember = {
      id: crypto.randomUUID(),
      name: "",
      role: "Committee Member",
      photo_url: null,
      sort_order: committeeList.length + 1,
    };
    setEditingCommittee(newItem);
    setCommitteePhotoPreview(null);
  };

  const handleStartEditCommittee = (member: CommitteeMember) => {
    setEditingCommittee({ ...member });
    setCommitteePhotoPreview(member.photo_url || null);
  };

  const handleCommitteePhotoSelect = async (file: File) => {
    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type.toLowerCase())) {
      toast.error("Please upload a valid image file (JPG, PNG, WebP).");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image is too large. Please select an image under 8MB.");
      return;
    }

    setUploadingCommitteePhoto(true);
    try {
      const url = await uploadMedia(file, "committee");
      if (url) {
        setCommitteePhotoPreview(url);
        if (editingCommittee) {
          setEditingCommittee({ ...editingCommittee, photo_url: url });
        }
        toast.success("Photo uploaded successfully.");
      } else {
        toast.error("Upload failed. Could not retrieve photo URL.");
      }
    } catch (err) {
      console.error("[StaffAdmin] Committee photo upload error:", err);
      toast.error("Failed to upload committee photo.");
    } finally {
      setUploadingCommitteePhoto(false);
    }
  };

  const handleRemoveCommitteePhoto = async () => {
    if (!editingCommittee) return;
    const oldUrl = editingCommittee.photo_url;
    setEditingCommittee({ ...editingCommittee, photo_url: null });
    setCommitteePhotoPreview(null);
    if (oldUrl) {
      void deleteStoredMedia(oldUrl);
    }
    toast.info("Photo removed.");
  };

  const handleSaveCommitteeItem = async () => {
    if (!editingCommittee) return;
    if (!editingCommittee.name.trim()) {
      toast.error("Committee member name is required.");
      return;
    }

    const trimmedItem: CommitteeMember = {
      ...editingCommittee,
      name: editingCommittee.name.trim(),
      role: editingCommittee.role?.trim() || "Committee Member",
      photo_url: committeePhotoPreview || editingCommittee.photo_url || null,
    };

    const existingIndex = committeeList.findIndex((c) => c.id === trimmedItem.id);
    let updated: CommitteeMember[];
    if (existingIndex >= 0) {
      updated = [...committeeList];
      updated[existingIndex] = trimmedItem;
    } else {
      updated = [...committeeList, trimmedItem];
    }

    const ok = await persistCommitteeList(updated);
    if (ok) {
      setEditingCommittee(null);
      setCommitteePhotoPreview(null);
    }
  };

  const handleMoveCommittee = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= committeeList.length) return;

    const updated = [...committeeList];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    await persistCommitteeList(updated);
  };

  // Execution of Deletion
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      if (deleteTarget.type === "staff") {
        const item = deleteTarget.item as StaffMember;
        const updated = staffList.filter((s) => s.id !== item.id);
        if (item.photo_url) {
          void deleteStoredMedia(item.photo_url);
        }
        await persistStaffList(updated);
      } else {
        const item = deleteTarget.item as CommitteeMember;
        const updated = committeeList.filter((c) => c.id !== item.id);
        if (item.photo_url) {
          void deleteStoredMedia(item.photo_url);
        }
        await persistCommitteeList(updated);
      }
      setDeleteTarget(null);
    } catch (err) {
      console.error("[StaffAdmin] Delete error:", err);
      toast.error("Failed to delete member.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <PageHeading
        title="Staff & Committee Members"
        description="Manage teachers, scholars, leadership, and academy committee members with custom photos and names."
      />

      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "staff" | "committee")}
        className="space-y-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <TabsList className="bg-background border border-border">
            <TabsTrigger
              value="staff"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Users className="mr-2 h-4 w-4" />
              Faculties & Staff ({staffList.length})
            </TabsTrigger>
            <TabsTrigger
              value="committee"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Users className="mr-2 h-4 w-4" />
              Committee Members ({committeeList.length})
            </TabsTrigger>
          </TabsList>

          {activeTab === "staff" ? (
            <Button
              className="rounded-full gap-2"
              onClick={handleStartAddStaff}
              disabled={Boolean(editingStaff)}
            >
              <UserPlus className="h-4 w-4" />
              Add Staff Member
            </Button>
          ) : (
            <Button
              className="rounded-full gap-2"
              onClick={handleStartAddCommittee}
              disabled={Boolean(editingCommittee)}
            >
              <UserPlus className="h-4 w-4" />
              Add Committee Member
            </Button>
          )}
        </div>

        {/* STAFF TAB CONTENT */}
        <TabsContent value="staff" className="space-y-6 focus-visible:outline-none">
          {editingStaff && (
            <Panel
              title={
                staffList.some((s) => s.id === editingStaff.id)
                  ? `Edit Staff Member: ${editingStaff.name || "Untitled"}`
                  : "Add New Staff Member"
              }
              className="border-primary/30 bg-primary/5 mb-6"
            >
              <div className="grid gap-6 md:grid-cols-12">
                {/* Photo upload column */}
                <div className="md:col-span-4 flex flex-col items-center justify-center p-4 border border-dashed border-border rounded-2xl bg-background/50">
                  <Label className="mb-3 font-semibold text-sm self-start">Staff Photo</Label>

                  <div className="relative group w-32 h-32 rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center shadow-inner mb-4">
                    {staffPhotoPreview ? (
                      <img
                        src={staffPhotoPreview}
                        alt="Staff Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-8 w-8 mb-1 opacity-50" />
                        <span className="text-[11px]">No Photo</span>
                      </div>
                    )}

                    {uploadingStaffPhoto && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                      </div>
                    )}
                  </div>

                  <input
                    ref={staffFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleStaffPhotoSelect(file);
                    }}
                  />

                  <div className="flex flex-wrap items-center justify-center gap-2 w-full">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full text-xs gap-1.5"
                      onClick={() => staffFileInputRef.current?.click()}
                      disabled={uploadingStaffPhoto}
                    >
                      <Upload className="h-3.5 w-3.5" />
                      {staffPhotoPreview ? "Change Photo" : "Upload Photo"}
                    </Button>

                    {staffPhotoPreview && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="rounded-full text-xs text-destructive hover:bg-destructive/10"
                        onClick={handleRemoveStaffPhoto}
                        disabled={uploadingStaffPhoto}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </Button>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2 text-center">
                    Accepts JPG, PNG, WebP (Max 8MB)
                  </p>
                </div>

                {/* Form fields column */}
                <div className="md:col-span-8 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="staff-name">Staff Name *</Label>
                    <Input
                      id="staff-name"
                      placeholder="e.g. Sayyid Murthala Shihab Saqafi"
                      value={editingStaff.name}
                      onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="staff-role">Role / Designation</Label>
                    <Input
                      id="staff-role"
                      placeholder="e.g. Chairman, Principal, Senior Ustad"
                      value={editingStaff.role}
                      onChange={(e) => setEditingStaff({ ...editingStaff, role: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>

                  <div className="pt-4 flex items-center gap-3">
                    <Button
                      className="rounded-full gap-2"
                      onClick={handleSaveStaffItem}
                      disabled={isSavingStaff || uploadingStaffPhoto}
                    >
                      {isSavingStaff ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Save Staff Member
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-full"
                      onClick={() => {
                        setEditingStaff(null);
                        setStaffPhotoPreview(null);
                      }}
                      disabled={isSavingStaff}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </Panel>
          )}

          {isLoadingStaff ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : staffList.length === 0 ? (
            <EmptyState>
              No staff members found. Click &quot;Add Staff Member&quot; to begin.
            </EmptyState>
          ) : (
            <div className="space-y-3">
              {staffList.map((member, index) => (
                <Panel
                  key={member.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:border-primary/40"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-border bg-muted flex items-center justify-center">
                      {member.photo_url ? (
                        <img
                          src={member.photo_url}
                          alt={member.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div
                          aria-hidden
                          className="grid h-full w-full place-items-center brand-gradient font-display text-lg text-primary-foreground font-semibold"
                        >
                          {member.name ? member.name.charAt(0).toUpperCase() : "S"}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="font-display font-medium text-base text-foreground truncate">
                        {member.name}
                      </p>
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary/90 mt-0.5">
                        {member.role || "Faculty"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <div className="flex items-center gap-1 mr-2 border-r border-border pr-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        disabled={index === 0 || isSavingStaff}
                        onClick={() => void handleMoveStaff(index, "up")}
                        title="Move Up"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        disabled={index === staffList.length - 1 || isSavingStaff}
                        onClick={() => void handleMoveStaff(index, "down")}
                        title="Move Down"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full text-xs gap-1.5"
                      onClick={() => handleStartEditStaff(member)}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit & Photo
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-full text-xs text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteTarget({ type: "staff", item: member })}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </Panel>
              ))}
            </div>
          )}
        </TabsContent>

        {/* COMMITTEE MEMBERS TAB CONTENT */}
        <TabsContent value="committee" className="space-y-6 focus-visible:outline-none">
          {editingCommittee && (
            <Panel
              title={
                committeeList.some((c) => c.id === editingCommittee.id)
                  ? `Edit Committee Member: ${editingCommittee.name || "Untitled"}`
                  : "Add New Committee Member"
              }
              className="border-primary/30 bg-primary/5 mb-6"
            >
              <div className="grid gap-6 md:grid-cols-12">
                {/* Photo upload column */}
                <div className="md:col-span-4 flex flex-col items-center justify-center p-4 border border-dashed border-border rounded-2xl bg-background/50">
                  <Label className="mb-3 font-semibold text-sm self-start">Member Photo</Label>

                  <div className="relative group w-32 h-32 rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center shadow-inner mb-4">
                    {committeePhotoPreview ? (
                      <img
                        src={committeePhotoPreview}
                        alt="Committee Member Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-8 w-8 mb-1 opacity-50" />
                        <span className="text-[11px]">No Photo</span>
                      </div>
                    )}

                    {uploadingCommitteePhoto && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                      </div>
                    )}
                  </div>

                  <input
                    ref={committeeFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleCommitteePhotoSelect(file);
                    }}
                  />

                  <div className="flex flex-wrap items-center justify-center gap-2 w-full">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full text-xs gap-1.5"
                      onClick={() => committeeFileInputRef.current?.click()}
                      disabled={uploadingCommitteePhoto}
                    >
                      <Upload className="h-3.5 w-3.5" />
                      {committeePhotoPreview ? "Change Photo" : "Upload Photo"}
                    </Button>

                    {committeePhotoPreview && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="rounded-full text-xs text-destructive hover:bg-destructive/10"
                        onClick={handleRemoveCommitteePhoto}
                        disabled={uploadingCommitteePhoto}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </Button>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2 text-center">
                    Accepts JPG, PNG, WebP (Max 8MB)
                  </p>
                </div>

                {/* Form fields column */}
                <div className="md:col-span-8 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="committee-name">Member Name *</Label>
                    <Input
                      id="committee-name"
                      placeholder="e.g. Sayyid Ali Shihab Thangal"
                      value={editingCommittee.name}
                      onChange={(e) =>
                        setEditingCommittee({ ...editingCommittee, name: e.target.value })
                      }
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="committee-role">Designation / Role (Optional)</Label>
                    <Input
                      id="committee-role"
                      placeholder="e.g. President, Secretary, Treasurer, Executive Member"
                      value={editingCommittee.role || ""}
                      onChange={(e) =>
                        setEditingCommittee({ ...editingCommittee, role: e.target.value })
                      }
                      className="rounded-xl"
                    />
                  </div>

                  <div className="pt-4 flex items-center gap-3">
                    <Button
                      className="rounded-full gap-2"
                      onClick={handleSaveCommitteeItem}
                      disabled={isSavingCommittee || uploadingCommitteePhoto}
                    >
                      {isSavingCommittee ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Save Committee Member
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-full"
                      onClick={() => {
                        setEditingCommittee(null);
                        setCommitteePhotoPreview(null);
                      }}
                      disabled={isSavingCommittee}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </Panel>
          )}

          {isLoadingCommittee ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : committeeList.length === 0 ? (
            <EmptyState>
              No committee members added yet. Click &quot;Add Committee Member&quot; to begin.
            </EmptyState>
          ) : (
            <div className="space-y-3">
              {committeeList.map((member, index) => (
                <Panel
                  key={member.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:border-primary/40"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-border bg-muted flex items-center justify-center">
                      {member.photo_url ? (
                        <img
                          src={member.photo_url}
                          alt={member.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div
                          aria-hidden
                          className="grid h-full w-full place-items-center bg-secondary font-display text-lg text-secondary-foreground font-semibold"
                        >
                          {member.name ? member.name.charAt(0).toUpperCase() : "C"}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="font-display font-medium text-base text-foreground truncate">
                        {member.name}
                      </p>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">
                        {member.role || "Committee Member"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <div className="flex items-center gap-1 mr-2 border-r border-border pr-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        disabled={index === 0 || isSavingCommittee}
                        onClick={() => void handleMoveCommittee(index, "up")}
                        title="Move Up"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        disabled={index === committeeList.length - 1 || isSavingCommittee}
                        onClick={() => void handleMoveCommittee(index, "down")}
                        title="Move Down"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full text-xs gap-1.5"
                      onClick={() => handleStartEditCommittee(member)}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit & Photo
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-full text-xs text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteTarget({ type: "committee", item: member })}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </Panel>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Confirmation Modal */}
      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={deleteTarget?.type === "staff" ? "Delete Staff Member" : "Delete Committee Member"}
        itemName={deleteTarget?.item.name}
        description={`Are you sure you want to permanently delete "${deleteTarget?.item.name}"? If a photo is associated, it will also be cleaned up.`}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}
