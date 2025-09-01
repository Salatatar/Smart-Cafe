'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchMenu, type MenuItem } from '@/features/menu/api';
import { useCart } from '@/features/cart/store';

function SkeletonCard() {
  return (
    <div className="rounded-2xl border bg-white p-3 shadow-sm animate-pulse">
      <div className="aspect-square w-full rounded-xl bg-stone-100" />
      <div className="mt-3 h-4 w-2/3 rounded bg-stone-100" />
      <div className="mt-2 h-3 w-1/3 rounded bg-stone-100" />
      <div className="mt-3 h-9 w-full rounded-xl bg-stone-200" />
    </div>
  );
}

export default function MenuList() {
  const {
    data = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<MenuItem[]>({
    queryKey: ['menu'],
    queryFn: fetchMenu,
    staleTime: 30_000,
    retry: 1,
  });

  const add = useCart((s) => s.add);

  if (isLoading) {
    return (
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mt-6 rounded-2xl border bg-amber-50 p-4 text-sm text-stone-700">
        ไม่สามารถโหลดเมนูได้ในขณะนี้
        <button onClick={() => refetch()} className="ml-2 underline">
          ลองอีกครั้ง
        </button>
      </div>
    );
  }

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border bg-white p-6 text-center text-stone-600">
        ยังไม่มีเมนูในขณะนี้
      </div>
    );
  }

  return (
    <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {data.map((m) => (
        <article
          key={m.id}
          className="group rounded-2xl border border-stone-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[radial-gradient(circle_at_30%_20%,rgba(245,158,11,.25),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(120,53,15,.2),transparent_35%),radial-gradient(circle_at_50%_80%,rgba(245,158,11,.2),transparent_40%)]">
            {/* ใส่ภาพจริงภายหลังได้ */}
            <span className="sr-only">{m.name}</span>
          </div>

          <h3 className="mt-3 line-clamp-1 font-semibold text-stone-900">{m.name}</h3>
          <p className="text-sm text-stone-600">฿{m.price}</p>

          <button
            onClick={() => add({ item_id: m.id, name: m.name, price: m.price, qty: 1 })}
            className="mt-3 w-full rounded-xl bg-stone-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2"
            aria-label={`เพิ่ม ${m.name} ใส่ตะกร้า`}
          >
            เพิ่มใส่ตะกร้า
          </button>
        </article>
      ))}
    </div>
  );
}
