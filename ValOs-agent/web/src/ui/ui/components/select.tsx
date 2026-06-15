import * as React from "react";
import { cn } from "@/lib/utils";

type SelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange"> & {
  onValueChange?: (value: string) => void;
  placeholder?: string;
};

export function Select({ className, children, onValueChange, placeholder, ...props }: SelectProps) {
  return (
    <select
      className={cn("border border-current/20 bg-background-base/60 px-3 py-2 text-sm", className)}
      onChange={(event) => onValueChange?.(event.target.value)}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {children}
    </select>
  );
}

export function SelectOption(props: React.OptionHTMLAttributes<HTMLOptionElement>) {
  return <option {...props} />;
}
