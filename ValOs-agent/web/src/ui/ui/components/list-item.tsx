import * as React from "react";
import { cn } from "@/lib/utils";

type ListItemProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

export const ListItem = React.forwardRef<HTMLButtonElement, ListItemProps>(
  ({ className, active, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-current/10",
        active && "bg-midground/15 text-midground",
        className,
      )}
      {...props}
    />
  ),
);
ListItem.displayName = "ListItem";
