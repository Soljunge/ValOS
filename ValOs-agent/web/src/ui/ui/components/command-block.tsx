import { Button } from "./button";

export function CommandBlock({
  command,
  code,
  label,
  className,
}: {
  command?: string;
  code?: string;
  label?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      {label && <div className="mb-1 text-xs text-text-tertiary">{label}</div>}
      <pre className="overflow-auto border border-current/20 p-3 text-xs">{command ?? code}</pre>
    </div>
  );
}

export function CopyButton({
  text,
  className,
  label,
}: {
  text: string;
  className?: string;
  label?: string;
  copiedLabel?: string;
}) {
  return (
    <Button
      className={className}
      size="sm"
      onClick={() => navigator.clipboard?.writeText(text).catch(() => undefined)}
    >
      {label ?? "Copy"}
    </Button>
  );
}
