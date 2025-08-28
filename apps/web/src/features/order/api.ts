export type CreateOrderPayload = {
  items: { item_id: number; qty: number; toppings?: number[] }[];
  total_price: number;
};

export async function createOrder(payload: CreateOrderPayload): Promise<{ order_id: number }> {
  const base = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4000';
  const res = await fetch(`${base}/api/order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create order');
  return res.json();
}

export type Order = {
  order_id: number;
  items: { item_id: number; qty: number; toppings?: number[] }[];
  total_price: number;
  status: 'preparing' | 'ready';
  created_at: string;
  completed_at: string | null;
};

export async function getOrder(id: number): Promise<Order> {
  const base = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4000';
  const res = await fetch(`${base}/api/order/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Order not found');
  return res.json();
}

export async function getOrders(status?: 'preparing' | 'ready') {
  const base = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4000';
  const u = new URL(`${base}/api/orders`);
  if (status) u.searchParams.set('status', status);
  const res = await fetch(u.toString(), { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json() as Promise<Order[]>;
}

export async function updateOrder(order_id: number, status: 'preparing' | 'ready') {
  const base = process.env.NEXT_PUBLIC_API_BASE ?? ''; // ใช้ rewrites เพื่อตัด CORS
  const url = `${base}/api/order/update`;

  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      id: String(order_id), // ⟵ ให้เป็นสตริงตัวเลข (ผ่าน regex /^\d+$/)
      order_id, // ⟵ ให้เป็น number ตามที่อีก validator ต้องการ
      status, // 'preparing' | 'ready'
    }),
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Update failed ${res.status}: ${text}`);
  }
  return res.json();
}
