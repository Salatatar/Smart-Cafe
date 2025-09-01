'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getOrder, type Order } from '@/features/order/api';
import { subscribeOrders } from '@/features/order/sse';

type Props = { id: number };

// อีเวนต์จาก SSE ให้ตรงกับที่ barista ใช้งาน
type OrderSSEEvent =
  | {
      type: 'order_created';
      order_id: number;
      total_price?: number;
      items?: Array<{ item_id: number; name?: string; qty: number }>;
      created_at?: string;
      completed_at?: string | number | null;
    }
  | {
      type: 'order_updated';
      order_id: number;
      status?: Order['status'];
      completed_at?: string | number | null;
      total_price?: number;
      items?: Array<{ item_id: number; name?: string; qty: number }>;
    };

export default function OrderStatus({ id }: Props) {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<Order>({
    queryKey: ['order', id],
    queryFn: () => getOrder(id),
    refetchOnWindowFocus: false,
    staleTime: 5_000,
  });

  // ฟัง SSE แล้ว refresh เฉพาะคำสั่งซื้อที่มี id ตรงกัน
  useEffect(() => {
    const unsub = subscribeOrders((ev: OrderSSEEvent | unknown) => {
      // ป้องกันกรณีข้อมูลไม่ใช่ object
      if (!ev || typeof ev !== 'object') return;
      const e = ev as Partial<OrderSSEEvent>;
      if (e.type !== 'order_created' && e.type !== 'order_updated') return;

      const evId = typeof e.order_id === 'number' ? e.order_id : Number(e.order_id);
      if (!Number.isFinite(evId)) return;

      if (evId === id) {
        // ถ้าเป็นออเดอร์นี้ ให้รีเฟรชข้อมูล
        qc.invalidateQueries({ queryKey: ['order', id] });
      }
    });

    return () => unsub();
  }, [id, qc]);

  // สถานะและข้อความ
  const label = (s?: Order['status']) =>
    s === 'preparing'
      ? 'กำลังเตรียม'
      : s === 'ready'
        ? 'พร้อมรับแล้ว'
        : s === 'completed'
          ? 'รับเรียบร้อย'
          : s === 'cancelled'
            ? 'ยกเลิก'
            : '—';

  // progress 2 ขั้น: preparing -> ready (completed ถือว่า 100%)
  const progress = (s?: Order['status']) =>
    s === 'preparing' ? 50 : s === 'ready' ? 100 : s === 'completed' ? 100 : 0;

  // แปลง completed_at ให้โชว์ถูกกรณีเป็น ms/s หรือ ISO
  const completedAt = (() => {
    if (!data) return null;
    const raw = (data as any).completed_at as string | number | null | undefined;
    if (raw === null || raw === undefined) return null;
    if (typeof raw === 'number') {
      const ms = String(raw).length === 10 ? raw * 1000 : raw;
      return new Date(ms);
    }
    return new Date(raw);
  })();

  return (
    <section className="mt-6">
      {/* Card สถานะ */}
      <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm text-stone-600">สถานะปัจจุบัน</div>
            <div className="mt-0.5 inline-flex items-center gap-2 rounded-full border border-stone-200 px-3 py-1 text-sm font-medium">
              <span
                className={
                  'inline-block h-2.5 w-2.5 rounded-full ' +
                  (data?.status === 'preparing'
                    ? 'bg-amber-500 animate-pulse'
                    : data?.status === 'ready'
                      ? 'bg-green-600'
                      : data?.status === 'completed'
                        ? 'bg-stone-700'
                        : 'bg-stone-400')
                }
                aria-hidden
              />
              <span className="text-stone-900">{label(data?.status)}</span>
            </div>

            <div className="mt-2 text-xs text-stone-500">
              Order #{id}
              {data?.created_at
                ? ` • สร้างเมื่อ ${new Date((data as any).created_at).toLocaleString()}`
                : ''}
            </div>
          </div>

          {/* completed time */}
          {completedAt && (
            <div className="text-right text-xs text-stone-500">
              เสร็จเมื่อ
              <div className="font-medium text-stone-800">{completedAt.toLocaleString()}</div>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-stone-100">
          <div
            className="h-full rounded-full bg-amber-600 transition-all"
            style={{ width: `${progress(data?.status)}%` }}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress(data?.status)}
            role="progressbar"
          />
        </div>

        {/* ขั้นตอนสั้น ๆ */}
        <div className="mt-2 flex justify-between text-xs text-stone-500">
          <span className={data?.status ? 'text-stone-700' : ''}>รับออเดอร์</span>
          <span className={data?.status === 'ready' ? 'text-stone-700' : ''}>พร้อมรับ</span>
        </div>

        {/* Loading เบา ๆ */}
        {isLoading && <div className="mt-3 text-xs text-stone-500">กำลังอัปเดตสถานะ…</div>}
      </div>
    </section>
  );
}
