import { cn } from "@/lib/utils";

// The app's brand mark: an indigo squircle with a bold white "b", matching
// the favicon/app-icon. Shared everywhere the logo appears — the in-app
// nav, the marketing site header/footer, and the auth pages — so it stays
// visually consistent across the whole app.
export function BrandMark({
  className = "h-8 w-8",
  letterClassName = "text-base",
}: {
  className?: string;
  letterClassName?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg bg-primary",
        className
      )}
    >
      <span className={cn("font-bold leading-none text-primary-foreground", letterClassName)}>
        b
      </span>
    </span>
  );
}
