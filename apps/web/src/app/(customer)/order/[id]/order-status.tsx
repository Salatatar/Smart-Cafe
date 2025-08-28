'use client';
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getOrder, type Order } from '@/features/order/api';
import { subscribeOrders } from '@/features/order/sse';

type Props = { id: number };

export default function OrderStatus({ id }: Props) {
  const qc = useQueryClient();
  const { data } = useQuery<Order>({
    queryKey: ['order', id],
    queryFn: () => getOrder(id),
    refetchOnWindowFocus: false,
    staleTime: 5_000,
  });

  useEffect(() => {
    const unsub = subscribeOrders((ev) => {
      if (ev.type === 'order_updated' && ev.order.order_id === id) {
        qc.invalidateQueries({ queryKey: ['order', id] });
      }
    });
    return () => unsub();
  }, [id, qc]);

  if (!data) return <div className="mt-4">กำลังโหลด...</div>;

  return (
    <div className="mt-4 rounded-2xl border bg-white p-4">
      <div className="text-gray-600">สถานะปัจจุบัน:</div>
      <div className="text-xl font-semibold">
        {data.status === 'preparing' ? 'กำลังเตรียม' : 'พร้อมรับแล้ว'}
      </div>
      {data.completed_at && (
        <div className="mt-2 text-sm text-gray-600">
          เสร็จเมื่อ: {new Date(data.completed_at).toLocaleString()}
        </div>
      )}
    </div>
  );
}
