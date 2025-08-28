import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
import { fetchMenu } from '@/features/menu/api';
import MenuList from './menu-list';

export const revalidate = 0; // ให้เป็น fresh เสมอ (ตาม real-time API)

export default async function MenuPage() {
  const qc = new QueryClient();

  // Prefetch บน server
  await qc.prefetchQuery({
    queryKey: ['menu'],
    queryFn: fetchMenu,
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">เมนูเครื่องดื่ม</h1>
        {/* ใส่ลิงก์ไป cart */}
        <a className="text-blue-600 underline" href="/cart">
          ไปที่ตะกร้า
        </a>
      </div>

      {/* ส่ง dehydrated state ให้ฝั่ง client */}
      <HydrationBoundary state={dehydrate(qc)}>
        <MenuList />
      </HydrationBoundary>
    </div>
  );
}
