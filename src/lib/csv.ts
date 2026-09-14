/**
 * Minimal CSV builder — no library needed for something this small. Quotes
 * a field whenever it contains a comma, quote, or newline, doubling any
 * embedded quotes per RFC 4180. Numbers are written as literal (unquoted)
 * decimals so a spreadsheet imports them as numbers, not text.
 */
export function toCSV<T extends Record<string, unknown>>(
  rows: T[],
  columns: { key: keyof T; header: string }[]
): string {
  function cell(value: unknown): string {
    if (value == null) return "";
    if (typeof value === "number") return value.toFixed(2);
    const s = String(value);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  const lines = [columns.map((c) => cell(c.header)).join(",")];
  for (const row of rows) {
    lines.push(columns.map((c) => cell(row[c.key])).join(","));
  }
  // CRLF is the RFC 4180 line ending and what Excel expects.
  return lines.join("\r\n") + "\r\n";
}
