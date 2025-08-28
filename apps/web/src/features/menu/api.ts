export type MenuItem = { item_id: number; name: string; price: number; img?: string };

export async function fetchMenu(): Promise<MenuItem[]> {
  const base = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4000';
  const res = await fetch(`${base}/api/menu`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch /api/menu');
  return res.json();
}
