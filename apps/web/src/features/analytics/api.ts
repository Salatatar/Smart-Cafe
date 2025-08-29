export type SalesRow = { date: string; orders: number; revenue: number };
export type TopMenuRow = { item_id: number; name: string; qty: number; revenue: number };
export type PeakHourRow = { hour: number; orders: number; revenue: number };

const base = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4000';

export async function getSales(from?: string, to?: string): Promise<SalesRow[]> {
  const u = new URL(base + '/api/analytics/sales');
  if (from) u.searchParams.set('from', from);
  if (to) u.searchParams.set('to', to);
  const res = await fetch(u, { cache: 'no-store' });
  if (!res.ok) throw new Error('fetch sales failed');
  return res.json();
}

export async function getTopMenu(from?: string, to?: string, limit = 10): Promise<TopMenuRow[]> {
  const u = new URL(base + '/api/analytics/top-menu');
  if (from) u.searchParams.set('from', from);
  if (to) u.searchParams.set('to', to);
  u.searchParams.set('limit', String(limit));
  const res = await fetch(u, { cache: 'no-store' });
  if (!res.ok) throw new Error('fetch top-menu failed');
  return res.json();
}

export async function getPeakHours(from?: string, to?: string) {
  const url = new URL('/api/analytics/peak-hours', location.origin);
  if (from) url.searchParams.set('from', from);
  if (to) url.searchParams.set('to', to);

  const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('Failed to fetch peak hours');
  const json = await res.json();
  // รองรับทั้ง {hours: []}, {data: []}, หรือ [] ตรง ๆ
  return Array.isArray(json) ? json : (json.hours ?? json.data ?? []);
}
