import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import OrderStatus from './order-status';
import { getOrder } from '@/features/order/api';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function OrderPage({ params }: Props) {
  const { id } = await params; // ⬅️ รอให้ params resolve ก่อน
  const orderId = Number(id);

  const qc = new QueryClient();
  await qc.prefetchQuery({
    queryKey: ['order', orderId],
    queryFn: () => getOrder(orderId),
  });

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <OrderStatus id={orderId} />
    </HydrationBoundary>
  );
}
