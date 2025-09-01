'use client';

import Link from 'next/link';
import { useCart } from '@/features/cart/store';

// นับจำนวนรวมของสินค้าในตะกร้า
function useCartCount() {
  return useCart((s) => s.items?.reduce((sum, it) => sum + (it.qty ?? 0), 0) ?? 0);
}

export default function CartLink() {
  const count = useCartCount();

  return (
    <Link
      href="/cart"
      className="relative inline-flex items-center rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
      aria-label={`ไปที่ตะกร้า (${count} รายการ)`}
    >
      ไปที่ตะกร้า
      {/* Badge จำนวน */}
      <span
        aria-live="polite"
        className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full px-2 text-xs font-semibold
                   text-white bg-stone-900"
      >
        {count}
      </span>
    </Link>
  );
}
