import { createFileRoute } from "@tanstack/react-router";
import { verifyAdminRequest } from "@/server/auth-admin";
import {
  getAllApplications,
  updateApplication,
  deleteApplication,
  type AdmissionApplicationStatus,
} from "@/server/db/admission-applications";

export const Route = createFileRoute("/api/admissions/applications")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const isAdmin = await verifyAdminRequest(request);
          if (!isAdmin) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 403,
              headers: { "Content-Type": "application/json" },
            });
          }

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
          const isAdmin = await verifyAdminRequest(request);
          if (!isAdmin) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 403,
              headers: { "Content-Type": "application/json" },
            });
          }

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
          const isAdmin = await verifyAdminRequest(request);
          if (!isAdmin) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 403,
              headers: { "Content-Type": "application/json" },
            });
          }

          const body = await request.json();
          const { id } = body;

          if (!id) {
            return new Response(JSON.stringify({ success: false, message: "ID is required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          deleteApplication(id);

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
