import { createFileRoute } from "@tanstack/react-router";
import { getActiveStudents } from "@/server/db/students";

export const Route = createFileRoute("/api/public/students")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const batch = url.searchParams.get("batch") || undefined;

          const students = getActiveStudents(batch);
          return new Response(JSON.stringify({ students }), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=15, s-maxage=30",
            },
          });
        } catch (err) {
          console.error("[Public Students GET] Error:", err);
          return new Response(JSON.stringify({ error: "Failed to load students" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
