import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { usePublishedGallery, groupGalleryAlbums, type GalleryAlbum } from "@/lib/cms";
import { Button } from "@/components/ui/button";
import { MediaViewerModal } from "@/components/site/MediaViewerModal";
import students from "@/assets/students.jpg";
import campus from "@/assets/campus.jpg";

export const Route = createFileRoute("/media")({
  head: () => ({
    meta: [
      { title: "Media Gallery | Darusuffa Academy" },
      {
        name: "description",
        content:
          "Photo gallery from Darusuffa Academy programmes — camps, fests and academic events at Vadeesunnah, Kolathur.",
      },
      { property: "og:title", content: "Media | Darusuffa Academy" },
      {
        property: "og:description",
        content: "Moments from campus programmes, camps and fests at Darusuffa Academy.",
      },
    ],
  }),
  component: Media,
});

const DEFAULT_ALBUMS: GalleryAlbum[] = [
  {
    title: "Engspire",
    slug: "engspire",
    caption: "Ten-day English proficiency camp",
    coverImage: students,
    count: 1,
    images: [
      {
        id: "default-engspire-1",
        url: students,
        caption: "Engspire — Ten-day English proficiency camp",
        type: "image",
        sort_order: 0,
        published: true,
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    title: "Amazio 24",
    slug: "amazio-2026",
    caption: "Literary and arts fest of the academy",
    coverImage: campus,
    count: 1,
    images: [
      {
        id: "default-amazio-1",
        url: campus,
        caption: "Amazio 24 — Literary and arts fest of the academy",
        type: "image",
        sort_order: 0,
        published: true,
        created_at: new Date().toISOString(),
      },
    ],
  },
];

function Media() {
  const { data: galleryImages, isLoading } = usePublishedGallery();
  const [activeAlbum, setActiveAlbum] = useState<GalleryAlbum | null>(null);

  const dynamicAlbums =
    galleryImages && galleryImages.length > 0 ? groupGalleryAlbums(galleryImages) : [];

  const displayAlbums = dynamicAlbums.length > 0 ? dynamicAlbums : DEFAULT_ALBUMS;

  return (
    <PageShell
      eyebrow="Gallery"
      title="Media"
      intro="Moments from the programmes, camps and fests of Darusuffa Academy."
    >
      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-20 md:grid-cols-2">
        {isLoading && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            Loading gallery albums...
          </div>
        )}

        {displayAlbums.map((album) => (
          <div
            key={album.slug}
            id={`gallery-album-card-${album.slug}`}
            className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)] transition-all hover:shadow-lg"
          >
            <div
              className="relative h-72 w-full cursor-pointer overflow-hidden bg-muted"
              onClick={() => setActiveAlbum(album)}
            >
              <img
                src={album.coverImage}
                alt={album.title}
                loading="lazy"
                width={1200}
                height={900}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = campus;
                }}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 font-mono text-xs font-medium text-white backdrop-blur">
                {album.count} {album.count === 1 ? "Photo" : "Photos"}
              </span>
            </div>

            <div className="flex flex-1 flex-col justify-between p-6">
              <div>
                <h2 className="font-display text-xl text-card-foreground">{album.title}</h2>
                <p className="mt-1 text-sm font-medium text-primary">
                  {album.count} {album.count === 1 ? "Photo" : "Photos"}
                </p>
                {album.caption && album.caption !== album.title && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{album.caption}</p>
                )}
              </div>

              <div className="mt-6">
                <Button
                  id={`view-gallery-btn-${album.slug}`}
                  type="button"
                  variant="outline"
                  className="w-full rounded-full border-primary/20 text-primary transition-all hover:bg-primary hover:text-primary-foreground font-display text-sm"
                  onClick={() => setActiveAlbum(album)}
                >
                  View Gallery
                </Button>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Album Popup Gallery */}
      <MediaViewerModal
        isOpen={Boolean(activeAlbum)}
        onClose={() => setActiveAlbum(null)}
        title={activeAlbum?.title ?? "Gallery Album"}
        subtitle={
          activeAlbum
            ? `${activeAlbum.count} ${activeAlbum.count === 1 ? "Photo" : "Photos"}`
            : undefined
        }
        media={
          activeAlbum?.images.map((img) => ({
            id: img.id,
            url: img.url,
            caption: img.caption,
            type: img.type,
          })) ?? []
        }
      />
    </PageShell>
  );
}
