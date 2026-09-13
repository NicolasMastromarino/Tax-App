import type { Dictionary } from "./dictionaries/en";

/**
 * Looks up a server-generated message (Zod validation issue, server action
 * error) in the current locale's exact-string table. Falls back to the
 * original English string when there's no entry, so an untranslated
 * message degrades gracefully instead of disappearing.
 */
export function translateMessage(dict: Dictionary, message: string | undefined): string | undefined {
  if (!message) return message;
  return dict.validationMessages[message as keyof Dictionary["validationMessages"]] ?? message;
}
