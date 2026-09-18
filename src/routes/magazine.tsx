import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/site/PageShell";
import { useMagazines, type MagazineItem } from "@/lib/cms";
import { BookOpen, Calendar, ExternalLink, FileText, X, Download, Maximize2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/magazine")({
  head: () => ({
    meta: [
      { title: "Magazines & Publications | Darusuffa Academy" },
      {
        name: "description",
        content:
          "Read official campus magazines, student periodicals, research collections and annual publications from Darusuffa Academy.",
      },
      { property: "og:title", content: "Magazines & Publications | Darusuffa Academy" },
      {
        property: "og:description",
        content:
          "Explore student journals, annual magazines, and literary publications from Darusuffa Academy.",
      },
    ],
  }),
  component: MagazinePage,
});

function MagazinePage() {
  const { magazines } = useMagazines(true); // only published
  const [readingMagazine, setReadingMagazine] = useState<MagazineItem | null>(null);

  const handleOpenMagazine = (mag: MagazineItem) => {
    if (mag.source_type === "link" && mag.external_url) {
      window.open(mag.external_url, "_blank", "noopener,noreferrer");
      return;
    }
    if (mag.source_type === "pdf" && mag.pdf_url) {
      setReadingMagazine(mag);
    }
  };

  return (
    <PageShell
      eyebrow="Academic & Literary Publications"
      title="Magazines"
      intro="Periodicals, scholarly journals, and annual campus editions published by the students and faculties of Darusuffa Academy."
    >
      <section className="mx-auto max-w-6xl px-5 py-12">
        {magazines.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {magazines.map((mag) => {
              const hasPdf = mag.source_type === "pdf" && Boolean(mag.pdf_url);
              const hasLink = mag.source_type === "link" && Boolean(mag.external_url);
              const canOpen = hasPdf || hasLink;

              return (
                <article
                  key={mag.id}
                  className="card-soft flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  {/* Cover Image or Fallback Header */}
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted/60">
                    {mag.cover_image ? (
                      <img
                        src={mag.cover_image}
                        alt={mag.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-muted-foreground">
                        <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <BookOpen size={32} />
                        </div>
                        <span className="font-display text-lg font-medium text-foreground">
                          {mag.title}
                        </span>
                        {mag.publication_date && (
                          <span className="mt-1 text-xs text-muted-foreground">
                            Edition: {mag.publication_date}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Date Badge */}
                    {mag.publication_date && (
                      <div className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1 text-xs font-medium text-foreground backdrop-blur shadow-sm">
                        <Calendar size={12} className="text-primary" />
                        <span>{mag.publication_date}</span>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="flex flex-1 flex-col justify-between p-6">
                    <div>
                      <h2 className="font-display text-xl text-foreground line-clamp-2">
                        {mag.title}
                      </h2>
                      {mag.description && (
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                          {mag.description}
                        </p>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="mt-6 pt-4 border-t border-border">
                      <Button
                        type="button"
                        onClick={() => handleOpenMagazine(mag)}
                        disabled={!canOpen}
                        className="w-full justify-center gap-2 rounded-xl"
                        variant={canOpen ? "default" : "outline"}
                      >
                        {mag.source_type === "pdf" ? (
                          <>
                            <FileText size={16} />
                            <span>Read Magazine</span>
                          </>
                        ) : (
                          <>
                            <ExternalLink size={16} />
                            <span>Open Magazine</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mx-auto max-w-md rounded-3xl border border-dashed border-border p-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/60" />
            <h3 className="mt-4 font-display text-xl text-foreground">
              No magazines published yet
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              New periodicals and publications will appear here once released by the academy
              editorial board.
            </p>
          </div>
        )}
      </section>

      {/* PDF Reader Modal Dialog */}
      {readingMagazine && (
        <Dialog
          open={Boolean(readingMagazine)}
          onOpenChange={(open) => !open && setReadingMagazine(null)}
        >
          <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden sm:rounded-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5 bg-card">
              <div className="flex items-center gap-3 min-w-0 pr-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <BookOpen size={18} />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="truncate font-display text-base text-foreground">
                    {readingMagazine.title}
                  </DialogTitle>
                  {readingMagazine.publication_date && (
                    <p className="text-xs text-muted-foreground">
                      Published: {readingMagazine.publication_date}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {readingMagazine.pdf_url && (
                  <>
                    <a
                      href={readingMagazine.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-foreground hover:bg-muted"
                      title="Open in new window"
                    >
                      <Maximize2 size={13} />
                      <span className="hidden sm:inline">New Tab</span>
                    </a>
                    <a
                      href={readingMagazine.pdf_url}
                      download={readingMagazine.pdf_filename || `${readingMagazine.title}.pdf`}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-foreground hover:bg-muted"
                      title="Download PDF copy"
                    >
                      <Download size={13} />
                      <span className="hidden sm:inline">Download</span>
                    </a>
                  </>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setReadingMagazine(null)}
                  className="h-9 px-3 text-xs"
                >
                  <X size={16} className="mr-1" />
                  <span>Return to Magazines</span>
                </Button>
              </div>
            </div>

            {/* Embedded Browser PDF Viewer */}
            <div className="relative flex-1 w-full bg-muted/40">
              {readingMagazine.pdf_url ? (
                <iframe
                  src={`${readingMagazine.pdf_url}#toolbar=1&navpanes=1`}
                  title={readingMagazine.title}
                  className="h-full w-full border-0"
                />
              ) : (
                <div className="flex h-full items-center justify-center p-6 text-center">
                  <p className="text-sm text-muted-foreground">PDF file not available</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </PageShell>
  );
}
