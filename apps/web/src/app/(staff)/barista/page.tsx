import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
import BaristaQueue from './barista-queue';
import { getOrders } from '@/features/order/api';

export const revalidate = 0;

export default async function BaristaPage() {
  const qc = new QueryClient();
  await qc.prefetchQuery({
    queryKey: ['orders', 'preparing'],
    queryFn: () => getOrders('preparing'),
  });
  await qc.prefetchQuery({ queryKey: ['orders', 'ready'], queryFn: () => getOrders('ready') });

  return (
    <div className="max-w-5xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Barista Queue</h1>
        <a href="/menu" className="text-blue-600 underline">
          กลับหน้าเมนู
        </a>
      </div>
      <HydrationBoundary state={dehydrate(qc)}>
        <BaristaQueue />
      </HydrationBoundary>
    </div>
  );
}
