import { createFileRoute } from "@tanstack/react-router";
import {
  createSubmission,
  deleteSubmission,
  getSubmissionById,
  getSubmissionsByStudentId,
  getStudentById,
  updateSubmission,
  verifyStudentSessionToken,
  STUDENT_WORK_TYPES,
  type StudentWorkType,
} from "@/server/db/students";

export const Route = createFileRoute("/api/student/submissions")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const authHeader = request.headers.get("authorization");
          if (!authHeader) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          const token = authHeader.replace(/^Bearer\s+/i, "").trim();
          const session = verifyStudentSessionToken(token);
          if (!session) {
            return new Response(JSON.stringify({ error: "Invalid session" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          const student = getStudentById(session.studentId);
          if (!student || !student.active) {
            return new Response(JSON.stringify({ error: "Account inactive" }), {
              status: 403,
              headers: { "Content-Type": "application/json" },
            });
          }

          const submissions = getSubmissionsByStudentId(student.id);
          return new Response(JSON.stringify({ submissions }), {
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store",
            },
          });
        } catch (err) {
          console.error("[Student Submissions GET] Error:", err);
          return new Response(JSON.stringify({ error: "Internal error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },

      POST: async ({ request }) => {
        try {
          const authHeader = request.headers.get("authorization");
          if (!authHeader) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          const token = authHeader.replace(/^Bearer\s+/i, "").trim();
          const session = verifyStudentSessionToken(token);
          if (!session) {
            return new Response(JSON.stringify({ error: "Invalid session" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          const student = getStudentById(session.studentId);
          if (!student || !student.active) {
            return new Response(JSON.stringify({ error: "Account inactive" }), {
              status: 403,
              headers: { "Content-Type": "application/json" },
            });
          }

          const body = await request.json();
          const { title, work_type, description, content, media_url, file_url, file_name } =
            body || {};

          if (!title || typeof title !== "string" || !title.trim()) {
            return new Response(JSON.stringify({ error: "Work title is required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          if (!work_type || !STUDENT_WORK_TYPES.includes(work_type as StudentWorkType)) {
            return new Response(JSON.stringify({ error: "Valid work type is required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const submission = createSubmission({
            student_id: student.id,
            student_name: student.name,
            batch: student.batch,
            title: title.trim(),
            work_type: work_type as StudentWorkType,
            description: typeof description === "string" ? description.trim() : "",
            content: typeof content === "string" ? content.trim() : "",
            media_url: typeof media_url === "string" ? media_url.trim() : "",
            file_url: typeof file_url === "string" ? file_url.trim() : "",
            file_name: typeof file_name === "string" ? file_name.trim() : "",
          });

          return new Response(JSON.stringify({ success: true, submission }), {
            status: 201,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("[Student Submissions POST] Error:", err);
          return new Response(JSON.stringify({ error: "Failed to create submission" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },

      PATCH: async ({ request }) => {
        try {
          const authHeader = request.headers.get("authorization");
          if (!authHeader) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          const token = authHeader.replace(/^Bearer\s+/i, "").trim();
          const session = verifyStudentSessionToken(token);
          if (!session) {
            return new Response(JSON.stringify({ error: "Invalid session" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          const body = await request.json();
          const { id, title, work_type, description, content, media_url, file_url, file_name } =
            body || {};

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

          // Must belong to this student
          if (existing.student_id !== session.studentId) {
            return new Response(JSON.stringify({ error: "Access denied" }), {
              status: 403,
              headers: { "Content-Type": "application/json" },
            });
          }

          // Editable only while "Submitted" or "Under Review"
          if (existing.status !== "Submitted" && existing.status !== "Under Review") {
            return new Response(
              JSON.stringify({
                error: "This work has already been reviewed and cannot be edited by the student.",
              }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
          }

          const updated = updateSubmission(id, {
            title: typeof title === "string" ? title.trim() : undefined,
            work_type:
              work_type && STUDENT_WORK_TYPES.includes(work_type as StudentWorkType)
                ? (work_type as StudentWorkType)
                : undefined,
            description: typeof description === "string" ? description.trim() : undefined,
            content: typeof content === "string" ? content.trim() : undefined,
            media_url: typeof media_url === "string" ? media_url.trim() : undefined,
            file_url: typeof file_url === "string" ? file_url.trim() : undefined,
            file_name: typeof file_name === "string" ? file_name.trim() : undefined,
          });

          return new Response(JSON.stringify({ success: true, submission: updated }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("[Student Submissions PATCH] Error:", err);
          return new Response(JSON.stringify({ error: "Failed to update submission" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },

      DELETE: async ({ request }) => {
        try {
          const authHeader = request.headers.get("authorization");
          if (!authHeader) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          const token = authHeader.replace(/^Bearer\s+/i, "").trim();
          const session = verifyStudentSessionToken(token);
          if (!session) {
            return new Response(JSON.stringify({ error: "Invalid session" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          const url = new URL(request.url);
          const id = url.searchParams.get("id");
          if (!id) {
            return new Response(JSON.stringify({ error: "ID required" }), {
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

          if (existing.student_id !== session.studentId) {
            return new Response(JSON.stringify({ error: "Access denied" }), {
              status: 403,
              headers: { "Content-Type": "application/json" },
            });
          }

          if (existing.status !== "Submitted" && existing.status !== "Under Review") {
            return new Response(
              JSON.stringify({
                error: "This work has already been processed and cannot be deleted by the student.",
              }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
          }

          deleteSubmission(id);
          return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("[Student Submissions DELETE] Error:", err);
          return new Response(JSON.stringify({ error: "Failed to delete submission" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
