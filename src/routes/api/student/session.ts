import { createFileRoute } from "@tanstack/react-router";
import { getStudentById, verifyStudentSessionToken } from "@/server/db/students";

export const Route = createFileRoute("/api/student/session")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const authHeader = request.headers.get("authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ valid: false, message: "No session token provided" }),
              { status: 401, headers: { "Content-Type": "application/json" } },
            );
          }

          const token = authHeader.replace(/^Bearer\s+/i, "").trim();
          const session = verifyStudentSessionToken(token);

          if (!session) {
            return new Response(
              JSON.stringify({ valid: false, message: "Invalid or expired session" }),
              { status: 401, headers: { "Content-Type": "application/json" } },
            );
          }

          const student = getStudentById(session.studentId);
          if (!student || !student.active) {
            return new Response(
              JSON.stringify({ valid: false, message: "Student account inactive or not found" }),
              { status: 401, headers: { "Content-Type": "application/json" } },
            );
          }

          return new Response(
            JSON.stringify({
              valid: true,
              student: {
                id: student.id,
                name: student.name,
                batch: student.batch,
              },
            }),
            {
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-store",
              },
            },
          );
        } catch (err) {
          console.error("[Student Session API] Error:", err);
          return new Response(
            JSON.stringify({ valid: false, message: "Session verification error" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
