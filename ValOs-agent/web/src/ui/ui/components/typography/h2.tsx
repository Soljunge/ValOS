import * as React from "react";
import { cn } from "@/lib/utils";

export function H2({
  className,
  variant,
  mondwest,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & { variant?: string; mondwest?: boolean }) {
  return <h2 className={cn("text-xl font-semibold text-midground", className)} {...props} />;
}
