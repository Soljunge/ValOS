import { useCallback, useState } from "react";
import type { ToastState } from "@/ui/ui/components/toast";

export function useToast() {
  const [toast, setToast] = useState<ToastState>(null);
  const showToast = useCallback((next: NonNullable<ToastState> | string, type?: string) => {
    const toastState = typeof next === "string" ? { message: next, type } : next;
    setToast(toastState);
    window.setTimeout(() => setToast(null), 4000);
  }, []);
  return { toast, showToast, setToast };
}
