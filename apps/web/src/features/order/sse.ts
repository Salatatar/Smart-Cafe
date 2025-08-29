export type OrderItem = {
  item_id: number;
  qty: number;
  toppings?: number[];
  name?: string;
};

export type OrderCreatedEvent = {
  type: 'order_created';
  order_id: number;
  status: 'preparing';
  total_price: number;
  items: OrderItem[];
  created_at: string; // ISO
  completed_at: string | null;
};

export type OrderUpdatedEvent = {
  type: 'order_updated';
  order_id: number;
  status: 'preparing' | 'ready';
  completed_at: string | null;
  total_price?: number;
  items?: OrderItem[];
};

export type OrderEvent = OrderCreatedEvent | OrderUpdatedEvent;

export function subscribeOrders(handler: (ev: OrderEvent) => void) {
  const es = new EventSource('/api/orders/stream');

  es.addEventListener('order_created', (e) => {
    const data = JSON.parse((e as MessageEvent).data);
    handler({ type: 'order_created', ...data });
  });

  es.addEventListener('order_updated', (e) => {
    const data = JSON.parse((e as MessageEvent).data);
    handler({ type: 'order_updated', ...data });
  });

  return () => es.close();
}
