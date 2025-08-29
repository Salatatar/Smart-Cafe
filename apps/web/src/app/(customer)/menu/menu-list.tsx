'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchMenu, type MenuItem } from '@/features/menu/api';
import { useCart } from '@/features/cart/store';

export default function MenuList() {
  const { data = [], isLoading } = useQuery<MenuItem[]>({
    queryKey: ['menu'],
    queryFn: fetchMenu,
  });

  // ✅ ใช้ selector ตรงๆ
  const add = useCart((s) => s.add);

  if (!Array.isArray(data)) {
    return <div>ไม่มีเมนู</div>;
  }

  if (isLoading) return <div>กำลังโหลดเมนู...</div>;

  return (
    <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
      {data.map((m) => (
        <div key={m.item_id} className="rounded-2xl border bg-white p-3 shadow-sm">
          <div className="aspect-square w-full rounded-xl bg-gray-100" />
          <div className="mt-3 font-semibold">{m.name}</div>
          <div className="text-sm text-gray-600">฿{m.price}</div>
          <button
            onClick={() =>
              add({
                item_id: m.item_id!, // คงไว้ ถ้า MenuItem ยังเป็น optional
                name: m.name!,
                price: m.price!,
                qty: 1,
              })
            }
            className="mt-3 w-full rounded-xl bg-black px-3 py-2 text-white"
          >
            เพิ่มใส่ตะกร้า
          </button>
        </div>
      ))}
    </div>
  );
}
