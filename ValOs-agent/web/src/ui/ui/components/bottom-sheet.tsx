import * as React from "react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

type BottomSheetProps = {
  open?: boolean;
  onClose?: () => void;
  title?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  backdropDismissLabel?: string;
};

export function BottomSheet({ open, onClose, title, children, className, backdropDismissLabel }: BottomSheetProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[300] flex items-end bg-black/60 sm:items-center sm:justify-center">
      <button
        aria-label={backdropDismissLabel ?? "Close"}
        className="absolute inset-0"
        type="button"
        onClick={onClose}
      />
      <div className={cn("relative w-full border border-current/20 bg-background-base p-4 sm:max-w-lg", className)}>
        <div className="mb-3 flex items-center justify-between gap-3">
          {title && <h2 className="text-sm font-semibold text-midground">{title}</h2>}
          <Button ghost size="sm" onClick={onClose}>Close</Button>
        </div>
        {children}
      </div>
    </div>
  );
}
