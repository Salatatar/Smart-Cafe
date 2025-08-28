'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchMenu, type MenuItem } from '@/features/menu/api';

export default function MenuList() {
  const { data = [], isLoading } = useQuery<MenuItem[]>({
    queryKey: ['menu'],
    queryFn: fetchMenu,
  });

  if (isLoading) return <div>กำลังโหลดเมนู...</div>;

  return (
    <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
      {data.map((m) => (
        <div key={m.item_id} className="rounded-2xl border bg-white p-3 shadow-sm">
          <div className="aspect-square w-full rounded-xl bg-gray-100" />
          <div className="mt-3 font-semibold">{m.name}</div>
          <div className="text-sm text-gray-600">฿{m.price}</div>
          <button className="mt-3 w-full rounded-xl bg-black px-3 py-2 text-white">
            เพิ่มใส่ตะกร้า
          </button>
        </div>
      ))}
    </div>
  );
}
