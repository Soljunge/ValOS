import * as React from "react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

type ConfirmDialogProps = {
  open?: boolean;
  title?: React.ReactNode;
  description?: React.ReactNode;
  confirmLabel?: React.ReactNode;
  cancelLabel?: React.ReactNode;
  confirmText?: React.ReactNode;
  cancelText?: React.ReactNode;
  destructive?: boolean;
  loading?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  onOpenChange?: (open: boolean) => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  confirmText,
  cancelText,
  destructive,
  onConfirm,
  onCancel,
  onOpenChange,
}: ConfirmDialogProps) {
  if (!open) return null;
  const close = () => {
    onCancel?.();
    onOpenChange?.(false);
  };
  return (
    <div className="fixed inset-0 z-[300] grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-md border border-current/20 bg-background-base p-5 shadow-xl">
        <h2 className="text-lg font-semibold text-midground">{title}</h2>
        {description && <div className="mt-2 text-sm text-text-secondary">{description}</div>}
        <div className="mt-5 flex justify-end gap-2">
          <Button ghost onClick={close}>{cancelLabel ?? cancelText ?? "Cancel"}</Button>
          <Button
            className={cn(destructive && "border-destructive/40 text-destructive")}
            onClick={() => {
              onConfirm?.();
              onOpenChange?.(false);
            }}
          >
            {confirmLabel ?? confirmText ?? "Confirm"}
          </Button>
        </div>
      </div>
    </div>
  );
}
