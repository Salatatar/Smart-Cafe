// const API_BASE = (process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4000').replace(/\/$/, '');

export type MenuItem = {
  id: number;
  name: string;
  price: number;
  is_available: boolean;
};

type ApiListResponse<T> = { data: T[] };

// export async function fetchMenu(): Promise<MenuItem[]> {
//   const res = await fetch(`${API_BASE}/api/menu`, { cache: 'no-store' });
//   if (!res.ok) throw new Error('Failed to fetch menu');
//   const json = await res.json();
//   const items = Array.isArray(json.items) ? json.items : [];
//   return items.map((it: any) => ({
//     item_id: it.id,
//     name: it.name,
//     price: it.price,
//   }));
// }
export async function fetchMenu(): Promise<MenuItem[]> {
  const res = await fetch('/api/menu');
  if (!res.ok) throw new Error('Failed to fetch menu');
  // ถ้า backend คืนเป็นอาร์เรย์
  const body = (await res.json()) as MenuItem[] | ApiListResponse<MenuItem>;
  return Array.isArray(body) ? body : body.data;
}
