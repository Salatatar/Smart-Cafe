'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getOrders, updateOrder, type Order } from '@/features/order/api';
import { subscribeOrders } from '@/features/order/sse';

function SkeletonRow() {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm animate-pulse">
      <div className="flex items-center justify-between gap-3">
        <div className="h-4 w-24 rounded bg-stone-100" />
        <div className="h-4 w-16 rounded bg-stone-100" />
      </div>
      <div className="mt-3 h-3 w-2/3 rounded bg-stone-100" />
    </div>
  );
}

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

  // ---------- Optimistic update ----------
  const { mutate: markReady, isPending: marking } = useMutation({
    mutationFn: (orderId: number) => updateOrder(orderId, 'ready'),
    onMutate: async (orderId: number) => {
      await qc.cancelQueries({ queryKey: ['orders'] });
      const prevPreparing = qc.getQueryData<Order[]>(['orders', 'preparing']) ?? [];
      const prevReady = qc.getQueryData<Order[]>(['orders', 'ready']) ?? [];
      const moving = prevPreparing.find((o) => o.order_id === orderId);
      if (!moving) return { prevPreparing, prevReady };
      qc.setQueryData<Order[]>(
        ['orders', 'preparing'],
        prevPreparing.filter((o) => o.order_id !== orderId),
      );
      qc.setQueryData<Order[]>(['orders', 'ready'], [{ ...moving, status: 'ready' }, ...prevReady]);
      return { prevPreparing, prevReady };
    },
    onError: (_e, _id, ctx) => {
      if (!ctx) return;
      qc.setQueryData<Order[]>(['orders', 'preparing'], ctx.prevPreparing);
      qc.setQueryData<Order[]>(['orders', 'ready'], ctx.prevReady);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
  // ---------- END ----------

  // Live updates via SSE
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

  const countPreparing = preparing.length;
  const countReady = ready.length;
  const busy = loadingPreparing || loadingReady || marking;

  return (
    <section>
      {/* Tabs */}
      <div className="inline-flex rounded-2xl border border-stone-200 bg-white p-1 shadow-sm">
        {(['preparing', 'ready'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative rounded-xl px-4 py-2 text-sm font-medium transition-colors 
              ${tab === t ? 'bg-stone-900 text-white' : 'text-stone-700 hover:bg-stone-50'}`}
          >
            {t === 'preparing' ? 'คิวที่กำลังทำ' : 'พร้อมรับแล้ว'}
            <span
              className={`ml-2 inline-flex min-w-5 items-center justify-center rounded-full px-2 text-xs font-semibold 
              ${tab === t ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'}`}
              aria-live="polite"
            >
              {t === 'preparing' ? countPreparing : countReady}
            </span>
          </button>
        ))}
      </div>

      {/* Desktop table */}
      <div className="mt-4 hidden md:block rounded-3xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full table-fixed">
          <thead>
            <tr className="border-b text-left text-sm text-stone-600">
              <th className="p-4 w-28">ออเดอร์</th>
              <th className="p-4">รายการ</th>
              <th className="p-4 w-32 text-right">รวม</th>
              <th className="p-4 w-44 text-right">การทำงาน</th>
            </tr>
          </thead>
          <tbody>
            {(lists[tab] ?? []).map((o) => (
              <tr key={o.order_id} className="border-b last:border-0 align-top">
                <td className="p-4 font-semibold text-stone-900">#{o.order_id}</td>
                <td className="p-4">
                  <ul className="list-inside list-disc text-sm text-stone-700">
                    {(o.items ?? []).map((it, idx) => (
                      <li key={idx}>
                        {it.name ?? `#${it.item_id}`} × {it.qty}
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="p-4 text-right font-medium">฿{o.total_price}</td>
                <td className="p-4 text-right">
                  {o.status === 'preparing' ? (
                    <button
                      onClick={() => markReady(o.order_id)}
                      className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                      disabled={marking}
                    >
                      ทำเสร็จแล้ว
                    </button>
                  ) : (
                    <span className="text-sm text-stone-500">Ready</span>
                  )}
                </td>
              </tr>
            ))}
            {lists[tab]?.length === 0 && (
              <tr>
                <td className="p-6 text-center text-sm text-stone-500" colSpan={4}>
                  {tab === 'preparing' ? 'ยังไม่มีออเดอร์ในคิว' : 'ยังไม่มีออเดอร์ที่เสร็จสิ้น'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile list */}
      <div className="mt-4 space-y-3 md:hidden">
        {busy && (
          <>
            <SkeletonRow />
            <SkeletonRow />
          </>
        )}
        {(lists[tab] ?? []).map((o) => (
          <div
            key={o.order_id}
            className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="font-semibold text-stone-900">Order #{o.order_id}</div>
              <div className="text-sm font-medium text-stone-800">฿{o.total_price}</div>
            </div>
            <ul className="mt-2 list-inside list-disc text-sm text-stone-700">
              {(o.items ?? []).map((it, idx) => (
                <li key={idx}>
                  {it.name ?? `#${it.item_id}`} × {it.qty}
                </li>
              ))}
            </ul>
            <div className="mt-3 text-right">
              {o.status === 'preparing' ? (
                <button
                  onClick={() => markReady(o.order_id)}
                  className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                  disabled={marking}
                >
                  ทำเสร็จแล้ว
                </button>
              ) : (
                <span className="text-sm text-stone-500">Ready</span>
              )}
            </div>
          </div>
        ))}
        {lists[tab]?.length === 0 && !busy && (
          <div className="rounded-2xl border border-stone-200 bg-white p-6 text-center text-sm text-stone-500">
            {tab === 'preparing' ? 'ยังไม่มีออเดอร์ในคิว' : 'ยังไม่มีออเดอร์ที่เสร็จสิ้น'}
          </div>
        )}
      </div>

      <div className="mt-3 text-xs text-stone-500">
        {busy ? 'กำลังอัปเดตรายการ…' : 'อัปเดตเรียลไทม์ด้วย SSE'}
      </div>
    </section>
  );
}
