'use client';
import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getOrders, updateOrder, type Order } from '@/features/order/api';
import { subscribeOrders } from '@/features/order/sse';

export default function BaristaQueue() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'preparing' | 'ready'>('preparing');

  const { data: preparing = [], isFetching: loadingPreparing } = useQuery<Order[]>({
    queryKey: ['orders', 'preparing'],
    queryFn: () => getOrders('preparing'),
    refetchOnWindowFocus: false,
  });

  const { data: ready = [], isFetching: loadingReady } = useQuery<Order[]>({
    queryKey: ['orders', 'ready'],
    queryFn: () => getOrders('ready'),
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const unsub = subscribeOrders((ev) => {
      if (ev.type === 'order_created' || ev.type === 'order_updated') {
        // invalidates ทั้งสองกลุ่ม เพื่อให้ข้อมูลใหม่เสมอ
        qc.invalidateQueries({ queryKey: ['orders', 'preparing'] });
        qc.invalidateQueries({ queryKey: ['orders', 'ready'] });
      }
    });
    return () => unsub();
  }, [qc]);

  const lists = useMemo(() => ({ preparing, ready }), [preparing, ready]);

  const markReady = async (orderId: number) => {
    await updateOrder(orderId, 'ready');
  };

  return (
    <div>
      <div className="mb-3 inline-flex rounded-xl border bg-white p-1">
        {(['preparing', 'ready'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm ${tab === t ? 'bg-black text-white' : 'text-gray-700'}`}
          >
            {t === 'preparing' ? 'คิวที่กำลังทำ' : 'เสร็จแล้ว'}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border bg-white">
        <table className="w-full table-fixed">
          <thead>
            <tr className="border-b text-left text-sm text-gray-600">
              <th className="p-3 w-24">Order</th>
              <th className="p-3">Items</th>
              <th className="p-3 w-28 text-right">Total</th>
              <th className="p-3 w-40 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {(lists[tab] ?? []).map((o) => (
              <tr key={o.order_id} className="border-b last:border-0">
                <td className="p-3 font-semibold">#{o.order_id}</td>
                <td className="p-3">
                  <ul className="list-inside list-disc text-sm text-gray-700">
                    {o.items.map((it, idx) => (
                      <li key={idx}>
                        #{it.item_id} × {it.qty}
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="p-3 text-right">฿{o.total_price}</td>
                <td className="p-3 text-right">
                  {o.status === 'preparing' ? (
                    <button
                      onClick={() => markReady(o.order_id)}
                      className="rounded-lg bg-green-600 px-3 py-2 text-white"
                    >
                      ทำเสร็จแล้ว
                    </button>
                  ) : (
                    <span className="text-sm text-gray-500">Ready</span>
                  )}
                </td>
              </tr>
            ))}
            {lists[tab].length === 0 && (
              <tr>
                <td className="p-6 text-center text-sm text-gray-500" colSpan={4}>
                  {tab === 'preparing' ? 'ยังไม่มีออเดอร์ในคิว' : 'ยังไม่มีออเดอร์ที่เสร็จสิ้น'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-2 text-xs text-gray-500">
        {loadingPreparing || loadingReady ? 'กำลังอัปเดตรายการ…' : 'อัปเดตเรียลไทม์ด้วย SSE'}
      </div>
    </div>
  );
}
