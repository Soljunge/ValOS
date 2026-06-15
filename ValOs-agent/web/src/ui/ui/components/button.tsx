import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "title" | "prefix" | "suffix"> & {
  ghost?: boolean;
  active?: boolean;
  outlined?: boolean;
  destructive?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  title?: React.ReactNode;
  size?: "icon" | "sm" | "default" | string;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ghost, active, outlined, destructive, prefix, suffix, size, type = "button", title, children, ...props }, ref) => (
    <button
      ref={ref}
      title={typeof title === "string" ? title : undefined}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 border border-current/20 px-3 py-2 text-sm transition-colors",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-midground disabled:pointer-events-none disabled:opacity-50",
        ghost || outlined ? "bg-transparent hover:bg-current/10" : "bg-midground/10 hover:bg-midground/20",
        active && "bg-midground/20 text-midground",
        destructive && "border-destructive/40 text-destructive",
        size === "icon" && "h-9 w-9 p-0",
        size === "sm" && "px-2 py-1 text-xs",
        className,
      )}
      {...props}
    >
      {prefix}
      {children}
      {suffix}
    </button>
  ),
);
Button.displayName = "Button";
