import { createFileRoute } from "@tanstack/react-router";
import { verifyAdminRequest } from "@/server/auth-admin";
import {
  getAllSubmissions,
  getSubmissionById,
  updateSubmission,
  deleteSubmission,
  STUDENT_WORK_TYPES,
  type StudentWorkType,
  type StudentSubmissionStatus,
} from "@/server/db/students";

export const Route = createFileRoute("/api/admin/submissions")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const isAdmin = await verifyAdminRequest(request);
        if (!isAdmin) {
          return new Response(JSON.stringify({ error: "Unauthorized admin access" }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const url = new URL(request.url);
          const batchFilter = url.searchParams.get("batch");
          const statusFilter = url.searchParams.get("status");
          const typeFilter = url.searchParams.get("work_type");
          const studentFilter = url.searchParams.get("student_id");
          const search = url.searchParams.get("search")?.toLowerCase().trim();

          let submissions = getAllSubmissions();

          if (batchFilter && batchFilter !== "All") {
            submissions = submissions.filter((s) => s.batch === batchFilter);
          }
          if (statusFilter && statusFilter !== "All") {
            submissions = submissions.filter((s) => s.status === statusFilter);
          }
          if (typeFilter && typeFilter !== "All") {
            submissions = submissions.filter((s) => s.work_type === typeFilter);
          }
          if (studentFilter) {
            submissions = submissions.filter((s) => s.student_id === studentFilter);
          }
          if (search) {
            submissions = submissions.filter(
              (s) =>
                s.title.toLowerCase().includes(search) ||
                s.student_name.toLowerCase().includes(search) ||
                (s.description && s.description.toLowerCase().includes(search)) ||
                (s.content && s.content.toLowerCase().includes(search)),
            );
          }

          return new Response(JSON.stringify({ submissions }), {
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store",
            },
          });
        } catch (err) {
          console.error("[Admin Submissions GET] Error:", err);
          return new Response(JSON.stringify({ error: "Failed to fetch submissions" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },

      PATCH: async ({ request }) => {
        const isAdmin = await verifyAdminRequest(request);
        if (!isAdmin) {
          return new Response(JSON.stringify({ error: "Unauthorized admin access" }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const body = await request.json();
          const {
            id,
            status,
            is_published,
            published,
            admin_notes,
            title,
            work_type,
            content,
            description,
          } = body || {};

          if (!id) {
            return new Response(JSON.stringify({ error: "Submission ID is required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const existing = getSubmissionById(id);
          if (!existing) {
            return new Response(JSON.stringify({ error: "Submission not found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }

          const validStatuses = ["Submitted", "Under Review", "Approved", "Rejected"];
          if (status && !validStatuses.includes(status)) {
            return new Response(JSON.stringify({ error: "Invalid status value" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          // Determine publish status
          const hasPublishFlag = is_published !== undefined || published !== undefined;
          const targetPublished =
            is_published !== undefined ? Boolean(is_published) : Boolean(published);

          // If publishing, auto-approve if not explicitly set to something else
          let targetStatus = status as StudentSubmissionStatus | undefined;
          if (
            hasPublishFlag &&
            targetPublished &&
            !targetStatus &&
            existing.status !== "Approved"
          ) {
            targetStatus = "Approved";
          }

          const updated = updateSubmission(id, {
            status: targetStatus,
            is_published: hasPublishFlag ? targetPublished : undefined,
            admin_notes: typeof admin_notes === "string" ? admin_notes.trim() : undefined,
            title: typeof title === "string" ? title.trim() : undefined,
            work_type:
              work_type && STUDENT_WORK_TYPES.includes(work_type as StudentWorkType)
                ? (work_type as StudentWorkType)
                : undefined,
            content: typeof content === "string" ? content.trim() : undefined,
            description: typeof description === "string" ? description.trim() : undefined,
          });

          return new Response(JSON.stringify({ success: true, submission: updated }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("[Admin Submissions PATCH] Error:", err);
          return new Response(JSON.stringify({ error: "Failed to update submission" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },

      DELETE: async ({ request }) => {
        const isAdmin = await verifyAdminRequest(request);
        if (!isAdmin) {
          return new Response(JSON.stringify({ error: "Unauthorized admin access" }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const url = new URL(request.url);
          const id = url.searchParams.get("id");
          if (!id) {
            return new Response(JSON.stringify({ error: "Submission ID is required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          deleteSubmission(id);
          return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("[Admin Submissions DELETE] Error:", err);
          return new Response(JSON.stringify({ error: "Failed to delete submission" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
