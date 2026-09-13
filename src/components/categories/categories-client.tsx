"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { CategoryRow } from "@/lib/data/categories";
import { useLocale } from "@/i18n/use-locale";
import { en as en_ } from "@/i18n/dictionaries/en";
import { es as es_ } from "@/i18n/dictionaries/es";

const DICTIONARIES = { en: en_, es: es_ };

export function CategoriesClient({ categories }: { categories: CategoryRow[] }) {
  const [query, setQuery] = useState("");
  const locale = useLocale();
  const t = DICTIONARIES[locale].categories;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.taxGuidance?.toLowerCase().includes(q) ||
        c.keywords?.toLowerCase().includes(q)
    );
  }, [categories, query]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="mt-1 text-sm text-muted">{t.subtitle}</p>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted">{t.noMatches.replace("{query}", query)}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((c) => (
            <Card key={c.id}>
              <CardContent className="pt-5">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <h3 className="font-semibold">{c.name}</h3>
                  <Badge tone={c.type === "income" ? "success" : "neutral"}>
                    {t.types[c.type as keyof typeof t.types]}
                  </Badge>
                </div>
                {c.description && <p className="text-sm text-muted">{c.description}</p>}
                {c.taxGuidance && (
                  <p className="mt-2 rounded-lg bg-info-bg p-2.5 text-xs text-info">{c.taxGuidance}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
