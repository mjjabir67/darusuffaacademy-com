import { createFileRoute } from "@tanstack/react-router";
import {
  authenticateStudent,
  createStudentSessionToken,
  STUDENT_BATCHES,
  type StudentBatch,
} from "@/server/db/students";

export const Route = createFileRoute("/api/student/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { name, studentId, batch, loginCode } = body || {};
          const identifier =
            studentId && typeof studentId === "string" && studentId.trim()
              ? studentId.trim()
              : name && typeof name === "string"
                ? name.trim()
                : "";

          const genericError = "Invalid login code. Please check and try again.";

          if (!identifier) {
            return new Response(
              JSON.stringify({
                success: false,
                message: genericError,
              }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
          }

          if (!batch || !STUDENT_BATCHES.includes(batch as StudentBatch)) {
            return new Response(
              JSON.stringify({
                success: false,
                message: genericError,
              }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
          }

          const codeStr = String(loginCode || "").trim();
          if (!/^\d{3}$/.test(codeStr)) {
            return new Response(
              JSON.stringify({
                success: false,
                message: genericError,
              }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
          }

          const student = authenticateStudent(identifier, batch, codeStr);
          if (!student) {
            return new Response(
              JSON.stringify({
                success: false,
                message: genericError,
              }),
              { status: 401, headers: { "Content-Type": "application/json" } },
            );
          }

          const token = createStudentSessionToken(student);

          return new Response(
            JSON.stringify({
              success: true,
              token,
              student: {
                id: student.id,
                name: student.name,
                batch: student.batch,
              },
            }),
            {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-store",
              },
            },
          );
        } catch (err) {
          console.error("[Student Login API] Error:", err);
          return new Response(
            JSON.stringify({
              success: false,
              message: "An unexpected error occurred during login. Please try again.",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
