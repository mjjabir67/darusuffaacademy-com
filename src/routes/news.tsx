import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Images } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import {
  usePublishedPosts,
  usePublishedAnnouncements,
  usePublishedGallery,
  filterEventMedia,
  formatDate,
  type Post,
} from "@/lib/cms";
import { Button } from "@/components/ui/button";
import { MediaViewerModal } from "@/components/site/MediaViewerModal";

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "News & Events | Darusuffa Academy" },
      {
        name: "description",
        content:
          "Latest news and events from Darusuffa Academy, Vadeesunnah, Kolathur — camps, fests and campus programmes.",
      },
      { property: "og:title", content: "News & Events | Darusuffa Academy" },
      {
        property: "og:description",
        content: "Updates from campus life at Darusuffa Academy, Vadeesunnah, Kolathur.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: News,
});

const KIND_LABEL: Record<string, string> = {
  news: "News",
  event: "Event",
  upcoming: "Upcoming",
};

function News() {
  const { data: posts, isLoading } = usePublishedPosts();
  const { data: announcements } = usePublishedAnnouncements();
  const { data: galleryImages } = usePublishedGallery();

  const [selectedEvent, setSelectedEvent] = useState<Post | null>(null);

  const activeMedia = selectedEvent ? filterEventMedia(selectedEvent, galleryImages ?? []) : [];

  return (
    <PageShell
      eyebrow="Updates"
      title="Latest news & updates"
      intro="Camps, fests and programmes from the campus at Vadeesunnah."
    >
      {announcements && announcements.length > 0 && (
        <section className="mx-auto max-w-4xl px-5 pt-16">
          <div className="space-y-4">
            {announcements.map((a) => (
              <div
                key={a.id}
                className="rounded-2xl border border-secondary/30 bg-secondary/10 p-5"
              >
                <p className="font-display text-lg">{a.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-4xl space-y-8 px-5 py-20">
        {isLoading && <p className="text-muted-foreground">Loading updates...</p>}

        {!isLoading && (!posts || posts.length === 0) && (
          <p className="text-muted-foreground">No updates have been published yet.</p>
        )}

        {posts?.map((item) => (
          <article key={item.id} id={item.slug} className="card-soft scroll-mt-24 p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-md bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">
                  {KIND_LABEL[item.kind] ?? item.kind}
                </span>
                <span className="text-sm text-muted-foreground">
                  {item.event_time || formatDate(item.event_date ?? item.created_at)}
                </span>
                {item.location && (
                  <span className="text-sm text-muted-foreground">· {item.location}</span>
                )}
              </div>

              {/* Event Media Button */}
              <Button
                id={`event-media-btn-${item.slug}`}
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full gap-2 text-xs font-display transition-all hover:bg-secondary hover:text-secondary-foreground"
                onClick={() => setSelectedEvent(item)}
              >
                <Images className="h-3.5 w-3.5" />
                <span>Media</span>
              </Button>
            </div>

            <h2 className="mt-4 font-display text-3xl">{item.title}</h2>
            {item.image_url && (
              <img
                src={item.image_url}
                alt={item.title}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.style.display = "none";
                }}
                className="mt-5 max-h-80 w-full rounded-2xl object-cover"
              />
            )}
            <p className="mt-4 whitespace-pre-line leading-relaxed text-muted-foreground">
              {item.body || item.summary}
            </p>
          </article>
        ))}
      </section>

      {/* Event Media Viewer / No Media Popup */}
      <MediaViewerModal
        isOpen={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent?.title ?? "Event"}
        subtitle={selectedEvent?.event_date ? formatDate(selectedEvent.event_date) : undefined}
        media={activeMedia}
      />
    </PageShell>
  );
}
