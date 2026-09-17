import type { ReactNode } from "react";

export function PageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl">{title}</h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function Panel({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-border bg-background p-6 shadow-[var(--shadow-soft)] ${className}`}
    >
      {title && <h2 className="mb-4 font-display text-lg">{title}</h2>}
      {children}
    </section>
  );
}

export function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl text-primary">{value}</p>
    </div>
  );
}

export function StatusPill({ published }: { published: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs ${
        published ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
      }`}
    >
      {published ? "Published" : "Draft"}
    </span>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}
