import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/site/PageShell";
import quranDark from "@/assets/quran-dark.jpg";
import { useSsfDawaSettings, useSsfDawaEvents, type SsfDawaEvent } from "@/lib/cms";
import { Calendar, Images, Sparkles, Eye } from "lucide-react";
import { MediaViewerModal, type MediaItem } from "@/components/site/MediaViewerModal";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/ssf-dawa")({
  head: () => ({
    meta: [
      { title: "SSF Darusuffa Da'wa | Darusuffa Academy" },
      {
        name: "description",
        content:
          "The SSF Da'wa unit at Darusuffa Academy promotes the peaceful message of Islam through knowledge, character and service under the guidance of the Sunni Students' Federation.",
      },
      { property: "og:title", content: "SSF Darusuffa Da'wa" },
      {
        property: "og:description",
        content:
          "Knowledge, character and service — the SSF Da'wa unit of Darusuffa Academy, Vadeesunnah Kolathur.",
      },
    ],
  }),
  component: SsfDawa,
});

function SsfDawa() {
  const settings = useSsfDawaSettings();
  const { events } = useSsfDawaEvents(true); // only published
  const [selectedEvent, setSelectedEvent] = useState<SsfDawaEvent | null>(null);

  // Convert selected event's images to MediaViewerModal format
  const viewerMedia: MediaItem[] = (selectedEvent?.images || []).map((img) => ({
    id: img.id,
    url: img.image_url,
    caption: img.caption || selectedEvent?.event_name,
    type: "image",
  }));

  return (
    <PageShell
      eyebrow={settings.eyebrow || "Campus unit"}
      title={settings.title || "SSF Darusuffa Da'wa"}
      intro={settings.intro || "Rooted in the values of truth, tolerance and wisdom."}
    >
      {/* Intro Description */}
      <section className="mx-auto max-w-4xl px-5 pt-12 pb-6">
        <p className="text-lg leading-relaxed text-foreground sm:text-xl">
          {settings.description1 ||
            "Our institution proudly hosts an active SSF Da'wa Unit, functioning under the spiritual and intellectual guidance of the Sunni Students' Federation (SSF). The unit is dedicated to promoting the peaceful message of Islam through knowledge, character and service."}
        </p>
        <p className="mt-5 leading-relaxed text-muted-foreground sm:text-lg">
          {settings.description2 ||
            "Through study circles, campus programmes, social service drives and community outreach, the unit trains students to carry the teachings of the Qur'an and Sunnah with wisdom and good conduct — engaging society with compassion rather than confrontation."}
        </p>
      </section>

      {/* Quote Banner */}
      <section className="relative my-10 overflow-hidden">
        <img
          src={settings.bannerImage || quranDark}
          alt=""
          aria-hidden
          loading="lazy"
          width={1920}
          height={1200}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[oklch(0.18_0.014_60)]/88" />
        <p className="relative mx-auto max-w-4xl px-5 py-20 text-center font-display text-2xl text-ink-foreground sm:text-3xl">
          "{settings.quote || "Invite to the way of your Lord with wisdom and beautiful preaching."}
          "
        </p>
      </section>

      {/* Events & Activities Section */}
      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Activities & Programmes
          </p>
          <h2 className="mt-1 font-display text-3xl text-foreground">SSF Da'wa Events</h2>
        </div>

        {events.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((ev) => {
              const coverImg = ev.images && ev.images.length > 0 ? ev.images[0].image_url : null;
              const imageCount = ev.images ? ev.images.length : 0;

              return (
                <article
                  key={ev.id}
                  className="card-soft flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  {/* Event Cover Photo */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted/60">
                    {coverImg ? (
                      <img
                        src={coverImg}
                        alt={ev.event_name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-muted-foreground">
                        <Images size={32} className="text-primary/70 mb-2" />
                        <span className="font-display text-base text-foreground line-clamp-2">
                          {ev.event_name}
                        </span>
                      </div>
                    )}

                    {/* Image Counter Badge */}
                    {imageCount > 0 && (
                      <div className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1 text-xs font-medium text-foreground backdrop-blur shadow-sm">
                        <Images size={12} className="text-primary" />
                        <span>
                          {imageCount} {imageCount === 1 ? "Photo" : "Photos"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Event Info */}
                  <div className="flex flex-1 flex-col justify-between p-6">
                    <div>
                      {ev.date && (
                        <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar size={13} className="text-primary" />
                          <span>{ev.date}</span>
                        </div>
                      )}
                      <h3 className="font-display text-xl text-foreground line-clamp-2">
                        {ev.event_name}
                      </h3>
                      {ev.description && (
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                          {ev.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-border">
                      <Button
                        type="button"
                        onClick={() => setSelectedEvent(ev)}
                        disabled={imageCount === 0}
                        className="w-full justify-center gap-2 rounded-xl"
                        variant={imageCount > 0 ? "default" : "outline"}
                      >
                        <Eye size={16} />
                        <span>{imageCount > 0 ? "View Event Media" : "No Media Available"}</span>
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mx-auto max-w-md rounded-3xl border border-dashed border-border p-12 text-center">
            <Sparkles className="mx-auto h-12 w-12 text-muted-foreground/60" />
            <h3 className="mt-4 font-display text-xl text-foreground">
              No SSF Da'wa events published yet
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Programmes, study circles, and community drives will appear here once published by the
              unit coordinators.
            </p>
          </div>
        )}
      </section>

      {/* Lightbox / Media Viewer Modal */}
      {selectedEvent && viewerMedia.length > 0 && (
        <MediaViewerModal
          isOpen={Boolean(selectedEvent)}
          onClose={() => setSelectedEvent(null)}
          title={selectedEvent.event_name}
          subtitle={selectedEvent.date || undefined}
          media={viewerMedia}
          initialIndex={0}
        />
      )}
    </PageShell>
  );
}
