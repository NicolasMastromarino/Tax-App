import "server-only";
import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import { defaultLocale, isLocale, type Locale } from "./locales";
import { en, type Dictionary } from "./dictionaries/en";
import { es } from "./dictionaries/es";

export type { Dictionary };

const dictionaries: Record<Locale, Dictionary> = { en, es };

/** Reads the current locale from the root `[lang]` segment. */
export async function getLocale(): Promise<Locale> {
  const locale = await lang();
  return locale && isLocale(locale) ? locale : defaultLocale;
}

/** Reads the current locale from the root `[lang]` segment and returns its dictionary. */
export async function getDictionary(): Promise<Dictionary> {
  const locale = await lang();
  if (!locale || !isLocale(locale)) notFound();
  return dictionaries[locale];
}
