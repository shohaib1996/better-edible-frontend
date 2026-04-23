export interface CsvRow {
  line: number;
  name: string;
  defaultAmount?: number;
}

export interface CsvError {
  line: number;
  message: string;
}

export interface ParseResult {
  rows: CsvRow[];
  errors: CsvError[];
}

export function parseCsv(text: string): ParseResult {
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  const rows: CsvRow[] = [];
  const errors: CsvError[] = [];

  const startIndex =
    lines[0]?.toLowerCase().includes("name") ||
    lines[0]?.toLowerCase().includes("flavor")
      ? 1
      : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw) continue;

    const cols = raw.split(",").map((c) => c.trim());
    const lineNum = i + 1;

    if (cols.length > 2) {
      errors.push({ line: lineNum, message: `Too many columns (expected 1 or 2, got ${cols.length})` });
      continue;
    }

    const name = cols[0];
    if (!name) {
      errors.push({ line: lineNum, message: "Flavor name is empty" });
      continue;
    }
    if (name.length > 60) {
      errors.push({ line: lineNum, message: `Name too long (max 60 chars): "${name}"` });
      continue;
    }

    let defaultAmount: number | undefined;
    if (cols[1] !== undefined && cols[1] !== "") {
      const parsed = Number(cols[1]);
      if (isNaN(parsed) || parsed < 0) {
        errors.push({ line: lineNum, message: `Invalid amount "${cols[1]}" — must be a positive number` });
        continue;
      }
      defaultAmount = parsed;
    }

    rows.push({ line: lineNum, name, defaultAmount });
  }

  return { rows, errors };
}
