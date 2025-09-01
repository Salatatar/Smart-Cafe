import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
import BaristaQueue from './barista-queue';
import { getOrders } from '@/features/order/api';
import Link from 'next/link';

export const revalidate = 0;

export default async function BaristaPage() {
  const qc = new QueryClient();
  await qc.prefetchQuery({
    queryKey: ['orders', 'preparing'],
    queryFn: () => getOrders('preparing'),
  });
  await qc.prefetchQuery({ queryKey: ['orders', 'ready'], queryFn: () => getOrders('ready') });

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
            <Link href="/analytics" className="hover:text-stone-900">
              ผู้จัดการ
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pt-8 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
              คิวบาริสต้า
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              จัดคิวเครื่องดื่มแบบเรียลไทม์ อัปเดตทันทีที่สั่ง
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/menu"
              className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              กลับหน้าเมนู
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <HydrationBoundary state={dehydrate(qc)}>
          <BaristaQueue />
        </HydrationBoundary>
      </section>

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
