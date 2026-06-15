import { cn } from "@/lib/utils";

export type ToastState = {
  type?: "success" | "error" | "info" | string;
  message?: string;
} | null;

export function Toast({ toast }: { toast: ToastState }) {
  if (!toast?.message) return null;
  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-[400] max-w-sm border border-current/20 bg-background-base px-4 py-3 text-sm shadow-xl",
        toast.type === "error" && "text-destructive",
        toast.type === "success" && "text-success",
      )}
      role="status"
    >
      {toast.message}
    </div>
  );
}
