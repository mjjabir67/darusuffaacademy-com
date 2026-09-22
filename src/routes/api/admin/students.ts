import { createFileRoute } from "@tanstack/react-router";
import { verifyAdminRequest } from "@/server/auth-admin";
import {
  getAllStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  decryptCode,
  STUDENT_BATCHES,
  type StudentBatch,
} from "@/server/db/students";

export const Route = createFileRoute("/api/admin/students")({
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
          const rawStudents = getAllStudents();
          const students = rawStudents.map((s) => ({
            id: s.id,
            name: s.name,
            batch: s.batch,
            login_code: decryptCode(s.login_code_enc),
            active: s.active,
            created_at: s.created_at,
            updated_at: s.updated_at,
          }));

          return new Response(JSON.stringify({ students }), {
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store",
            },
          });
        } catch (err) {
          console.error("[Admin Students GET] Error:", err);
          return new Response(JSON.stringify({ error: "Failed to fetch students" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },

      POST: async ({ request }) => {
        const isAdmin = await verifyAdminRequest(request);
        if (!isAdmin) {
          return new Response(JSON.stringify({ error: "Unauthorized admin access" }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const body = await request.json();
          const { name, batch, login_code, active } = body || {};

          if (!name || typeof name !== "string" || !name.trim()) {
            return new Response(JSON.stringify({ error: "Student name is required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          if (!batch || !STUDENT_BATCHES.includes(batch as StudentBatch)) {
            return new Response(
              JSON.stringify({
                error: `Valid batch required (${STUDENT_BATCHES.join(", ")})`,
              }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
          }

          const cleanCode = String(login_code || "").trim();
          if (!/^\d{3}$/.test(cleanCode)) {
            return new Response(
              JSON.stringify({ error: "Login code must be exactly 3 digits (e.g. 101)" }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
          }

          const student = createStudent({
            name: name.trim(),
            batch: batch as StudentBatch,
            login_code: cleanCode,
            active: active !== false,
          });

          return new Response(
            JSON.stringify({
              success: true,
              student: {
                id: student.id,
                name: student.name,
                batch: student.batch,
                login_code: cleanCode,
                active: student.active,
                created_at: student.created_at,
                updated_at: student.updated_at,
              },
            }),
            {
              status: 201,
              headers: { "Content-Type": "application/json" },
            },
          );
        } catch (err) {
          console.error("[Admin Students POST] Error:", err);
          return new Response(JSON.stringify({ error: "Failed to create student" }), {
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
          const { id, name, batch, login_code, active } = body || {};

          if (!id) {
            return new Response(JSON.stringify({ error: "Student ID is required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          if (batch && !STUDENT_BATCHES.includes(batch as StudentBatch)) {
            return new Response(JSON.stringify({ error: "Invalid batch provided" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          if (login_code && !/^\d{3}$/.test(String(login_code).trim())) {
            return new Response(JSON.stringify({ error: "Login code must be exactly 3 digits" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const updated = updateStudent(id, {
            name: typeof name === "string" ? name.trim() : undefined,
            batch: batch as StudentBatch | undefined,
            login_code: login_code ? String(login_code).trim() : undefined,
            active: typeof active === "boolean" ? active : undefined,
          });

          if (!updated) {
            return new Response(JSON.stringify({ error: "Student not found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }

          return new Response(
            JSON.stringify({
              success: true,
              student: {
                id: updated.id,
                name: updated.name,
                batch: updated.batch,
                login_code: decryptCode(updated.login_code_enc),
                active: updated.active,
                created_at: updated.created_at,
                updated_at: updated.updated_at,
              },
            }),
            { headers: { "Content-Type": "application/json" } },
          );
        } catch (err) {
          console.error("[Admin Students PATCH] Error:", err);
          return new Response(JSON.stringify({ error: "Failed to update student" }), {
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
            return new Response(JSON.stringify({ error: "Student ID required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          deleteStudent(id);
          return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("[Admin Students DELETE] Error:", err);
          return new Response(JSON.stringify({ error: "Failed to delete student" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
