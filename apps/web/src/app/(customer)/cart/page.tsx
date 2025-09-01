'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/features/cart/store';
import { createOrder } from '@/features/order/api';
import { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useShallow } from 'zustand/react/shallow';

export default function CartPage() {
  const router = useRouter();

  // ดึง state/actions ออกจาก cart store (แบบ selector เพื่อประสิทธิภาพ)
  const [items, total, clear, remove] = useCart(
    useShallow((s) => [s.items, s.total, s.clear, s.remove]),
  );

  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);

  const onCheckout = async () => {
    try {
      setLoading(true);
      const payload = {
        items: items.map(({ item_id, qty, toppings }) => ({ item_id, qty, toppings })),
        total_price: total(),
      };
      const { order_id } = await createOrder(payload);
      setOrderId(order_id);
      clear(); // เคลียร์ได้เลย เพราะหน้าจะเข้าโหมดสำเร็จ
    } finally {
      setLoading(false);
    }
  };

  // ===== Success state (แสดง QR + CTA) =====
  if (orderId) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-amber-50/40 via-white to-white">
        {/* Top bar */}
        <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/80 backdrop-blur">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-stone-900">
              <span aria-hidden>☕</span>
              <span className="font-semibold tracking-tight">Smart Café</span>
            </div>
            <nav className="hidden sm:flex items-center gap-6 text-sm text-stone-600">
              <Link href="/menu" className="hover:text-stone-900">
                เมนู
              </Link>
              <Link href="/barista" className="hover:text-stone-900">
                บาริสต้า
              </Link>
              <Link href="/analytics" className="hover:text-stone-900">
                ผู้จัดการ
              </Link>
            </nav>
          </div>
        </header>

        <section className="mx-auto max-w-6xl px-4 py-10">
          <div className="mx-auto max-w-lg rounded-3xl border border-stone-200 bg-white p-6 text-center shadow-sm">
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              สร้างคำสั่งซื้อสำเร็จ
            </h1>
            <p className="mt-1 text-sm text-stone-600">Order #{orderId}</p>

            <div className="mt-4 flex justify-center">
              <div className="rounded-2xl border border-stone-200 p-4 bg-stone-50">
                <QRCodeCanvas value={`smartcafe:order:${orderId}`} size={180} />
              </div>
            </div>

            <p className="mt-3 text-sm text-stone-600">
              แสดง QR นี้ที่เคาน์เตอร์เพื่อรับเครื่องดื่ม
            </p>

            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
              <button
                className="inline-flex justify-center rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                onClick={() => router.push(`/order/${orderId}`)}
              >
                ไปหน้าติดตามคำสั่งซื้อ
              </button>
              <Link
                href="/menu"
                className="inline-flex justify-center rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700"
              >
                เลือกเมนูต่อ
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  // ===== Empty state =====
  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-amber-50/40 via-white to-white">
        <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/80 backdrop-blur">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-stone-900">
              <span aria-hidden>☕</span>
              <span className="font-semibold tracking-tight">Smart Café</span>
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-6xl px-4 py-10">
          <div className="mx-auto max-w-md rounded-3xl border border-stone-200 bg-white p-6 text-center shadow-sm">
            <div className="text-5xl" aria-hidden>
              🧺
            </div>
            <h1 className="mt-2 text-xl font-semibold text-stone-900">ตะกร้าของคุณยังว่าง</h1>
            <p className="mt-1 text-sm text-stone-600">เริ่มต้นเลือกเครื่องดื่มแก้วโปรดได้เลย</p>
            <Link
              href="/menu"
              className="mt-4 inline-flex justify-center rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-800"
            >
              กลับไปเลือกเมนู
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // ===== Default (มีรายการในตะกร้า) =====
  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50/40 via-white to-white">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-stone-900">
            <span aria-hidden>☕</span>
            <span className="font-semibold tracking-tight">Smart Café</span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-stone-600">
            <Link href="/menu" className="hover:text-stone-900">
              เมนู
            </Link>
            <Link href="/barista" className="hover:text-stone-900">
              บาริสต้า
            </Link>
            <Link href="/analytics" className="hover:text-stone-900">
              ผู้จัดการ
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* รายการสินค้า */}
          <div className="lg:col-span-2 space-y-3">
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">ตะกร้าสินค้า</h1>

            {items.map((i) => (
              <div
                key={i.item_id}
                className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-xl bg-amber-50" aria-hidden />
                  <div>
                    <div className="font-medium text-stone-900">{i.name}</div>
                    <div className="text-sm text-stone-600">
                      ฿{i.price} × {i.qty}
                    </div>
                  </div>
                </div>
                <button
                  className="text-sm font-medium text-red-600 hover:underline"
                  onClick={() => remove(i.item_id)}
                >
                  ลบ
                </button>
              </div>
            ))}
          </div>

          {/* สรุปคำสั่งซื้อ (Sticky เต็มความสูงฝั่งขวาบนเดสก์ท็อป) */}
          <aside className="lg:sticky lg:top-20 self-start">
            <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="font-semibold">รวม</div>
                <div className="font-semibold">฿{total()}</div>
              </div>
              <button
                disabled={loading}
                onClick={onCheckout}
                className="mt-4 w-full rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                aria-live="polite"
              >
                {loading ? 'กำลังสร้างคำสั่งซื้อ…' : 'ชำระเงิน (mock) & สร้างคำสั่งซื้อ'}
              </button>
              <p className="mt-2 text-xs text-stone-500">
                ชำระเงินจำลองเพื่อสร้างคำสั่งซื้อและรับ QR
              </p>
            </div>
          </aside>
        </div>
      </section>

      {/* Action bar ล่างบนมือถือ */}
      <div className="lg:hidden sticky bottom-0 z-10 border-t border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="text-sm">
            <div className="text-stone-500">รวม</div>
            <div className="-mt-0.5 font-semibold text-stone-900">฿{total()}</div>
          </div>
          <button
            disabled={loading}
            onClick={onCheckout}
            className="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {loading ? 'กำลังสร้าง…' : 'ดำเนินการชำระเงิน'}
          </button>
        </div>
      </div>
    </main>
  );
}
