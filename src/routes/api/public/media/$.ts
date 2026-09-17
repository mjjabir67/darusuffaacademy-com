import { createFileRoute } from "@tanstack/react-router";

function getMimeType(filePath: string, detectedType?: string | null): string {
  if (
    detectedType &&
    detectedType !== "application/octet-stream" &&
    detectedType !== "text/plain"
  ) {
    return detectedType;
  }
  const ext = filePath.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "svg":
      return "image/svg+xml";
    case "mp4":
      return "video/mp4";
    case "webm":
      return "video/webm";
    case "mov":
      return "video/quicktime";
    case "pdf":
      return "application/pdf";
    case "doc":
      return "application/msword";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    default:
      return detectedType || "application/octet-stream";
  }
}

export const Route = createFileRoute("/api/public/media/$")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        let path = (params as { _splat?: string })?._splat;
        if (!path && request?.url) {
          try {
            const parsed = new URL(request.url);
            path = decodeURIComponent(parsed.pathname.replace(/^\/api\/public\/media\//, ""));
          } catch {
            // ignore
          }
        }

        if (!path) return new Response("Not found", { status: 404 });

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data, error } = await supabaseAdmin.storage.from("site-media").download(path);

          if (error || !data) {
            console.warn("[Media Proxy] Storage download failed for path:", path, error);
            return new Response("Not found", { status: 404 });
          }

          const arrayBuffer = await data.arrayBuffer();
          const contentType = getMimeType(path, data.type);

          return new Response(arrayBuffer, {
            headers: {
              "content-type": contentType,
              "cache-control": "public, max-age=86400",
            },
          });
        } catch (err) {
          console.error("[Media Proxy] Exception serving media path:", path, err);
          return new Response("Error retrieving media", { status: 500 });
        }
      },
      DELETE: async ({ request, params }) => {
        let path = (params as { _splat?: string })?._splat;
        if (!path && request?.url) {
          try {
            const parsed = new URL(request.url);
            path = decodeURIComponent(parsed.pathname.replace(/^\/api\/public\/media\//, ""));
          } catch {
            // ignore
          }
        }

        if (!path) {
          return new Response(JSON.stringify({ error: "Missing path" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data, error } = await supabaseAdmin.storage.from("site-media").remove([path]);

          if (error) {
            console.error("[Media Proxy] Storage delete failed for path:", path, error);
            return new Response(JSON.stringify({ error: error.message }), {
              status: 500,
              headers: { "content-type": "application/json" },
            });
          }

          return new Response(JSON.stringify({ success: true, removed: data }), {
            headers: { "content-type": "application/json" },
          });
        } catch (err) {
          console.error("[Media Proxy] Storage delete exception:", path, err);
          return new Response(JSON.stringify({ error: "Internal server error" }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }
      },
    },
  },
});
