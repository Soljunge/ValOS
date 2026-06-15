import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type FilterGroupItem = {
  label?: string;
  value: string;
};

type SegmentedProps = {
  value?: string;
  groups?: FilterGroupItem[];
  options?: FilterGroupItem[];
  onChange?: (value: any) => void;
  onValueChange?: (value: any) => void;
  className?: string;
  size?: string;
};

export function FilterGroup({
  children,
  className,
  label,
}: {
  children?: ReactNode;
  className?: string;
  label?: ReactNode;
}) {
  return (
    <div className={cn("inline-flex flex-col gap-1", className)}>
      {label && <span className="text-xs text-text-tertiary">{label}</span>}
      {children}
    </div>
  );
}

export function Segmented({ value, groups, options, onChange, onValueChange, className }: SegmentedProps) {
  const items = groups ?? options ?? [];
  return (
    <div className={cn("inline-flex border border-current/20", className)}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            className={cn("px-3 py-1 text-xs", active ? "bg-midground/20 text-midground" : "hover:bg-current/10")}
            onClick={() => {
              onChange?.(item.value);
              onValueChange?.(item.value);
            }}
          >
            {item.label ?? item.value}
          </button>
        );
      })}
    </div>
  );
}
