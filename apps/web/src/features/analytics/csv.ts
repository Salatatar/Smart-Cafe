export function toCSV<T extends Record<string, unknown>>(rows: T[]): string {
  if (rows.length === 0) return '';

  const first = rows[0]!; // ยืนยันกับ TS ว่าไม่เป็น undefined แน่ ๆ หลังเช็ค length แล้ว
  const headers = Object.keys(first);

  const esc = (v: unknown): string => {
    if (v == null) return '';
    const s = String(v);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };

  const lines: string[] = [headers.join(',')];

  for (const r of rows) {
    lines.push(headers.map((h) => esc(r[h as keyof T])).join(','));
  }

  return lines.join('\n');
}

export function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
