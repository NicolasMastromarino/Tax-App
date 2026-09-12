"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
  hint?: string;
  keywords?: string;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select...",
  name,
  disabled,
}: {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  name?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    // Rank matches so an exact/prefix/substring hit on the option's own
    // name always outranks a match that only hits its keywords/hint text.
    // Without this, a category whose *description* happens to mention the
    // search term (e.g. "...not contract labor") could outrank the actual
    // "Contract Labor" category, silently steering a user to the wrong one.
    return options
      .map((o, index) => {
        const label = o.label.toLowerCase();
        let rank: number;
        if (label === q) rank = 0;
        else if (label.startsWith(q)) rank = 1;
        else if (label.includes(q)) rank = 2;
        else if (o.keywords?.toLowerCase().includes(q) || o.hint?.toLowerCase().includes(q)) rank = 3;
        else rank = -1;
        return { option: o, rank, index };
      })
      .filter((entry) => entry.rank !== -1)
      .sort((a, b) => a.rank - b.rank || a.index - b.index)
      .map((entry) => entry.option);
  }, [options, query]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      {name && <input type="hidden" name={name} value={value} />}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-lg border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50",
          !selected && "text-muted"
        )}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-4 w-4 text-muted" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="w-full text-sm outline-none"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-sm text-muted">No matches</p>
            )}
            {filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                  setQuery("");
                }}
                className={cn(
                  "flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-surface-muted",
                  o.value === value && "bg-primary/5"
                )}
              >
                <span className="font-medium">{o.label}</span>
                {o.hint && <span className="text-xs text-muted">{o.hint}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
