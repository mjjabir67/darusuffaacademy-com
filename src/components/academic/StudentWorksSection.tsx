import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  FileText,
  Image as ImageIcon,
  BookOpen,
  Sparkles,
  Calendar,
  User,
  Download,
  Search,
  ArrowUpRight,
  GraduationCap,
  Layers,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export interface PublicStudentWork {
  id: string;
  student_name: string;
  batch: string;
  title: string;
  work_type: string;
  description: string;
  content: string;
  media_url: string;
  file_url: string;
  file_name: string;
  created_at: string;
}

const BATCH_OPTIONS = ["All", "G4", "G5", "G6", "G7", "G8", "G9"] as const;

const WORK_TYPE_OPTIONS = [
  "All",
  "Article",
  "Essay",
  "Speech",
  "Poem",
  "Story",
  "Drawing",
  "Art",
  "Video",
  "Research",
  "Project",
  "Other",
] as const;

function formatDate(isoString: string): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export function StudentWorksSection() {
  const [selectedBatch, setSelectedBatch] = useState<string>("All");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeWork, setActiveWork] = useState<PublicStudentWork | null>(null);

  // Fetch only published & approved student works from the secure public endpoint
  const {
    data: works = [],
    isLoading,
    isError,
  } = useQuery<PublicStudentWork[]>({
    queryKey: ["public-student-works", selectedBatch, selectedType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedBatch !== "All") params.set("batch", selectedBatch);
      if (selectedType !== "All") params.set("work_type", selectedType);

      const res = await fetch(`/api/public/student-works?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load student works");
      const data = await res.json();
      return data.works || [];
    },
    staleTime: 30_000,
  });

  // Client-side search query filtering
  const filteredWorks = useMemo(() => {
    if (!searchQuery.trim()) return works;
    const q = searchQuery.toLowerCase().trim();
    return works.filter((w) => {
      return (
        w.title.toLowerCase().includes(q) ||
        w.student_name.toLowerCase().includes(q) ||
        w.batch.toLowerCase().includes(q) ||
        (w.description && w.description.toLowerCase().includes(q)) ||
        (w.content && w.content.toLowerCase().includes(q))
      );
    });
  }, [works, searchQuery]);

  return (
    <section
      id="student-works-section"
      className="bg-sand/30 py-24 px-5 border-t border-sand-dark/20"
    >
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-sand-dark/30">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles size={13} />
              <span>Student Works & Publications</span>
            </div>
            <h2 className="mt-3 font-display text-3xl md:text-4xl text-ink font-bold tracking-tight">
              Scholarly & Creative Output
            </h2>
            <p className="mt-2 text-base text-muted-foreground max-w-2xl">
              Curated articles, research papers, creative essays, poetry, and artistic pieces
              produced by students across batches at Darusuffa Academy.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/student-login"
              className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-ink px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-ink/80 hover:shadow"
            >
              <GraduationCap size={14} className="text-secondary" />
              <span>Student Portal Login</span>
            </Link>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="mt-8 space-y-4">
          {/* Top row: Search & Batch Pills */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Batch Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="shrink-0 font-medium text-ink/70 mr-1 flex items-center gap-1">
                <Filter size={13} /> Batch:
              </span>
              {BATCH_OPTIONS.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setSelectedBatch(b)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition cursor-pointer shrink-0 ${
                    selectedBatch === b
                      ? "bg-ink text-white shadow-xs"
                      : "border border-ink/15 bg-white text-ink/70 hover:bg-sand/60 hover:text-ink"
                  }`}
                >
                  {b === "All" ? "All Batches" : `Batch ${b}`}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full lg:w-72">
              <Search size={14} className="absolute left-3 top-3 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search works or authors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-full border-ink/20 bg-white pl-8 text-xs placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/30"
              />
            </div>
          </div>

          {/* Work Type Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 text-xs">
            <span className="shrink-0 font-medium text-ink/70 mr-1 flex items-center gap-1">
              <Layers size={13} /> Type:
            </span>
            {WORK_TYPE_OPTIONS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedType(t)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition cursor-pointer shrink-0 ${
                  selectedType === t
                    ? "bg-secondary text-secondary-foreground shadow-xs font-semibold"
                    : "bg-white/80 text-muted-foreground hover:bg-white hover:text-ink"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Works Grid */}
        <div className="mt-8">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="animate-pulse rounded-2xl border border-ink/10 bg-white p-6 shadow-sm space-y-4"
                >
                  <div className="h-40 rounded-xl bg-sand/60" />
                  <div className="h-4 w-3/4 rounded bg-sand/60" />
                  <div className="h-3 w-1/2 rounded bg-sand/40" />
                  <div className="h-12 rounded bg-sand/20" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-2xl border border-red-300 bg-red-50 p-8 text-center text-sm text-red-700">
              Unable to load student works at this moment. Please refresh the page.
            </div>
          ) : filteredWorks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink/20 bg-white/70 py-16 px-6 text-center shadow-xs">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sand text-ink/60">
                <BookOpen size={24} />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-ink">
                No Published Student Works Found
              </h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
                No published student works available for this category yet. Select another batch or
                filter to discover more.
              </p>
              {(selectedBatch !== "All" || selectedType !== "All" || searchQuery) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedBatch("All");
                    setSelectedType("All");
                    setSearchQuery("");
                  }}
                  className="mt-4 text-xs"
                >
                  Reset Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWorks.map((work) => (
                <article
                  key={work.id}
                  onClick={() => setActiveWork(work)}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md cursor-pointer"
                >
                  {/* Media Thumbnail */}
                  {work.media_url ? (
                    <div className="relative h-48 w-full overflow-hidden bg-ink/10">
                      <img
                        src={work.media_url}
                        alt={work.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="rounded-full bg-black/60 backdrop-blur-md px-2.5 py-0.5 text-[11px] font-semibold text-white">
                          {work.work_type}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3">
                        <span className="rounded-full bg-primary/90 text-primary-foreground backdrop-blur-md px-2 py-0.5 text-[11px] font-bold">
                          Batch {work.batch}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 pb-0 flex items-center justify-between">
                      <span className="rounded-full border border-ink/15 bg-sand/60 px-2.5 py-0.5 text-xs font-semibold text-ink">
                        {work.work_type}
                      </span>
                      <span className="rounded-full bg-primary/15 text-ink px-2.5 py-0.5 text-xs font-bold">
                        Batch {work.batch}
                      </span>
                    </div>
                  )}

                  {/* Card Content */}
                  <div className="flex-1 p-5 flex flex-col justify-between">
                    <div>
                      <h3 className="font-display text-lg font-bold text-ink transition-colors group-hover:text-primary line-clamp-2">
                        {work.title}
                      </h3>

                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 font-medium text-ink/80">
                          <User size={12} className="text-secondary" />
                          {work.student_name}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDate(work.created_at)}
                        </span>
                      </div>

                      {work.description && (
                        <p className="mt-3 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                          {work.description}
                        </p>
                      )}

                      {!work.description && work.content && (
                        <p className="mt-3 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                          {work.content}
                        </p>
                      )}

                      {work.file_name && (
                        <div className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-sand/50 px-2 py-1 text-[11px] font-medium text-ink/70">
                          <FileText size={12} className="text-primary" />
                          <span className="truncate max-w-[180px]">{work.file_name}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Link */}
                    <div className="mt-5 pt-3 border-t border-sand-dark/30 flex items-center justify-between text-xs font-semibold text-ink group-hover:text-primary">
                      <span>Read Publication</span>
                      <ArrowUpRight
                        size={15}
                        className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RESPONSIVE POPUP / MODAL */}
      <Dialog open={Boolean(activeWork)} onOpenChange={(open) => !open && setActiveWork(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto border-ink/10 bg-white text-ink p-6 sm:p-8">
          {activeWork && (
            <>
              <DialogHeader className="space-y-3 text-left">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-secondary px-3 py-0.5 text-xs font-semibold text-secondary-foreground">
                    {activeWork.work_type}
                  </span>
                  <span className="rounded-full border border-ink/20 bg-sand px-3 py-0.5 text-xs font-bold text-ink">
                    Batch {activeWork.batch}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                    <Calendar size={13} />
                    {formatDate(activeWork.created_at)}
                  </span>
                </div>

                {/* Title */}
                <DialogTitle className="font-display text-2xl sm:text-3xl font-bold leading-snug text-ink">
                  {activeWork.title}
                </DialogTitle>

                {/* Author Info */}
                <DialogDescription className="text-sm text-ink/80 flex items-center gap-2 pt-1">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sand text-ink">
                    <User size={14} />
                  </span>
                  <span>
                    Authored by{" "}
                    <strong className="text-ink font-semibold">{activeWork.student_name}</strong>{" "}
                    (Darusuffa Academy Batch {activeWork.batch})
                  </span>
                </DialogDescription>
              </DialogHeader>

              {/* Body Content */}
              <div className="mt-6 space-y-6">
                {/* Description Excerpt */}
                {activeWork.description && (
                  <div className="rounded-xl border border-sand-dark/40 bg-sand/40 p-4 text-sm italic text-ink/90 leading-relaxed">
                    {activeWork.description}
                  </div>
                )}

                {/* Media Image */}
                {activeWork.media_url && (
                  <div className="overflow-hidden rounded-2xl border border-ink/10 bg-black/5 shadow-xs">
                    <img
                      src={activeWork.media_url}
                      alt={activeWork.title}
                      className="max-h-[480px] w-full object-contain"
                    />
                  </div>
                )}

                {/* Full Written Content */}
                {activeWork.content && (
                  <div className="rounded-2xl border border-sand-dark/30 bg-white p-5 sm:p-6 text-base leading-relaxed text-ink/90 font-manjari whitespace-pre-wrap selection:bg-primary/20">
                    {activeWork.content}
                  </div>
                )}

                {/* File Attachment */}
                {activeWork.file_url && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-ink/15 bg-sand/50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-primary shadow-xs">
                        <FileText size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-ink">
                          {activeWork.file_name || "Downloadable Document"}
                        </div>
                        <div className="text-xs text-muted-foreground">Original attachment</div>
                      </div>
                    </div>
                    <a
                      href={activeWork.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white transition hover:bg-ink/80 shadow-xs"
                    >
                      <Download size={14} />
                      <span>Download File</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Dialog Footer */}
              <DialogFooter className="mt-8 pt-4 border-t border-sand-dark/30 flex items-center justify-between sm:justify-between">
                <div className="text-xs text-muted-foreground">
                  Published with faculty editorial approval.
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveWork(null)}
                  className="rounded-full px-5 text-xs font-medium"
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
