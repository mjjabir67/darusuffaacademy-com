import { createFileRoute } from "@tanstack/react-router";
import { getPublishedSubmissions } from "@/server/db/students";

export const Route = createFileRoute("/api/public/student-works")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const batch = url.searchParams.get("batch") || undefined;
          const workType = url.searchParams.get("work_type") || undefined;
          const search = (url.searchParams.get("search") || "").trim().toLowerCase();

          let works = getPublishedSubmissions({
            batch,
            work_type: workType,
          });

          if (search) {
            works = works.filter((w) => {
              return (
                w.title.toLowerCase().includes(search) ||
                w.student_name.toLowerCase().includes(search) ||
                (w.description && w.description.toLowerCase().includes(search)) ||
                (w.content && w.content.toLowerCase().includes(search))
              );
            });
          }

          // Return sanitized list
          const safeWorks = works.map((w) => ({
            id: w.id,
            student_name: w.student_name,
            batch: w.batch,
            title: w.title,
            work_type: w.work_type,
            description: w.description || "",
            content: w.content || "",
            media_url: w.media_url || "",
            file_url: w.file_url || "",
            file_name: w.file_name || "",
            created_at: w.created_at,
          }));

          return new Response(JSON.stringify({ works: safeWorks }), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=30, s-maxage=60",
            },
          });
        } catch (err) {
          console.error("[Public Student Works GET] Error:", err);
          return new Response(JSON.stringify({ error: "Failed to load works" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
