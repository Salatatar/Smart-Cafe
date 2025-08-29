'use client';
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getOrder, type Order } from '@/features/order/api';
import { subscribeOrders } from '@/features/order/sse';

type Props = { id: number };

// ช่วยตรวจ typeof object
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

// อีเวนต์ที่เราต้องการจาก SSE
type OrderUpdatedEvent =
  | { type: 'order_updated'; data: { order_id: number } }
  | { type: 'order_updated'; data: { order: { order_id: number } } };

// type guard เพื่อเลี่ยง any
function isOrderUpdated(ev: unknown): ev is OrderUpdatedEvent {
  if (!isRecord(ev) || ev.type !== 'order_updated') return false;
  if (!('data' in ev) || !isRecord(ev.data)) return false;
  const d = ev.data as Record<string, unknown>;
  const hasDirect = typeof d.order_id === 'number';
  const hasNested =
    isRecord(d.order) && typeof (d.order as Record<string, unknown>).order_id === 'number';
  return hasDirect || hasNested;
}

export default function OrderStatus({ id }: Props) {
  const qc = useQueryClient();
  const { data } = useQuery<Order>({
    queryKey: ['order', id],
    queryFn: () => getOrder(id),
    refetchOnWindowFocus: false,
    staleTime: 5_000,
  });

  useEffect(() => {
    const unsub = subscribeOrders((ev: unknown) => {
      if (!isOrderUpdated(ev)) return;
      const updatedId =
        'order_id' in ev.data
          ? (ev.data as { order_id: number }).order_id
          : (ev.data as { order: { order_id: number } }).order.order_id;

      if (updatedId === id) {
        qc.invalidateQueries({ queryKey: ['order', id] });
      }
    });
    return () => unsub();
  }, [id, qc]);

  useEffect(() => {
    console.log('order data:', data);
  }, [data]);

  if (!data) return <div className="mt-4">กำลังโหลด...</div>;

  // อ่าน completed_at โดยไม่ใช้ any
  let completedRaw: string | number | null = null;
  if ('completed_at' in (data as Record<string, unknown>)) {
    completedRaw = (data as { completed_at?: string | number | null }).completed_at ?? null;
  }

  let completedDate: Date | null = null;
  if (completedRaw !== null && completedRaw !== '') {
    if (typeof completedRaw === 'number') {
      completedDate = new Date(
        String(completedRaw).length === 10 ? completedRaw * 1000 : completedRaw,
      );
    } else {
      completedDate = new Date(completedRaw);
    }
  }

  return (
    <div className="mt-4 rounded-2xl border bg-white p-4">
      <div className="text-gray-600">สถานะปัจจุบัน:</div>
      <div className="text-xl font-semibold">
        {data.status === 'preparing' ? 'กำลังเตรียม' : 'พร้อมรับแล้ว'}
      </div>
      {completedDate && (
        <div className="mt-2 text-sm text-gray-600">
          เสร็จเมื่อ: {completedDate.toLocaleString()}
        </div>
      )}
    </div>
  );
}
