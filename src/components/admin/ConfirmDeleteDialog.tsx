import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  itemName?: string;
  onConfirm: () => void | Promise<void>;
  isDeleting?: boolean;
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title = "Confirm Deletion",
  description,
  itemName,
  onConfirm,
  isDeleting = false,
}: ConfirmDeleteDialogProps) {
  const defaultDescription = itemName
    ? `Are you sure you want to permanently delete "${itemName}"? This action cannot be undone.`
    : "Are you sure you want to permanently delete this item? This action cannot be undone.";

  return (
    <AlertDialog open={open} onOpenChange={isDeleting ? () => {} : onOpenChange}>
      <AlertDialogContent className="max-w-md rounded-2xl p-6 sm:rounded-2xl border-border bg-background shadow-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-lg text-foreground">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
            {description || defaultDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4 gap-2 sm:gap-2">
          <AlertDialogCancel
            disabled={isDeleting}
            className="rounded-full border-border text-foreground hover:bg-secondary"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isDeleting}
            onClick={(e) => {
              e.preventDefault();
              void onConfirm();
            }}
            className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
          >
            {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{isDeleting ? "Deleting..." : "Delete"}</span>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
