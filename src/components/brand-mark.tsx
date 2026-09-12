import { cn } from "@/lib/utils";

// The app's brand mark: an indigo squircle with a bold white "b", matching
// the favicon/app-icon. Shared between the in-app nav and the marketing
// site so the logo stays visually consistent everywhere.
export function BrandMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg bg-primary",
        className
      )}
    >
      <span className="text-base font-bold leading-none text-primary-foreground">b</span>
    </span>
  );
}
