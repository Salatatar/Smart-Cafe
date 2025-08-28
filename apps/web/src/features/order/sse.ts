export type SSEPayload =
  | { type: 'hello' }
  | { type: 'order_created'; order: { order_id: number; status: 'preparing' | 'ready' } }
  | { type: 'order_updated'; order: { order_id: number; status: 'preparing' | 'ready' } };

export function subscribeOrders(cb: (data: SSEPayload) => void): () => void {
  const base = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4000';
  const ev = new EventSource(`${base}/api/orders/stream`);
  ev.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data) as SSEPayload;
      cb(data);
    } catch {
      // intentionally empty – error handled by upstream retry/backoff
    }
  };
  ev.onerror = (err) => {
    // intentionally log; browser will auto-retry SSE
    if (process.env.NODE_ENV !== 'production') console.debug('SSE error', err);
  };
  return () => ev.close();
}
