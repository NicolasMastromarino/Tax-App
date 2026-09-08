import { cn } from "@/lib/utils";

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "primary";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-surface-muted text-foreground",
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  danger: "bg-danger-bg text-danger",
  info: "bg-info-bg text-info",
  primary: "bg-primary/10 text-primary",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}
