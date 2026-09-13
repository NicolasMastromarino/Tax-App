"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Select, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { getMonthNames } from "@/lib/utils";
import type { CategoryRow } from "@/lib/data/categories";
import { useLocale } from "@/i18n/use-locale";
import { en as en_ } from "@/i18n/dictionaries/en";
import { es as es_ } from "@/i18n/dictionaries/es";

const DICTIONARIES = { en: en_, es: es_ };

export function FilterBar({
  categories,
  year,
  month,
  filters,
}: {
  categories: CategoryRow[];
  year: number;
  month?: number;
  filters: {
    categoryId?: string;
    type?: string;
    search?: string;
    sortBy?: string;
    sortDir?: string;
  };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(filters.search ?? "");
  const locale = useLocale();
  const t = DICTIONARIES[locale].transactions;
  const monthNames = getMonthNames(locale);

  function updateParams(patch: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    params.set("year", String(year));
    if (month) params.set("month", String(month));
    else params.set("all", "1");
    if (filters.categoryId) params.set("categoryId", filters.categoryId);
    if (filters.type) params.set("type", filters.type);
    if (filters.search) params.set("search", filters.search);
    if (filters.sortBy) params.set("sortBy", filters.sortBy);
    if (filters.sortDir) params.set("sortDir", filters.sortDir);

    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || value === "") params.delete(key);
      else params.set(key, value);
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function changeMonth(newMonth: string) {
    if (newMonth === "all") {
      updateParams({ all: "1", month: undefined });
    } else {
      updateParams({ all: undefined, month: newMonth });
    }
  }

  const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 4 + i);

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">{t.filterBar.period}</label>
        <div className="flex gap-2">
          <Select value={String(year)} onChange={(e) => updateParams({ year: e.target.value })} className="w-24">
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
          <Select value={month ? String(month) : "all"} onChange={(e) => changeMonth(e.target.value)} className="w-36">
            <option value="all">{t.filterBar.allMonths}</option>
            {monthNames.map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted">{t.filterBar.category}</label>
        <Select
          value={filters.categoryId ?? ""}
          onChange={(e) => updateParams({ categoryId: e.target.value })}
          className="w-44"
        >
          <option value="">{t.filterBar.allCategories}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted">{t.filterBar.type}</label>
        <Select value={filters.type ?? ""} onChange={(e) => updateParams({ type: e.target.value })} className="w-40">
          <option value="">{t.filterBar.allTypes}</option>
          <option value="income">{t.types.income}</option>
          <option value="expense">{t.types.expense}</option>
          <option value="owner_contribution">{t.types.owner_contribution}</option>
          <option value="owner_distribution">{t.types.owner_distribution}</option>
        </Select>
      </div>

      <div className="min-w-48 flex-1">
        <label className="mb-1 block text-xs font-medium text-muted">{t.filterBar.search}</label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") updateParams({ search });
            }}
            onBlur={() => updateParams({ search })}
            placeholder={t.filterBar.searchPlaceholder}
            className="pl-8"
          />
        </div>
      </div>

      {(filters.categoryId || filters.type || filters.search) && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setSearch("");
            updateParams({ categoryId: undefined, type: undefined, search: undefined });
          }}
        >
          <X className="h-3.5 w-3.5" />
          {t.filterBar.clearFilters}
        </Button>
      )}
    </div>
  );
}
