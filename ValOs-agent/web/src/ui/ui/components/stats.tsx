import * as React from "react";
import { cn } from "@/lib/utils";

type StatsProps = React.HTMLAttributes<HTMLDivElement> & {
  label?: React.ReactNode;
  value?: React.ReactNode;
  items?: Array<{ label: React.ReactNode; value: React.ReactNode }>;
};

export function Stats({ label, value, items, className, children, ...props }: StatsProps) {
  return (
    <div className={cn("border border-current/20 p-3", className)} {...props}>
      {items?.map((item, index) => (
        <div key={index} className="mb-2 last:mb-0">
          <div className="text-xs text-text-tertiary">{item.label}</div>
          <div className="text-lg font-semibold text-midground">{item.value}</div>
        </div>
      ))}
      {label && <div className="text-xs text-text-tertiary">{label}</div>}
      {value && <div className="text-lg font-semibold text-midground">{value}</div>}
      {children}
    </div>
  );
}
