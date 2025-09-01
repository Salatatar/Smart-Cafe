import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import OrderStatus from './order-status';
import { getOrder } from '@/features/order/api';

export const revalidate = 0; // ให้เป็น fresh เสมอ

type Props = { params: Promise<{ id: string }> };

export default async function OrderPage({ params }: Props) {
  const { id } = await params; // รอให้ params resolve ก่อน (Next 15)
  const orderId = Number(id);

  const qc = new QueryClient();
  await qc.prefetchQuery({ queryKey: ['order', orderId], queryFn: () => getOrder(orderId) });

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

      <section className="mx-auto max-w-6xl px-4 pt-8 pb-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
              ติดตามคำสั่งซื้อ
            </h1>
            <p className="mt-1 text-sm text-stone-600">Order #{orderId}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/menu"
              className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              กลับไปเลือกเมนู
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <HydrationBoundary state={dehydrate(qc)}>
          <OrderStatus id={orderId} />
        </HydrationBoundary>
      </section>

      {/* Footer สั้น ๆ */}
      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-stone-600 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>&copy; {new Date().getFullYear()} Smart Café</p>
          <nav className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-stone-900">
              นโยบายความเป็นส่วนตัว
            </Link>
            <Link href="/terms" className="hover:text-stone-900">
              ข้อตกลงการใช้งาน
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
