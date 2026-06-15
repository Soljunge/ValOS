import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 border border-current/20 px-2 py-0.5 text-xs",
        tone === "success" && "text-success",
        (tone === "destructive" || tone === "danger") && "text-destructive",
        tone === "warning" && "text-warning",
        className,
      )}
      {...props}
    />
  );
}
