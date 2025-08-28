import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
import Charts from './charts';
import { getSales, getTopMenu, getPeakHours } from '@/features/analytics/api';

export const revalidate = 0;

export default async function AnalyticsPage() {
  // ค่าเริ่มต้นเป็นเดือนปัจจุบัน
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const from = `${y}-${m}-01`;
  const to = `${y}-${m}-${String(new Date(y, now.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;

  const qc = new QueryClient();
  await qc.prefetchQuery({ queryKey: ['sales', { from, to }], queryFn: () => getSales(from, to) });
  await qc.prefetchQuery({
    queryKey: ['top', { from, to }],
    queryFn: () => getTopMenu(from, to, 10),
  });
  await qc.prefetchQuery({
    queryKey: ['hours', { from, to }],
    queryFn: () => getPeakHours(from, to),
  });

  return (
    <div className="max-w-6xl">
      <h1 className="mb-4 text-2xl font-bold">Manager Analytics</h1>
      <HydrationBoundary state={dehydrate(qc)}>
        <Charts defaultFrom={from} defaultTo={to} />
      </HydrationBoundary>
    </div>
  );
}
