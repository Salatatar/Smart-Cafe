'use client';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

  // ---------- NEW: optimistic update ----------
  const { mutate: markReady } = useMutation({
    mutationFn: (orderId: number) => updateOrder(orderId, 'ready'),
    onMutate: async (orderId: number) => {
      await qc.cancelQueries({ queryKey: ['orders'] });

      const prevPreparing = qc.getQueryData<Order[]>(['orders', 'preparing']) ?? [];
      const prevReady = qc.getQueryData<Order[]>(['orders', 'ready']) ?? [];

      // หาออเดอร์ที่จะขยับ
      const moving = prevPreparing.find((o) => o.order_id === orderId);
      if (!moving) {
        return { prevPreparing, prevReady };
      }

      // อัปเดต cache ทันที
      qc.setQueryData<Order[]>(
        ['orders', 'preparing'],
        prevPreparing.filter((o) => o.order_id !== orderId),
      );
      qc.setQueryData<Order[]>(['orders', 'ready'], [{ ...moving, status: 'ready' }, ...prevReady]);

      // ส่งค่ากลับไว้ rollback
      return { prevPreparing, prevReady };
    },
    onError: (_err, _orderId, ctx) => {
      // rollback ถ้า error
      if (!ctx) return;
      qc.setQueryData<Order[]>(['orders', 'preparing'], ctx.prevPreparing);
      qc.setQueryData<Order[]>(['orders', 'ready'], ctx.prevReady);
    },
    onSettled: () => {
      // sync กับ server เสมอ
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
  // ---------- END: optimistic update ----------

  // useEffect(() => {
  //   const unsub = subscribeOrders((ev) => {
  //     if (ev.type === 'order_created' || ev.type === 'order_updated') {
  //       qc.invalidateQueries({ queryKey: ['orders'] });
  //     }
  //   });
  //   return () => unsub();
  // }, [qc]);
  useEffect(() => {
    const unsub = subscribeOrders((ev) => {
      const getP = () => qc.getQueryData<Order[]>(['orders', 'preparing']) ?? [];
      const getR = () => qc.getQueryData<Order[]>(['orders', 'ready']) ?? [];

      if (ev.type === 'order_created') {
        const prevP = getP();
        if (!prevP.some((o) => o.order_id === ev.order_id)) {
          qc.setQueryData<Order[]>(
            ['orders', 'preparing'],
            [
              {
                order_id: ev.order_id,
                status: 'preparing',
                total_price: ev.total_price,
                items: ev.items ?? [],
                created_at: ev.created_at ?? new Date().toISOString(),
                completed_at: ev.completed_at ?? null,
              },
              ...prevP,
            ],
          );
        }
        return;
      }

      if (ev.type === 'order_updated' && ev.status === 'ready') {
        const prevP = getP();
        const moving = prevP.find((o) => o.order_id === ev.order_id);
        const newP = prevP.filter((o) => o.order_id !== ev.order_id);
        const prevR = getR();

        if (moving) {
          qc.setQueryData<Order[]>(['orders', 'preparing'], newP);
          qc.setQueryData<Order[]>(
            ['orders', 'ready'],
            [
              {
                ...moving,
                status: 'ready',
                completed_at: ev.completed_at ?? moving.completed_at ?? new Date().toISOString(),
              },
              ...prevR,
            ],
          );
        } else {
          const exists = prevR.some((o) => o.order_id === ev.order_id);
          qc.setQueryData<Order[]>(
            ['orders', 'ready'],
            exists
              ? prevR.map((o) =>
                  o.order_id === ev.order_id
                    ? {
                        ...o,
                        status: 'ready',
                        completed_at: ev.completed_at ?? o.completed_at ?? new Date().toISOString(),
                      }
                    : o,
                )
              : [
                  {
                    order_id: ev.order_id,
                    status: 'ready',
                    total_price: ev.total_price ?? 0,
                    items: ev.items ?? [],
                    created_at: new Date().toISOString(),
                    completed_at: ev.completed_at ?? new Date().toISOString(),
                  },
                  ...prevR,
                ],
          );
        }
      }
    });

    return () => unsub();
  }, [qc]);

  const lists = useMemo(() => ({ preparing, ready }), [preparing, ready]);

  useEffect(() => {
    console.log('lists:', lists);
  }, [lists]);

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
                  {/* <ul className="list-inside list-disc text-sm text-gray-700">
                    {o.items.map((it, idx) => (
                      <li key={idx}>
                        #{it.item_id} × {it.qty}
                      </li>
                    ))}
                  </ul> */}
                  <ul className="list-inside list-disc text-sm text-gray-700">
                    {(o.items ?? []).map((it, idx) => (
                      <li key={idx}>
                        {it.name ?? `#${it.item_id}`} × {it.qty}
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
