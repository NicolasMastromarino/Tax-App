import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string): string {
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(n)) return "$0.00";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export function formatCurrencyCompact(value: number | string): string {
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(n)) return "$0";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function formatMonthYear(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function firstOfMonthISO(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

/** Returns the ISO date one calendar day after the given ISO date (UTC-safe). */
export function nextDayISO(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
