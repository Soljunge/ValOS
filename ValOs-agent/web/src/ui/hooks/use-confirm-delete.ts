import { useCallback, useState } from "react";

export function useConfirmDelete<T = any>({
  onConfirm,
  onDelete,
}: {
  onConfirm?: (payload: T) => void | Promise<void>;
  onDelete?: (payload: T) => void | Promise<void>;
} = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [payload, setPayload] = useState<T | undefined>(undefined);

  const open = useCallback((nextPayload?: T) => {
    setPayload(nextPayload);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const confirm = useCallback(async () => {
    setIsDeleting(true);
    try {
      await (onDelete ?? onConfirm)?.(payload as T);
      setIsOpen(false);
    } finally {
      setIsDeleting(false);
    }
  }, [onConfirm, onDelete, payload]);

  return {
    isOpen,
    isDeleting,
    open,
    close,
    cancel: close,
    confirm,
    requestDelete: open,
    payload,
    pendingId: payload,
    onOpenChange: setIsOpen,
  };
}
