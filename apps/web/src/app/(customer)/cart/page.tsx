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

  // ดึง state/actions ออกจาก cart store
  // const { items, total, clear, remove } = useCart();
  // ถ้าโปรเจ็กต์คุณใช้ Zustand แบบ selector ให้เปลี่ยนเป็น:
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
      clear(); // เคลียร์ได้เลย เพราะ UI จะเข้าโหมดสำเร็จจาก orderId
    } finally {
      setLoading(false);
    }
  };

  if (orderId) {
    return (
      <div className="mt-6 rounded-2xl border bg-white p-4 text-center">
        <div className="mb-2 font-medium">QR Code รับเครื่องดื่ม (Order #{orderId})</div>
        <div className="flex justify-center">
          <QRCodeCanvas value={`smartcafe:order:${orderId}`} size={180} />
        </div>
        <div className="mt-2 text-sm text-gray-600">
          แสดง QR นี้ที่เคาน์เตอร์เพื่อรับเครื่องดื่ม
        </div>
        <div className="mt-4 flex justify-center gap-2">
          <button
            className="rounded-xl border px-4 py-2"
            onClick={() => router.push(`/order/${orderId}`)}
          >
            ไปหน้าติดตามคำสั่งซื้อ
          </button>
          <Link href="/menu" className="rounded-xl bg-black px-4 py-2 text-white">
            เลือกเมนูต่อ
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mt-6">
        <p>ตะกร้าเปล่า</p>
        <Link href="/menu" className="text-blue-600 underline">
          กลับไปเลือกเมนู
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold">ตะกร้าสินค้า</h1>

      {items.length === 0 ? (
        <div className="mt-6">
          <p>ตะกร้าเปล่า</p>
          <Link href="/menu" className="text-blue-600 underline">
            กลับไปเลือกเมนู
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((i) => (
            <div
              key={i.item_id}
              className="flex items-center justify-between rounded-xl border bg-white p-3"
            >
              <div>
                <div className="font-medium">{i.name}</div>
                <div className="text-sm text-gray-600">
                  ฿{i.price} × {i.qty}
                </div>
              </div>
              <button className="text-red-600" onClick={() => remove(i.item_id)}>
                ลบ
              </button>
            </div>
          ))}

          <div className="flex items-center justify-between border-t pt-3">
            <div className="font-semibold">รวม</div>
            <div className="font-semibold">฿{total()}</div>
          </div>

          <div className="flex gap-3">
            <button
              disabled={loading}
              onClick={onCheckout}
              className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-50"
            >
              {loading ? 'กำลังสร้างคำสั่งซื้อ…' : 'ชำระเงิน (mock) & สร้างคำสั่งซื้อ'}
            </button>

            {orderId && (
              <button
                className="rounded-xl border px-4 py-2"
                onClick={() => router.push(`/order/${orderId}`)}
              >
                ไปหน้าติดตามคำสั่งซื้อ
              </button>
            )}
          </div>

          {orderId && (
            <div className="mt-6 rounded-2xl border bg-white p-4 text-center">
              <div className="mb-2 font-medium">QR Code รับเครื่องดื่ม (Order #{orderId})</div>
              <div className="flex justify-center">
                <QRCodeCanvas value={`smartcafe:order:${orderId}`} size={180} />
              </div>
              <div className="mt-2 text-sm text-gray-600">
                แสดง QR นี้ที่เคาน์เตอร์เพื่อรับเครื่องดื่ม
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
