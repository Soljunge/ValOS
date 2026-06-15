import * as React from "react";
import { cn } from "@/lib/utils";

export function Typography({
  className,
  mondwest,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { mondwest?: boolean }) {
  return (
    <span
      className={cn(mondwest && "font-mondwest text-display", className)}
      {...props}
    />
  );
}
