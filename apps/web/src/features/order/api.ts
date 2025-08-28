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
