import { createFileRoute } from "@tanstack/react-router";
import {
  getAllApplications,
  updateApplication,
  deleteApplication,
  createApplication,
  type StoredAdmissionApplication,
  type AdmissionApplicationStatus,
} from "@/server/db/admission-applications";

// Helper to migrate any applications previously misclassified into the enquiries table
async function migrateMisclassifiedFromEnquiries(authHeader?: string | null) {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !key) return;

    const client = createClient(supabaseUrl, key, {
      global: {
        headers: authHeader ? { Authorization: authHeader } : undefined,
      },
    });

    const { data: misclassified, error: fetchErr } = await client
      .from("enquiries")
      .select("*")
      .ilike("message", "%[ADMISSION APPLICATION]%");

    if (fetchErr || !misclassified || misclassified.length === 0) {
      return;
    }

    const existingApps = getAllApplications();

    for (const item of misclassified) {
      const msg = item.message || "";
      const getVal = (prefix: string) => {
        const match = msg.match(new RegExp(`${prefix}:\\s*([^\\n]+)`, "i"));
        return match ? match[1].trim() : "";
      };

      const rawName = getVal("Student") || item.student_name || "";
      const studentName = rawName.replace(/\s*\(F:.*?\)$/, "").trim();
      const fatherName = (getVal("Father") || item.parent_name || "").trim();
      const classToJoin = (getVal("Class") || item.course || "8th Class").trim();
      const phone = (getVal("Phone") || item.phone || "").trim();
      const whatsapp = (getVal("WhatsApp") || phone || "").trim();
      const address = (getVal("Address") || "").trim();
      const place = (getVal("Place") || "").trim();
      const district = (getVal("District") || "").trim();

      const alreadyExists = existingApps.some(
        (a) =>
          (phone &&
            (a.phone === phone || a.phone_number === phone) &&
            a.student_name === studentName) ||
          (studentName && a.student_name === studentName && a.father_name === fatherName),
      );

      if (!alreadyExists && studentName) {
        createApplication({
          student_name: studentName,
          father_name: fatherName,
          class_to_join: classToJoin,
          phone,
          phone_number: phone,
          whatsapp,
          whatsapp_number: whatsapp,
          address,
          place,
          district,
          status: "New",
          created_at: item.created_at || new Date().toISOString(),
        });
      }

      // Safely delete the misclassified admission application from enquiries table
      await client.from("enquiries").delete().eq("id", item.id);
    }
  } catch (migrationErr) {
    console.warn("[Migration] Handled error in migration check:", migrationErr);
  }
}

// Sync existing site_settings applications if any exist that are not yet in our database
async function syncFromSiteSettings() {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", "admission_applications")
      .maybeSingle();

    if (data && Array.isArray(data.value) && data.value.length > 0) {
      const current = getAllApplications();
      const existingIds = new Set(current.map((a) => a.id));

      for (const item of data.value) {
        if (item && item.id && !existingIds.has(item.id)) {
          createApplication({
            student_name: item.student_name || "",
            father_name: item.father_name || "",
            class_to_join: item.class_to_join || "",
            phone: item.phone || item.phone_number || "",
            phone_number: item.phone_number || item.phone || "",
            whatsapp: item.whatsapp || item.whatsapp_number || "",
            whatsapp_number: item.whatsapp_number || item.whatsapp || "",
            address: item.address || "",
            place: item.place || "",
            district: item.district || "",
            status: item.status || "New",
            created_at: item.created_at,
            notes: item.notes,
            custom_fields: item.custom_fields,
          });
        }
      }
    }
  } catch (err) {
    // Non-blocking
  }
}

export const Route = createFileRoute("/api/admissions/applications")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const authHeader = request.headers.get("authorization");

          // Run background migrations if auth is provided
          await migrateMisclassifiedFromEnquiries(authHeader);
          await syncFromSiteSettings();

          const applications = getAllApplications();

          return new Response(JSON.stringify({ applications }), {
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store, no-cache, must-revalidate",
            },
          });
        } catch (err) {
          console.error("[API applications] Exception:", err);
          return new Response(JSON.stringify({ applications: [] }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },

      PATCH: async ({ request }) => {
        try {
          const body = await request.json();
          const { id, status, notes } = body;

          if (!id) {
            return new Response(JSON.stringify({ success: false, message: "ID is required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const updated = updateApplication(id, {
            status: status as AdmissionApplicationStatus,
            notes,
          });

          if (!updated) {
            return new Response(
              JSON.stringify({ success: false, message: "Application not found" }),
              { status: 404, headers: { "Content-Type": "application/json" } },
            );
          }

          // Optional sync with site_settings
          try {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            const all = getAllApplications();
            await supabaseAdmin.from("site_settings").upsert(
              {
                key: "admission_applications",
                value: all,
              },
              { onConflict: "key" },
            );
          } catch {
            // non-blocking
          }

          return new Response(JSON.stringify({ success: true, application: updated }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("[API applications PATCH] Error:", err);
          return new Response(
            JSON.stringify({ success: false, message: "Failed to update application" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },

      DELETE: async ({ request }) => {
        try {
          const body = await request.json();
          const { id } = body;

          if (!id) {
            return new Response(JSON.stringify({ success: false, message: "ID is required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          deleteApplication(id);

          // Optional sync with site_settings
          try {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            const all = getAllApplications();
            await supabaseAdmin.from("site_settings").upsert(
              {
                key: "admission_applications",
                value: all,
              },
              { onConflict: "key" },
            );
          } catch {
            // non-blocking
          }

          return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("[API applications DELETE] Error:", err);
          return new Response(
            JSON.stringify({ success: false, message: "Failed to delete application" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
