import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
import { fetchMenu } from '@/features/menu/api';
import MenuList from './menu-list';
import CartLink from './cart-link';
import Link from 'next/link';

export const revalidate = 0; // fresh เสมอ (ตาม real-time API)

export default async function MenuPage() {
  const qc = new QueryClient();

  // Prefetch บน server
  await qc.prefetchQuery({ queryKey: ['menu'], queryFn: fetchMenu });

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50/40 via-white to-white">
      {/* Top bar แบบเรียบง่าย */}
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-stone-900">
            <span aria-hidden>☕</span>
            <span className="font-semibold tracking-tight">Smart Café</span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-stone-600">
            <Link href="/" className="hover:text-stone-900">
              หน้าแรก
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

      {/* Hero / Heading */}
      <section className="mx-auto max-w-6xl px-4 pt-8 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
              เมนูเครื่องดื่ม
            </h1>
            <p className="mt-2 max-w-prose text-stone-600 text-sm sm:text-base">
              เลือกสั่งเมนูโปรดของคุณได้ทันที — ดีไซน์มินิมอล ใช้งานง่าย รองรับทุกหน้าจอ
            </p>
          </div>

          {/* Quick actions */}
          {/* <div className="flex items-center gap-2">
            <Link
              href="/cart"
              className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              ไปที่ตะกร้า
            </Link>
          </div> */}
          <div className="flex items-center gap-2">
            <CartLink />
          </div>
        </div>

        {/* Filters (placeholder – ต่อ API ได้ภายหลัง) */}
        {/* <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="col-span-2">
            <label className="sr-only" htmlFor="q">ค้นหาเมนู</label>
            <div className="relative">
              <input
                id="q"
                type="text"
                placeholder="ค้นหาเมนู เช่น Latte, Americano"
                className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-2.5 text-sm shadow-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                // TODO: ผูก state + คิวรีจริงในอนาคต
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">⌕</span>
            </div>
          </div>
          <div>
            <select className="w-full rounded-2xl border border-stone-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
              <option value="all">ทุกหมวดหมู่</option>
              <option value="coffee">กาแฟ</option>
              <option value="non-coffee">ไม่ใช่กาแฟ</option>
              <option value="tea">ชา</option>
            </select>
          </div>
        </div> */}
      </section>

      {/* Content */}
      <section className="mx-auto max-w-6xl px-4 pb-12">
        {/* ส่ง dehydrated state ให้ฝั่ง client */}
        <HydrationBoundary state={dehydrate(qc)}>
          <MenuList />
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
