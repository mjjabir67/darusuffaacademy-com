import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeading, Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_CONTACT,
  DEFAULT_SITE,
  DEFAULT_ABOUT,
  type ContactSettings,
  type SiteSettings,
  type AboutSettings,
} from "@/lib/cms";
import { ImageFieldManager } from "@/components/admin/ImageFieldManager";
import campus from "@/assets/campus.jpg";
import heroBooks from "@/assets/hero-books.jpg";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsAdmin,
});

function SettingsAdmin() {
  const queryClient = useQueryClient();
  const [contact, setContact] = useState<ContactSettings>(DEFAULT_CONTACT);
  const [site, setSite] = useState<SiteSettings>(DEFAULT_SITE);
  const [about, setAbout] = useState<AboutSettings>(DEFAULT_ABOUT);
  const [saving, setSaving] = useState(false);

  // Admin Account state
  const [currentUsername, setCurrentUsername] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [credUpdating, setCredUpdating] = useState(false);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [credError, setCredError] = useState("");
  const [credSuccess, setCredSuccess] = useState("");

  const { data } = useQuery({
    queryKey: ["settings", "all"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("key, value");
      const rows = data ?? [];
      const byKey = (k: string) => rows.find((r) => r.key === k)?.value as object | undefined;
      return {
        contact: { ...DEFAULT_CONTACT, ...(byKey("contact") ?? {}) } as ContactSettings,
        site: { ...DEFAULT_SITE, ...(byKey("site") ?? {}) } as SiteSettings,
        about: { ...DEFAULT_ABOUT, ...(byKey("about") ?? {}) } as AboutSettings,
      };
    },
  });

  useEffect(() => {
    if (data) {
      setContact(data.contact);
      setSite(data.site);
      setAbout(data.about);
    }
  }, [data]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: authData }) => {
      if (authData?.user) {
        const u =
          authData.user.user_metadata?.username ||
          (authData.user.email?.startsWith("admin@")
            ? authData.user.email.slice(6)
            : authData.user.email) ||
          "";
        setCurrentUsername(u);
      }
    });
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("site_settings").upsert(
      [
        { key: "contact", value: contact },
        { key: "site", value: site },
        { key: "about", value: about },
      ],
      { onConflict: "key" },
    );
    setSaving(false);
    if (error) {
      toast.error("Could not save the settings.");
      return;
    }
    toast.success("Settings updated.");
    queryClient.invalidateQueries();
  };

  const handleUpdateCredentials = async () => {
    setCredError("");
    setCredSuccess("");

    if (!currentPassword) {
      const msg = "Please enter your current password.";
      setCredError(msg);
      toast.error(msg);
      return;
    }

    const trimmedNewUser = newUsername.trim();
    const isChangingUser = trimmedNewUser !== "" && trimmedNewUser !== currentUsername;
    const isChangingPass = newPassword.length > 0;

    if (!isChangingUser && !isChangingPass) {
      const msg = "Please enter a new username or new password to update.";
      setCredError(msg);
      toast.error(msg);
      return;
    }

    if (isChangingPass) {
      if (newPassword.length < 6) {
        const msg = "New password must be at least 6 characters long.";
        setCredError(msg);
        toast.error(msg);
        return;
      }
      if (newPassword !== confirmNewPassword) {
        const msg = "New passwords do not match.";
        setCredError(msg);
        toast.error(msg);
        return;
      }
    }

    setCredUpdating(true);

    try {
      // 1. Fetch current authenticated user
      const { data: userRes, error: userFetchError } = await supabase.auth.getUser();
      if (userFetchError || !userRes?.user || !userRes.user.email) {
        const msg = "Your session has expired. Please log in again.";
        setCredError(msg);
        toast.error(msg);
        setCredUpdating(false);
        return;
      }

      const currentUser = userRes.user;
      const currentEmail = currentUser.email;

      // 2. Validate current password securely via Supabase Auth
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: currentEmail,
        password: currentPassword,
      });

      if (verifyError) {
        setCredUpdating(false);
        const msg = "Current password is incorrect.";
        setCredError(msg);
        toast.error(msg);
        return;
      }

      // 3. Prepare payload for updating credentials
      const payload: {
        password?: string;
        email?: string;
        data?: Record<string, unknown>;
      } = {};

      if (isChangingPass) {
        payload.password = newPassword;
      }

      if (isChangingUser) {
        const targetEmail = trimmedNewUser.includes("@")
          ? trimmedNewUser
          : `admin@${trimmedNewUser}`;
        payload.email = targetEmail;
        payload.data = {
          ...(currentUser.user_metadata || {}),
          username: trimmedNewUser,
        };
      }

      const { data: updateRes, error: updateError } = await supabase.auth.updateUser(payload);

      if (updateError) {
        setCredUpdating(false);
        const raw = updateError.message || "";
        let friendlyMsg = "Could not update credentials.";
        if (
          raw.toLowerCase().includes("already registered") ||
          raw.toLowerCase().includes("unique") ||
          raw.toLowerCase().includes("already exists")
        ) {
          friendlyMsg = "This username or email is already taken by another account.";
        } else if (raw) {
          friendlyMsg = raw;
        }
        setCredError(friendlyMsg);
        toast.error(friendlyMsg);
        return;
      }

      // 4. Update local state
      const updatedUser = updateRes?.user;
      const resolvedUsername =
        updatedUser?.user_metadata?.username ||
        (updatedUser?.email?.startsWith("admin@")
          ? updatedUser.email.slice(6)
          : updatedUser?.email) ||
        trimmedNewUser;

      if (isChangingUser) {
        setCurrentUsername(resolvedUsername);
        setNewUsername("");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setCredError("");
      const successMsg = "Admin credentials updated successfully.";
      setCredSuccess(successMsg);
      toast.success(successMsg);

      queryClient.invalidateQueries();
    } catch (err) {
      console.error("Error updating credentials:", err);
      const msg = "An unexpected error occurred while updating credentials.";
      setCredError(msg);
      toast.error(msg);
    } finally {
      setCredUpdating(false);
    }
  };

  return (
    <>
      <PageHeading
        title="Settings & Admin Account"
        description="Manage administrator login credentials, contact info, and website configuration."
      />

      <div className="space-y-6">
        {/* Admin Account Section */}
        <Panel title="Admin Account">
          <p className="mb-4 text-sm text-ink-foreground/70">
            Securely change the administrator username and password used to access the Admin
            Dashboard.
          </p>

          {credError && (
            <div
              id="admin-cred-error"
              className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium"
            >
              {credError}
            </div>
          )}

          {credSuccess && (
            <div
              id="admin-cred-success"
              className="mb-4 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary font-medium"
            >
              {credSuccess}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="currentUsername">Current Username</Label>
              <Input
                id="currentUsername"
                value={currentUsername || "Loading..."}
                disabled
                className="bg-muted text-muted-foreground cursor-not-allowed font-medium"
              />
              <p className="text-xs text-muted-foreground">
                The username currently active for this administrator account.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newUsername">New Username</Label>
              <Input
                id="newUsername"
                value={newUsername}
                onChange={(e) => {
                  setNewUsername(e.target.value);
                  setCredError("");
                  setCredSuccess("");
                }}
                placeholder="Leave blank to keep current username"
                autoComplete="username"
              />
              <p className="text-xs text-muted-foreground">
                Enter a new admin username or ID (e.g. darusuffa.in or custom username).
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="currentPassword">
                Current Password <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPass ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    setCredError("");
                  }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showCurrentPass ? "Hide password" : "Show password"}
                >
                  {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Required to authorize any credential changes.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPass ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setCredError("");
                  }}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showNewPass ? "Hide password" : "Show password"}
                >
                  {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Minimum 6 characters. Leave blank if only changing username.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmNewPassword"
                  type={showConfirmPass ? "text" : "password"}
                  value={confirmNewPassword}
                  onChange={(e) => {
                    setConfirmNewPassword(e.target.value);
                    setCredError("");
                  }}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showConfirmPass ? "Hide password" : "Show password"}
                >
                  {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Re-enter your new password to confirm.
              </p>
            </div>
          </div>

          <div className="mt-5">
            <Button
              id="update-credentials-btn"
              className="rounded-full px-8 gap-2"
              onClick={handleUpdateCredentials}
              disabled={credUpdating}
            >
              <ShieldCheck size={16} />
              {credUpdating ? "Updating..." : "Update Credentials"}
            </Button>
          </div>
        </Panel>

        <Panel title="Contact details">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                rows={2}
                value={contact.address}
                onChange={(e) => setContact({ ...contact, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phones">Phone numbers (comma separated)</Label>
              <Input
                id="phones"
                value={contact.phones.join(", ")}
                onChange={(e) =>
                  setContact({
                    ...contact,
                    phones: e.target.value
                      .split(",")
                      .map((p) => p.trim())
                      .filter(Boolean),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp number</Label>
              <Input
                id="whatsapp"
                value={contact.whatsapp}
                onChange={(e) => setContact({ ...contact, whatsapp: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={contact.email}
                onChange={(e) => setContact({ ...contact, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mapQuery">Map location search</Label>
              <Input
                id="mapQuery"
                value={contact.mapQuery}
                onChange={(e) => setContact({ ...contact, mapQuery: e.target.value })}
              />
            </div>
          </div>
        </Panel>

        <Panel title="Social links">
          <div className="grid gap-5 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                id="facebook"
                value={contact.facebook}
                onChange={(e) => setContact({ ...contact, facebook: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={contact.instagram}
                onChange={(e) => setContact({ ...contact, instagram: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="youtube">YouTube</Label>
              <Input
                id="youtube"
                value={contact.youtube}
                onChange={(e) => setContact({ ...contact, youtube: e.target.value })}
              />
            </div>
          </div>
        </Panel>

        <Panel title="Website details">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="siteName">Institution name</Label>
              <Input
                id="siteName"
                value={site.siteName}
                onChange={(e) => setSite({ ...site, siteName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="footerText">Footer tagline</Label>
              <Input
                id="footerText"
                value={site.footerText}
                onChange={(e) => setSite({ ...site, footerText: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seoTitle">Search engine title</Label>
              <Input
                id="seoTitle"
                value={site.seoTitle}
                onChange={(e) => setSite({ ...site, seoTitle: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seoDescription">Search engine description</Label>
              <Textarea
                id="seoDescription"
                rows={2}
                value={site.seoDescription}
                onChange={(e) => setSite({ ...site, seoDescription: e.target.value })}
              />
            </div>
          </div>
        </Panel>

        <Panel title="About Page Images">
          <div className="space-y-6">
            <ImageFieldManager
              label="Campus Building Image"
              description="Photo displayed in the About Us section showing the academy campus."
              currentImageUrl={about.campusImage}
              defaultImageUrl={campus}
              storageFolder="about"
              cropShape="rect"
              aspectRatio={4 / 3}
              modalTitle="Crop & Adjust Campus Image"
              onSave={async (url) => {
                const updated = { ...about, campusImage: url };
                setAbout(updated);
                await supabase
                  .from("site_settings")
                  .upsert({ key: "about", value: updated }, { onConflict: "key" });
                queryClient.invalidateQueries({ queryKey: ["settings", "about"] });
              }}
            />

            <div className="pt-2 border-t border-border">
              <ImageFieldManager
                label="History & Foundation Image"
                description="Photo displayed alongside the founding history and inauguration details on the About page."
                currentImageUrl={about.historyImage}
                defaultImageUrl={heroBooks}
                storageFolder="about"
                cropShape="rect"
                aspectRatio={16 / 9}
                modalTitle="Crop & Adjust History Image"
                onSave={async (url) => {
                  const updated = { ...about, historyImage: url };
                  setAbout(updated);
                  await supabase
                    .from("site_settings")
                    .upsert({ key: "about", value: updated }, { onConflict: "key" });
                  queryClient.invalidateQueries({ queryKey: ["settings", "about"] });
                }}
              />
            </div>
          </div>
        </Panel>

        <Button className="rounded-full px-8" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </>
  );
}
